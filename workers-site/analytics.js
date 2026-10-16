/**
 * /api/analytics: the numbers behind the Analytics tab in /review.
 *
 * Reads the Google Analytics 4 data the site already collects (no extra
 * tracking). A Google service account with Viewer access to the GA4 property
 * signs in from the worker; its JSON key lives in the GA_SERVICE_ACCOUNT
 * secret, set by Dalia with `npx wrangler secret put GA_SERVICE_ACCOUNT`.
 *
 * Access uses the same password as /review. The worker never stores it: it
 * asks the Apps Script to check it (the review "ping"), then remembers only a
 * SHA-256 hash of an accepted password for 12 hours.
 */

const APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwPuaXtXuurdqNg94_mGoOR1YHXqKrJyZrkxkt09oFbGGZtS_KdH44vhJNn4qLzeJqhuQ/exec";
const MEASUREMENT_ID = "G-4TNQSM74DH";
const DATA_API = "https://analyticsdata.googleapis.com";
const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const AUTH_TTL_S = 12 * 60 * 60;
const REPORT_TTL_S = 10 * 60;
const ALLOWED_DAYS = [7, 30, 90];

// Event parameters the dashboard breaks down by. GA4 only reports a parameter
// once it is registered as an event-scoped custom dimension, from that day on.
const CUSTOM_DIMS = ["destination", "gift_name", "step_index", "question_id"];

const FUNNEL_EVENTS = ["quiz_start", "quiz_step_view", "quiz_complete", "gift_open", "gift_buy_click"];
const TREND_EVENTS = ["quiz_complete", "gift_buy_click"];
const COUNT_EVENTS = [
  "quiz_start", "quiz_complete", "gift_open", "gift_buy_click", "results_load_more",
  "results_refine", "gift_save", "gift_share", "request_more",
];

let tokenCache = null; // { token, exp } for this isolate

