/**
 * /api/analytics: the numbers behind the Analytics tab in /review.
 *
 * Reads the Google Analytics 4 data the site collects through track() in
 * src/data/analytics.ts. A Google service account with Viewer access to the GA4 property
 * signs in from the worker; its JSON key lives in the GA_SERVICE_ACCOUNT
 * secret, set by Dalia with `npx wrangler secret put GA_SERVICE_ACCOUNT`.
 *
 * Access uses the same password as /review. The worker never stores it: it
 * asks the Apps Script to check it (the review "ping"), then remembers only a
 * SHA-256 hash of an accepted password for 10 minutes. Wrong passwords are
 * counted per IP in KV; after 10 in 15 minutes the endpoint refuses every
 * check (429) before asking the Apps Script, which keeps its own lockout.
 *
 * The pure math (KPI changes, takeaways, before/after windows around the site
 * changes in src/data/changes.ts) lives in src/data/insights.ts; wrangler's
 * bundler compiles those TypeScript imports.
 */

import { APPS_SCRIPT_URL } from "./config.js";
import { CHANGES } from "../src/data/changes.ts";
import {
  addDays, beforeAfter, fallbackFunnel, fillDays, giftStats, kpis, lowClickGifts, takeaways, todayIn,
} from "../src/data/insights.ts";

const MEASUREMENT_ID = "G-4TNQSM74DH";
const DATA_API = "https://analyticsdata.googleapis.com";
const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const AUTH_TTL_S = 10 * 60;
const MAX_FAILS = 10;
const FAIL_WINDOW_S = 15 * 60;
const REPORT_TTL_S = 10 * 60;
const ALLOWED_DAYS = [7, 30, 90];

// Event parameters the dashboard breaks down by. GA4 only reports a parameter
// once it is registered as an event-scoped custom dimension, from that day on.
const CUSTOM_DIMS = ["destination", "gift_name", "step_index", "question_id", "recipient", "interest", "results_band"];

const SERIES_DAYS = 90;
const DAILY_EVENTS = ["quiz_start", "quiz_step_view", "quiz_complete", "gift_open", "gift_buy_click"];
const COUNT_EVENTS = [
  "quiz_start", "quiz_complete", "gift_open", "gift_buy_click", "results_load_more",
  "results_refine", "gift_save", "gift_share", "request_more",
];

let tokenCache = null; // { token, exp } for this isolate

const JSON_HEADERS = { "content-type": "application/json", "cache-control": "no-store", "x-robots-tag": "noindex" };
const respond = (body, status = 200) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: JSON_HEADERS });

// Password check outcomes and the HTTP status each one answers with.
const AUTH_STATUS = { wrong_password: 401, locked: 429, auth_unavailable: 503 };

export async function serveAnalytics(request, url) {
  if (request.method !== "GET") return respond({ ok: false, error: "method" }, 405);
  const auth = await checkReviewSecret(request);
  if (auth !== "ok") return respond({ ok: false, error: auth }, AUTH_STATUS[auth]);
  if (typeof GA_SERVICE_ACCOUNT === "undefined" || !GA_SERVICE_ACCOUNT) {
    return respond({ ok: false, error: "not_configured" });
  }

  const days = ALLOWED_DAYS.includes(Number(url.searchParams.get("days"))) ? Number(url.searchParams.get("days")) : 30;
  const fresh = url.searchParams.get("fresh") === "1";
  const cacheKey = `analytics:v2:${days}`;
  if (!fresh) {
    const cached = await GIFTS_CACHE.get(cacheKey);
    if (cached) return respond(cached);
  }

  try {
    const body = JSON.stringify({ ok: true, ...(await buildReport(days, fresh)) });
    await GIFTS_CACHE.put(cacheKey, body, { expirationTtl: REPORT_TTL_S });
    return respond(body);
  } catch (err) {
    return respond({ ok: false, error: "ga_error", detail: String((err && err.message) || err).slice(0, 300) });
  }
}

