#!/usr/bin/env node
/**
 * Checks the pure math behind the /review Analytics tab (src/data/insights.ts)
 * on hand-made cases: KPI changes, the three takeaways, the before/after
 * windows around site changes, and the opened-but-rarely-clicked list.
 *
 *   node scripts/check-insights.mjs
 *
 * Bundles insights.ts with the esbuild that ships with Vite, so nothing extra
 * needs installing. Exits 1 if any check fails.
 */
import { build } from "esbuild";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "insights-")), "insights.mjs");
await build({ entryPoints: [path.join(root, "src/data/insights.ts")], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "error" });
const I = await import(out);

let failed = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`ok    ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name}\n      ${err.message.split("\n").join("\n      ")}`);
  }
};

const period = ({ visitors = 0, sessions = 0, events = {}, views = 0, seconds = 0, users = 0 } = {}) => ({
  totals: { activeUsers: visitors, sessions },
  events: Object.fromEntries(Object.entries(events).map(([k, [eventCount, totalUsers]]) => [k, { eventCount, totalUsers }])),
  results: { views, seconds, users },
});

/* ---------- change() and KPI values ---------- */

check("change: up, down, flat, new, and nothing", () => {
  assert.deepEqual(I.change(120, 100), { kind: "up", pct: 20 });
  assert.deepEqual(I.change(75, 100), { kind: "down", pct: -25 });
  assert.deepEqual(I.change(100.2, 100), { kind: "flat", pct: 0 });
  assert.deepEqual(I.change(5, 0), { kind: "new" }, "zero previous period reads as new");
  assert.deepEqual(I.change(5, null), { kind: "new" }, "missing previous rate reads as new");
  assert.equal(I.change(0, 0), null, "nothing in either period shows no change line");
  assert.equal(I.change(null, 4), null);
});

check("kpis: rates are null when there is nothing to divide by", () => {
  const k = I.kpis(period({ visitors: 0 }));
  assert.equal(k.visitors, 0);
  assert.equal(k.quizzesPerTaker, null);
  assert.equal(k.resultsSeconds, null);
  assert.equal(k.clicksPer100, null);
  assert.equal(I.fmtKpi("clicksPer100", null), "n/a");
});

check("kpis: values from a normal period", () => {
  const k = I.kpis(period({ visitors: 500, events: { quiz_complete: [300, 200], gift_open: [400, 90], gift_buy_click: [50, 30] }, views: 250, seconds: 25000 }));
  assert.equal(k.quizzesPerTaker, 1.5);
  assert.equal(k.resultsSeconds, 100);
  assert.equal(k.opensPer100, 160);
  assert.equal(k.clicksPer100, 20);
  assert.equal(I.fmtKpi("resultsSeconds", 100), "1m 40s");
});

/* ---------- takeaways ---------- */

const cur = period({ visitors: 1400, sessions: 1700, events: { quiz_complete: [800, 600], gift_open: [900, 300], gift_buy_click: [200, 120] }, views: 1000, seconds: 100000 });
const prev = period({ visitors: 1000, sessions: 1200, events: { quiz_complete: [700, 520], gift_open: [800, 260], gift_buy_click: [100, 70] }, views: 900, seconds: 90000 });

check("takeaway (a): the biggest KPI change wins", () => {
  // clicks per 100 views: 20 vs 11.1 (+80%) beats visitors (+40%)
  assert.equal(
    I.biggestKpiChange(30, cur, prev),
    "Store clicks per 100 results views rose 80% compared with the previous 30 days, from 11 to 20.",
  );
});

check("takeaway (a): a zero previous period gives no percent sentence", () => {
  assert.equal(I.biggestKpiChange(7, cur, period()), null);
});

check("takeaway (a): tiny bases are ignored", () => {
  const a = period({ visitors: 8, events: { quiz_complete: [4, 3] }, views: 4 });
  const b = period({ visitors: 3, events: { quiz_complete: [1, 1] }, views: 1 });
  assert.equal(I.biggestKpiChange(7, a, b), null);
});