export async function serveAnalytics(request, url) {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store", "x-robots-tag": "noindex" },
    });

  if (request.method !== "GET") return json({ ok: false, error: "method" }, 405);
  const secret = request.headers.get("x-review-secret") || "";
  if (!secret || !(await reviewSecretOk(secret))) return json({ ok: false, error: "unauthorized" }, 401);
  if (typeof GA_SERVICE_ACCOUNT === "undefined" || !GA_SERVICE_ACCOUNT) {
    return json({ ok: false, error: "not_configured" });
  }

  const days = ALLOWED_DAYS.includes(Number(url.searchParams.get("days"))) ? Number(url.searchParams.get("days")) : 30;
  const cacheKey = `analytics:v1:${days}`;
  if (url.searchParams.get("fresh") !== "1") {
    const cached = await GIFTS_CACHE.get(cacheKey);
    if (cached) return new Response(cached, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }

  try {
    const body = JSON.stringify({ ok: true, ...(await buildReport(days)) });
    await GIFTS_CACHE.put(cacheKey, body, { expirationTtl: REPORT_TTL_S });
    return new Response(body, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch (err) {
    return json({ ok: false, error: "ga_error", detail: String((err && err.message) || err).slice(0, 300) });
  }
}

/* ---------------- access ---------------- */

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function reviewSecretOk(secret) {
  const key = `review-ok:${await sha256Hex(secret)}`;
  if (await GIFTS_CACHE.get(key)) return true;
  // Apps Script's redirect sometimes answers with an HTML 404 although the
  // script ran, so retry a few times before giving up.
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(APPS_SCRIPT, {
        method: "POST",
        body: JSON.stringify({ type: "review", secret, action: "ping" }),
        redirect: "follow",
      });
      const out = await res.json();
      if (out && out.ok === true) {
        await GIFTS_CACHE.put(key, "1", { expirationTtl: AUTH_TTL_S });
        return true;
      }
      if (out && out.ok === false) return false;
    } catch {
      // retry
    }
  }
  return false;
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

function rows(report, dims, mets) {
  return (report.rows || []).map((r) => {
    const o = {};
    dims.forEach((d, i) => { o[d] = r.dimensionValues[i].value; });
    mets.forEach((m, i) => { o[m] = num(r.metricValues[i].value); });
    return o;
  });
}

async function buildReport(days) {
  const id = await propertyId();
  const dateRanges = [{ startDate: `${days - 1}daysAgo`, endDate: "today" }];

  const meta = await gaFetch(`/v1beta/properties/${id}/metadata`);
  const registered = new Set((meta.dimensions || []).map((d) => d.apiName));
  const has = (p) => registered.has(`customEvent:${p}`);
  const missingDims = CUSTOM_DIMS.filter((p) => !has(p));

  const base = [
    // 0. Site totals
    { dateRanges, metrics: [{ name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" }, { name: "engagedSessions" }, { name: "userEngagementDuration" }] },
    // 1. Event counts and the people behind them
    { dateRanges, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      dimensionFilter: inList("eventName", COUNT_EVENTS) },
    // 2. Results page: views and engaged time
    { dateRanges, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }, { name: "userEngagementDuration" }, { name: "activeUsers" }],
      dimensionFilter: begins("pagePath", "/results") },
    // 3. Daily trend
    { dateRanges, dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }] },
    // 4. Daily trend of quiz completions and store clicks
    { dateRanges, dimensions: [{ name: "date" }, { name: "eventName" }], metrics: [{ name: "eventCount" }],
      dimensionFilter: inList("eventName", TREND_EVENTS) },
  ];
  const second = [
    // 5. Where sessions come from
    { dateRanges, dimensions: [{ name: "sessionSource" }], metrics: [{ name: "sessions" }, { name: "engagedSessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 },
    // 6. Device split
    { dateRanges, dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "sessions" }] },
    // 7. New vs returning
    { dateRanges, dimensions: [{ name: "newVsReturning" }], metrics: [{ name: "activeUsers" }] },
  ];
  if (has("destination")) {
    second.push({ dateRanges, dimensions: [{ name: "customEvent:destination" }], metrics: [{ name: "eventCount" }],
      dimensionFilter: eq("eventName", "gift_buy_click") });
  }
  if (has("gift_name")) {
    second.push({ dateRanges, dimensions: [{ name: "eventName" }, { name: "customEvent:gift_name" }], metrics: [{ name: "eventCount" }],
      dimensionFilter: inList("eventName", ["gift_open", "gift_buy_click"]),
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: 40 });
  }
  const third = [];
  if (has("step_index")) {
    third.push({ dateRanges, dimensions: [{ name: "customEvent:step_index" }], metrics: [{ name: "totalUsers" }],
      dimensionFilter: eq("eventName", "quiz_step_view") });
  }

  const call = (requests) => requests.length
    ? gaFetch(`/v1beta/properties/${id}:batchRunReports`, { requests }).then((r) => r.reports)
    : Promise.resolve([]);
  const [r1, r2, r3, funnel] = await Promise.all([call(base), call(second), call(third), funnelReport(id, dateRanges)]);

  const totals = rows(r1[0], [], ["activeUsers", "newUsers", "sessions", "engagedSessions", "userEngagementDuration"])[0] || {};
  const events = Object.fromEntries(rows(r1[1], ["eventName"], ["eventCount", "totalUsers"]).map((r) => [r.eventName, r]));
  const resultsRows = rows(r1[2], ["pagePath"], ["screenPageViews", "userEngagementDuration", "activeUsers"]);
  const results = resultsRows.reduce((a, r) => ({
    views: a.views + r.screenPageViews, seconds: a.seconds + r.userEngagementDuration, users: a.users + r.activeUsers,
  }), { views: 0, seconds: 0, users: 0 });

  const byDay = {};
  for (const r of rows(r1[3], ["date"], ["activeUsers", "sessions"])) byDay[r.date] = { date: r.date, visitors: r.activeUsers, sessions: r.sessions, quizzes: 0, storeClicks: 0 };
  for (const r of rows(r1[4], ["date", "eventName"], ["eventCount"])) {
    byDay[r.date] = byDay[r.date] || { date: r.date, visitors: 0, sessions: 0, quizzes: 0, storeClicks: 0 };
    if (r.eventName === "quiz_complete") byDay[r.date].quizzes = r.eventCount;
    if (r.eventName === "gift_buy_click") byDay[r.date].storeClicks = r.eventCount;
  }

  let i = 3;
  const sources = rows(r2[0], ["sessionSource"], ["sessions", "engagedSessions"]);
  const devices = rows(r2[1], ["deviceCategory"], ["sessions"]);
  const newVsReturning = rows(r2[2], ["newVsReturning"], ["activeUsers"]);
  const destinations = has("destination") ? rows(r2[i++], ["customEvent:destination"], ["eventCount"]) : null;
  const topGifts = has("gift_name") ? rows(r2[i++], ["eventName", "customEvent:gift_name"], ["eventCount"]) : null;
  const quizSteps = has("step_index") ? rows(r3[0], ["customEvent:step_index"], ["totalUsers"]) : null;

  return {
    days, generatedAt: new Date().toISOString(), missingDims,
    totals, events, results, funnel,
    trend: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    sources, devices, newVsReturning, destinations, topGifts, quizSteps,
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