/* ---------------- access ---------------- */

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** "ok", "wrong_password", "locked", or "auth_unavailable" (the Apps Script could not answer). */
async function checkReviewSecret(request) {
  const failKey = `review-fail:${request.headers.get("cf-connecting-ip") || "unknown"}`;
  const fails = Number(await GIFTS_CACHE.get(failKey)) || 0;
  if (fails >= MAX_FAILS) return "locked";
  const secret = request.headers.get("x-review-secret") || "";
  if (!secret) return "wrong_password";

  const okKey = `review-ok:${await sha256Hex(secret)}`;
  if (await GIFTS_CACHE.get(okKey)) return "ok";
  // Apps Script's redirect sometimes answers with an HTML 404 although the
  // script ran, so retry a few times before giving up.
  for (let i = 0; i < 3; i++) {
    let out = null;
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ type: "review", secret, action: "ping" }),
        redirect: "follow",
      });
      out = await res.json();
    } catch {
      continue; // not JSON (the HTML 404) or a network error: try again
    }
    if (out && out.ok === true) {
      await GIFTS_CACHE.put(okKey, "1", { expirationTtl: AUTH_TTL_S });
      return "ok";
    }
    if (out && out.error === "locked") return "locked";
    if (out && out.error === "unauthorized") {
      await GIFTS_CACHE.put(failKey, String(fails + 1), { expirationTtl: FAIL_WINDOW_S });
      return "wrong_password";
    }
    return "auth_unavailable"; // not_configured or an answer we don't know
  }
  return "auth_unavailable";
}

/* ---------------- Google auth ---------------- */