const steps = (closed, users) => ({
  closed,
  steps: ["Visited", "Started the quiz", "Finished the quiz", "Saw results", "Opened a gift", "Clicked to a store"].map((name, i) => ({ name, users: users[i] })),
});

check("takeaway (b): the step that loses the most visitors", () => {
  assert.equal(I.biggestLeak(steps(true, [1000, 280, 200, 195, 120, 60])), "72% of visitors leave without starting the quiz.");
  assert.equal(I.biggestLeak(steps(true, [1000, 900, 800, 790, 300, 250])), "49% of visitors see results but leave without opening a gift.");
});

check("takeaway (b): an open funnel only judges the first step", () => {
  // Saw results > finished (shared links), clicks > opens (card Buy buttons): only visit -> start counts.
  assert.equal(I.biggestLeak(steps(false, [1000, 600, 400, 700, 100, 300])), "40% of visitors leave without starting the quiz.");
  assert.equal(I.biggestLeak(steps(true, [0, 0, 0, 0, 0, 0])), null, "no visitors, no sentence");
});

const src = (sessionSource, sessions, storeClicks) => ({ sessionSource, sessions, engagedSessions: 0, storeClicks });

check("takeaway (c): best source among those with 10+ visits", () => {
  const s = [src("google", 400, 40), src("producthunt.com", 200, 36), src("reddit.com", 6, 5), src("t.co", 0, 0)];
  assert.equal(
    I.bestSource(s, 1000, 100),
    "Visits from producthunt.com had the most store clicks per visit, 18 per 100 visits, compared with 10 per 100 across all sources.",
  );
});

check("takeaway (c): direct traffic, a lone source, and a 0-visit source", () => {
  assert.match(I.bestSource([src("(direct)", 50, 9), src("google", 50, 2)], 100, 11), /^Direct visits had the most/);
  assert.equal(I.bestSource([src("google", 50, 5), src("t.co", 0, 0)], 50, 5), null, "needs two sources with 10+ visits");
  assert.equal(I.bestSource([src("google", 50, 0), src("t.co", 40, 0)], 90, 0), null, "no clicks anywhere, no sentence");
});

check("takeaways: at most three, none invented", () => {
  const t = I.takeaways({ days: 30, current: cur, previous: prev, funnel: steps(true, [1000, 280, 200, 195, 120, 60]), sources: [src("google", 400, 40), src("producthunt.com", 200, 36)] });
  assert.equal(t.length, 3);
  assert.deepEqual(I.takeaways({ days: 7, current: period(), previous: period(), funnel: { closed: false, steps: [] }, sources: [] }), []);
});

/* ---------- dates and before/after windows ---------- */

check("dates: addDays across months and todayIn a time zone", () => {
  assert.equal(I.addDays("20261031", 1), "20261101");
  assert.equal(I.addDays("20260301", -1), "20260228");
  // 2026-10-17 23:30 UTC is already the 18th in Jerusalem and still the 17th in New York
  const t = new Date(Date.UTC(2026, 9, 17, 23, 30));
  assert.equal(I.todayIn("Asia/Jerusalem", t), "20261018");
  assert.equal(I.todayIn("America/New_York", t), "20261017");
  assert.equal(I.todayIn("Not/A_Zone", t), "20261017", "bad zone falls back to UTC");
});

const today = "20261017";
const start = I.addDays(today, -89);
// Visitors are 10 a day before Oct 10 and 20 from Oct 10; every day has the same rates.
const daily = I.fillDays(
  Array.from({ length: 90 }, (_, i) => {
    const date = I.addDays(start, i);
    const v = date >= "20261010" ? 20 : 10;
    return { date, visitors: v, quizStarters: v / 2, quizFinishers: v / 4, quizzes: v / 4, opens: v, storeClicks: v / 10, resultsViews: v / 2 };
  }).filter((d) => d.date !== "20261005"), // a day GA left out (no traffic)
  start,
  today,
);