function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function googleToken() {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp - 60 > now) return tokenCache.token;
  const sa = JSON.parse(GA_SERVICE_ACCOUNT);
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = b64url(enc.encode(JSON.stringify({
    iss: sa.client_email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  })));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(`${header}.${claims}`)));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${header}.${claims}.${b64url(sig)}`,
  });
  const out = await res.json();
  if (!out.access_token) throw new Error(`Google sign-in failed: ${out.error_description || out.error || res.status}`);
  tokenCache = { token: out.access_token, exp: now + (out.expires_in || 3600) };
  return tokenCache.token;
}

async function gaFetch(path, body, base = DATA_API) {
  const token = await googleToken();
  const res = await fetch(`${base}${path}`, {
    method: body ? "POST" : "GET",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const out = await res.json();
  if (!res.ok) throw new Error(out.error ? out.error.message : `HTTP ${res.status} on ${path}`);
  return out;
}

/** The numeric GA4 property behind the site's measurement ID, found once and kept in KV. */
async function propertyId() {
  if (typeof GA_PROPERTY_ID !== "undefined" && GA_PROPERTY_ID) return String(GA_PROPERTY_ID);
  const cached = await GIFTS_CACHE.get("analytics:property");
  if (cached) return cached;
  const summaries = await gaFetch("/accountSummaries?pageSize=200", null, ADMIN_API);
  for (const acct of summaries.accountSummaries || []) {
    for (const p of acct.propertySummaries || []) {
      const id = p.property.split("/")[1];
      const streams = await gaFetch(`/properties/${id}/dataStreams`, null, ADMIN_API);
      if ((streams.dataStreams || []).some((s) => s.webStreamData && s.webStreamData.measurementId === MEASUREMENT_ID)) {
        await GIFTS_CACHE.put("analytics:property", id);
        return id;
      }
    }
  }
  throw new Error(`No GA4 property with stream ${MEASUREMENT_ID} is shared with the service account`);
}

/* ---------------- reports ---------------- */

const num = (v) => Number(v || 0);
const inList = (field, values) => ({ filter: { fieldName: field, inListFilter: { values } } });
const eq = (field, value) => ({ filter: { fieldName: field, stringFilter: { value } } });
const begins = (field, value) => ({ filter: { fieldName: field, stringFilter: { matchType: "BEGINS_WITH", value } } });
const notSet = (v) => v && v !== "(not set)";

/** Report rows as objects keyed by the response's own header names (a second date range adds a dateRange column). */
function rows(report) {
  const dims = ((report && report.dimensionHeaders) || []).map((h) => h.name);
  const mets = ((report && report.metricHeaders) || []).map((h) => h.name);
  return ((report && report.rows) || []).map((r) => {
    const o = {};
    dims.forEach((d, i) => { o[d] = r.dimensionValues[i].value; });
    mets.forEach((m, i) => { o[m] = num(r.metricValues[i].value); });
    return o;
  });
}

/** Rows of a two-range report, split into the current and previous periods. */
function byRange(list) {
  if (!list.some((r) => "dateRange" in r)) return { current: list, previous: [] };
  const strip = (r) => {
    const o = { ...r };
    delete o.dateRange;
    return o;
  };
  return {
    current: list.filter((r) => r.dateRange === "current").map(strip),
    previous: list.filter((r) => r.dateRange === "previous").map(strip),
  };
}

function periodData(totalRows, eventRows, resultRows) {
  return {
    totals: totalRows[0] || {},
    events: Object.fromEntries(eventRows.map((r) => [r.eventName, { eventCount: r.eventCount, totalUsers: r.totalUsers }])),
    results: resultRows.reduce((a, r) => ({
      views: a.views + r.screenPageViews, seconds: a.seconds + r.userEngagementDuration, users: a.users + r.activeUsers,
    }), { views: 0, seconds: 0, users: 0 }),
  };
}

/** Runs named report requests, five per batchRunReports call (the API's limit), and returns the reports by name. */
async function runReports(id, named) {
  const keys = Object.keys(named);
  const chunks = [];
  for (let i = 0; i < keys.length; i += 5) chunks.push(keys.slice(i, i + 5));
  const outs = await Promise.all(chunks.map((ks) =>
    gaFetch(`/v1beta/properties/${id}:batchRunReports`, { requests: ks.map((k) => named[k]) }).then((r) => r.reports || [])));
  const byName = {};
  chunks.forEach((ks, ci) => ks.forEach((k, i) => { byName[k] = outs[ci][i]; }));
  return byName;
}

/** The GA property's time zone, so "today" here matches GA's "today". Kept in KV for a week. */
async function propertyTimeZone(id) {
  const key = `analytics:tz:${id}`;
  const cached = await GIFTS_CACHE.get(key);
  if (cached) return cached;
  try {
    const p = await gaFetch(`/properties/${id}`, null, ADMIN_API);
    if (p.timeZone) {
      await GIFTS_CACHE.put(key, p.timeZone, { expirationTtl: 7 * 24 * 60 * 60 });
      return p.timeZone;
    }
  } catch {
    // fall back to UTC below
  }
  return "UTC";
}

/**
 * Day-by-day numbers for the last 90 days, fetched once and shared by every
 * range (KV, 10 minutes). The before/after windows around site changes and
 * the day-by-day chart both read from it.
 */
async function dailySeries(id, fresh) {
  const key = "analytics:v2:daily";
  if (!fresh) {
    const cached = await GIFTS_CACHE.get(key, "json");
    if (cached) return cached;
  }
  const today = todayIn(await propertyTimeZone(id));
  const start = addDays(today, -(SERIES_DAYS - 1));
  const dateRanges = [{ startDate: `${SERIES_DAYS - 1}daysAgo`, endDate: "today" }];
  const r = await runReports(id, {
    visits: { dateRanges, dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }] },
    events: { dateRanges, dimensions: [{ name: "date" }, { name: "eventName" }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      dimensionFilter: inList("eventName", DAILY_EVENTS) },
    results: { dateRanges, dimensions: [{ name: "date" }], metrics: [{ name: "screenPageViews" }],
      dimensionFilter: begins("pagePath", "/results") },
  });
  const days = {};
  const day = (d) => (days[d] = days[d] || {
    date: d, visitors: 0, quizStarters: 0, quizFinishers: 0, quizzes: 0, opens: 0, storeClicks: 0, resultsViews: 0,
  });
  for (const v of rows(r.visits)) day(v.date).visitors = v.activeUsers;
  for (const v of rows(r.results)) day(v.date).resultsViews = v.screenPageViews;
  for (const v of rows(r.events)) {
    const d = day(v.date);
    if (v.eventName === "quiz_start" || v.eventName === "quiz_step_view") d.quizStarters = Math.max(d.quizStarters, v.totalUsers);
    if (v.eventName === "quiz_complete") Object.assign(d, { quizFinishers: v.totalUsers, quizzes: v.eventCount });
    if (v.eventName === "gift_open") d.opens = v.eventCount;
    if (v.eventName === "gift_buy_click") d.storeClicks = v.eventCount;
  }
  const series = { start, today, rows: fillDays(Object.values(days), start, today) };
  await GIFTS_CACHE.put(key, JSON.stringify(series), { expirationTtl: REPORT_TTL_S });
  return series;
}

async function buildReport(days, fresh) {
  const id = await propertyId();
  const range = { startDate: `${days - 1}daysAgo`, endDate: "today" };
  const current = [{ ...range, name: "current" }];
  // The previous period of the same length, for the change on each KPI tile.
  const both = [...current, { startDate: `${2 * days - 1}daysAgo`, endDate: `${days}daysAgo`, name: "previous" }];

  const meta = await gaFetch(`/v1beta/properties/${id}/metadata`);
  const registered = new Set((meta.dimensions || []).map((d) => d.apiName));
  const has = (p) => registered.has(`customEvent:${p}`);
  const missingDims = CUSTOM_DIMS.filter((p) => !has(p));

  const buyClicks = eq("eventName", "gift_buy_click");
  const named = {
    totals: { dateRanges: both, metrics: [{ name: "activeUsers" }, { name: "sessions" }] },
    events: { dateRanges: both, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      dimensionFilter: inList("eventName", COUNT_EVENTS) },
    results: { dateRanges: both, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }, { name: "userEngagementDuration" }, { name: "activeUsers" }],
      dimensionFilter: begins("pagePath", "/results") },
    sources: { dateRanges: current, dimensions: [{ name: "sessionSource" }], metrics: [{ name: "sessions" }, { name: "engagedSessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 },
    sourceClicks: { dateRanges: current, dimensions: [{ name: "sessionSource" }], metrics: [{ name: "eventCount" }], dimensionFilter: buyClicks },
    devices: { dateRanges: current, dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "sessions" }] },
    deviceClicks: { dateRanges: current, dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "eventCount" }], dimensionFilter: buyClicks },
    newVsReturning: { dateRanges: current, dimensions: [{ name: "newVsReturning" }], metrics: [{ name: "activeUsers" }] },
  };
  const byEvent = (param, eventName, extra = {}) => ({
    dateRanges: current, dimensions: [{ name: `customEvent:${param}` }], metrics: [{ name: "eventCount" }],
    dimensionFilter: eq("eventName", eventName), orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], ...extra,
  });
  if (has("destination")) named.destinations = byEvent("destination", "gift_buy_click");
  if (has("gift_name")) {
    named.gifts = { dateRanges: current, dimensions: [{ name: "eventName" }, { name: "customEvent:gift_name" }], metrics: [{ name: "eventCount" }],
      dimensionFilter: inList("eventName", ["gift_open", "gift_buy_click"]),
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: 1000 };
  }
  if (has("step_index")) {
    named.quizSteps = { dateRanges: current, dimensions: [{ name: "customEvent:step_index" }], metrics: [{ name: "totalUsers" }],
      dimensionFilter: eq("eventName", "quiz_step_view") };
  }
  if (has("recipient")) named.recipients = byEvent("recipient", "quiz_complete");
  if (has("interest")) named.interests = byEvent("interest", "quiz_interest");
  if (has("results_band")) named.resultsBands = byEvent("results_band", "results_view");

  const [r, series, funnel] = await Promise.all([runReports(id, named), dailySeries(id, fresh), funnelReport(id, [range])]);

  const t = byRange(rows(r.totals));
  const e = byRange(rows(r.events));
  const p = byRange(rows(r.results));
  const now = periodData(t.current, e.current, p.current);
  const before = periodData(t.previous, e.previous, p.previous);

  const clicksBy = (report, dim) => Object.fromEntries(rows(report).map((x) => [x[dim], x.eventCount]));
  const sourceClicks = clicksBy(r.sourceClicks, "sessionSource");
  const deviceClicks = clicksBy(r.deviceClicks, "deviceCategory");
  const sources = rows(r.sources).map((s) => ({ ...s, storeClicks: sourceClicks[s.sessionSource] || 0 }));
  const devices = rows(r.devices).map((d) => ({ ...d, storeClicks: deviceClicks[d.deviceCategory] || 0 }));
  const funnelOut = funnel.steps.length ? funnel : { ...funnel, steps: fallbackFunnel(now) };

  const counted = (report, param, as) => rows(report)
    .filter((x) => notSet(x[`customEvent:${param}`]))
    .map((x) => ({ [as]: x[`customEvent:${param}`], count: x.eventCount }));
  const gifts = r.gifts
    ? giftStats(rows(r.gifts).map((x) => ({ eventName: x.eventName, name: x["customEvent:gift_name"], eventCount: x.eventCount })))
    : null;

  const trendFrom = addDays(series.today, -(days - 1));
  return {
    days, generatedAt: new Date().toISOString(), today: series.today, missingDims,
    totals: now.totals, events: now.events, results: now.results,
    kpis: { current: kpis(now), previous: kpis(before) },
    takeaways: takeaways({ days, current: now, previous: before, funnel: funnelOut, sources }),
    funnel: funnelOut,
    trend: series.rows.filter((d) => d.date >= trendFrom)
      .map((d) => ({ date: d.date, visitors: d.visitors, quizzes: d.quizzes, storeClicks: d.storeClicks })),
    changes: beforeAfter(series.rows, series.start, series.today, CHANGES),
    sources, devices,
    newVsReturning: rows(r.newVsReturning),
    destinations: r.destinations ? rows(r.destinations) : null,
    gifts: gifts && gifts.slice(0, 40),
    lowClickGifts: gifts && lowClickGifts(gifts),
    quizSteps: r.quizSteps ? rows(r.quizSteps) : null,
    recipients: r.recipients ? counted(r.recipients, "recipient", "recipient") : null,
    interests: r.interests ? counted(r.interests, "interest", "interest") : null,
    resultsBands: r.resultsBands ? counted(r.resultsBands, "results_band", "band") : null,
  };
}

/** Closed funnel by user: each step counts people who also did every earlier step. */
async function funnelReport(id, dateRanges) {
  const step = (name, expr) => ({ name, filterExpression: expr });
  const ev = (eventName) => ({ funnelEventFilter: { eventName } });
  const steps = [
    step("Visited", { funnelFieldFilter: { fieldName: "eventName", stringFilter: { value: "page_view" } } }),
    step("Started the quiz", { orGroup: { expressions: [ev("quiz_start"), ev("quiz_step_view")] } }),
    step("Finished the quiz", ev("quiz_complete")),
    step("Saw results", { andGroup: { expressions: [
      { funnelFieldFilter: { fieldName: "eventName", stringFilter: { value: "page_view" } } },
      { funnelFieldFilter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/results" } } },
    ] } }),
    step("Opened a gift", ev("gift_open")),
    step("Clicked to a store", ev("gift_buy_click")),
  ];
  try {
    const out = await gaFetch(`/v1alpha/properties/${id}:runFunnelReport`, {
      dateRanges, funnel: { isOpenFunnel: false, steps },
    });
    const table = out.funnelTable || {};
    const users = {};
    for (const r of table.rows || []) {
      const stepName = r.dimensionValues[0].value.replace(/^\d+\.\s*/, "");
      users[stepName] = num(r.metricValues[0].value);
    }
    return { closed: true, steps: steps.map((s) => ({ name: s.name, users: users[s.name] || 0 })) };
  } catch (err) {
    return { closed: false, error: String((err && err.message) || err).slice(0, 200), steps: [] };
  }
}