check("fillDays: a missing day comes back as zeros", () => {
  assert.equal(daily.length, 90);
  assert.equal(daily.find((d) => d.date === "20261005").visitors, 0);
});

check("beforeAfter: full week, partial week, today, yesterday, future, and a gap day", () => {
  const out = I.beforeAfter(daily, start, today, [
    { date: "2026-10-09", title: "Nine" },
    { date: "2026-10-10", title: "Ten" },
    { date: "2026-10-10", title: "Ten again" },
    { date: "2026-10-14", title: "Fourteen" },
    { date: "2026-10-16", title: "Yesterday" },
    { date: "2026-10-17", title: "Today" },
    { date: "2026-10-20", title: "Future" },
    { date: "2026-01-01", title: "Before the series" },
  ]);
  const by = Object.fromEntries(out.map((c) => [c.date, c]));
  assert.equal(by["2026-01-01"], undefined, "changes older than the 90-day series are left out");

  const nine = by["2026-10-09"];
  assert.equal(nine.status, "complete", "Oct 10 to 16 are seven finished days");
  assert.equal(nine.afterDays, 7);
  assert.equal(nine.after.days, 7);

  const ten = by["2026-10-10"];
  assert.deepEqual(ten.titles, ["Ten", "Ten again"], "same-day changes are grouped");
  assert.equal(ten.status, "partial", "the 7th day after (Oct 17) is today, which is not over");
  assert.equal(ten.afterDays, 6);
  assert.equal(ten.before.days, 7);
  // Oct 3 to 9 with Oct 5 missing: 6 days of 10 visitors over 7 days
  assert.equal(ten.before.visitorsPerDay, 60 / 7);
  assert.equal(ten.after.visitorsPerDay, 20);

  const fourteen = by["2026-10-14"];
  assert.equal(fourteen.status, "partial");
  assert.equal(fourteen.afterDays, 2, "Oct 15 and 16; today does not count");
  assert.equal(fourteen.after.startShare, 0.5);
  assert.equal(fourteen.after.clicksPer100, 20);

  for (const d of ["2026-10-16", "2026-10-17"]) {
    assert.equal(by[d].status, "waiting", `${d}: no finished day after it yet`);
    assert.equal(by[d].after, null);
  }
  assert.equal(by["2026-10-20"].status, "future");
  assert.equal(by["2026-10-20"].after, null);
});

check("beforeAfter: a change whose week before starts before the series has no before numbers", () => {
  const [c] = I.beforeAfter(daily, start, today, [{ date: `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}`, title: "First day" }]);
  assert.equal(c.before, null);
  assert.equal(c.status, "complete");
});

check("windowStats: no visitors or views gives n/a rates, not NaN", () => {
  const w = I.windowStats(new Map(), "20261001", "20261007");
  assert.equal(w.visitorsPerDay, 0);
  assert.equal(w.startShare, null);
  assert.equal(w.clicksPer100, null);
  assert.equal(I.fmtShare(w.startShare), "n/a");
});

/* ---------- gifts ---------- */

check("giftStats and lowClickGifts", () => {
  const rows = [
    ["A", 100, 30], ["B", 50, 2], ["C", 10, 1], ["D", 2, 0], ["E", 4, 3], ["(not set)", 500, 1],
  ].flatMap(([name, o, c]) => [{ eventName: "gift_open", name, eventCount: o }, { eventName: "gift_buy_click", name, eventCount: c }]);
  const stats = I.giftStats(rows);
  assert.equal(stats.length, 5, "(not set) is dropped");
  assert.equal(stats[0].name, "A", "sorted by clicks");
  const low = I.lowClickGifts(stats);
  assert.equal(low.perOpen, 36 / 166);
  assert.deepEqual(low.gifts.map((g) => g.name), ["B", "C"], "D has under 3 opens; A and E click above the average");
  assert.deepEqual(I.lowClickGifts([]), { perOpen: null, gifts: [] });
});

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
