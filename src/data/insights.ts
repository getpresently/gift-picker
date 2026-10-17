/**
 * The pure numbers behind the Analytics tab in /review: KPI values and their
 * change against the previous period, the takeaway sentences, before/after
 * windows around site changes, and per-gift click rates.
 *
 * No I/O here. The worker (workers-site/analytics.js) runs these on GA4 rows,
 * the dev mock in ReviewAnalytics.tsx runs them on sample rows, and
 * scripts/check-insights.mjs runs them on hand-made cases.
 */

import { CHANGES, type SiteChange } from "./changes";

/* ---------------- shapes ---------------- */

export type EventStat = { eventCount: number; totalUsers: number };

/** One period of site totals, event counts, and results-page numbers. */
export type PeriodData = {
  totals: { activeUsers?: number; newUsers?: number; sessions?: number; engagedSessions?: number; userEngagementDuration?: number };
  events: Record<string, EventStat | undefined>;
  results: { views: number; seconds: number; users: number };
};

export type FunnelStep = { name: string; users: number };
export type Funnel = { closed: boolean; error?: string; steps: FunnelStep[] };

export type SourceRow = { sessionSource: string; sessions: number; engagedSessions: number; storeClicks: number };

/** One day of the 90-day series. `date` is GA's YYYYMMDD. */
export type DailyRow = {
  date: string;
  visitors: number;
  sessions: number;
  /** People who started the quiz (quiz_start or a quiz question view, whichever is larger). */
  quizStarters: number;
  /** People who finished the quiz. */
  quizFinishers: number;
  /** Finished quizzes (events). */
  quizzes: number;
  opens: number;
  storeClicks: number;
  resultsViews: number;
};

export type WindowStats = {
  days: number;
  visitorsPerDay: number;
  startShare: number | null;
  finishShare: number | null;
  clicksPer100: number | null;
  opensPer100: number | null;
};

export type ChangeStatus = "future" | "waiting" | "partial" | "complete";

export type ChangeImpact = {
  /** YYYY-MM-DD, as written in changes.ts. */
  date: string;
  titles: string[];
  status: ChangeStatus;
  /** Complete days after the change day that are in the after window (0 to 7). */
  afterDays: number;
  before: WindowStats | null;
  after: WindowStats | null;
};

export type GiftStat = { name: string; opens: number; clicks: number };

/* ---------------- formatting (shared by the worker's sentences and the page) ---------------- */

export const fmt = (n: number) =>
  n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}K` : Math.round(n).toLocaleString("en-US");

/** Rates such as "per 100 views": one decimal below 10, whole numbers above. */
export const fmtRate = (n: number | null) => {
  if (n == null || !isFinite(n)) return "–";
  if (n === 0) return "0";
  return n < 10 ? n.toFixed(1) : fmt(n);
};

export const fmtShare = (n: number | null) => (n == null || !isFinite(n) ? "–" : `${Math.round(n * 100)}%`);

export const duration = (s: number | null) => {
  if (s == null || !isFinite(s) || s <= 0) return "–";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m ? `${m}m ${String(sec).padStart(2, "0")}s` : `${sec}s`;
};

export const per100 = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null);
const share = (part: number, whole: number) => (whole > 0 ? part / whole : null);

/* ---------------- KPIs and their change ---------------- */

export const KPI_KEYS = ["visitors", "quizzesFinished", "quizzesPerTaker", "resultsSeconds", "opensPer100", "clicksPer100"] as const;
export type KpiKey = (typeof KPI_KEYS)[number];
export type Kpis = Record<KpiKey, number | null>;

export const KPI_LABELS: Record<KpiKey, string> = {
  visitors: "Visitors",
  quizzesFinished: "Quizzes finished",
  quizzesPerTaker: "Quizzes per quiz taker",
  resultsSeconds: "Time on results",
  opensPer100: "Gifts opened per 100 results views",
  clicksPer100: "Store clicks per 100 results views",
};

export function fmtKpi(key: KpiKey, v: number | null): string {
  if (v == null) return "–";
  if (key === "resultsSeconds") return duration(v);
  if (key === "quizzesPerTaker") return v.toFixed(1);
  if (key === "opensPer100" || key === "clicksPer100") return fmtRate(v);
  return fmt(v);
}

const ev = (p: PeriodData, name: string): EventStat => p.events[name] ?? { eventCount: 0, totalUsers: 0 };

export function kpis(p: PeriodData): Kpis {
  const done = ev(p, "quiz_complete");
  return {
    visitors: p.totals.activeUsers ?? 0,
    quizzesFinished: done.eventCount,
    quizzesPerTaker: done.totalUsers > 0 ? done.eventCount / done.totalUsers : null,
    resultsSeconds: p.results.views > 0 ? p.results.seconds / p.results.views : null,
    opensPer100: per100(ev(p, "gift_open").eventCount, p.results.views),
    clicksPer100: per100(ev(p, "gift_buy_click").eventCount, p.results.views),
  };
}

/** How much a KPI's base must be in both periods before its change counts as a takeaway. */
const MIN_BASE = 10;
function kpiBase(key: KpiKey, p: PeriodData): number {
  if (key === "visitors") return p.totals.activeUsers ?? 0;
  if (key === "quizzesFinished") return ev(p, "quiz_complete").eventCount;
  if (key === "quizzesPerTaker") return ev(p, "quiz_complete").totalUsers;
  return p.results.views;
}

export type Change = { kind: "up" | "down" | "flat"; pct: number } | { kind: "new" } | null;

/** Change against the previous period: a rounded percent, "new" when the previous value was 0 or missing. */
export function change(cur: number | null, prev: number | null): Change {
  if (cur == null || !isFinite(cur)) return null;
  if (prev == null || !isFinite(prev) || prev === 0) return cur > 0 ? { kind: "new" } : null;
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { kind: pct > 0 ? "up" : pct < 0 ? "down" : "flat", pct };
}

/* ---------------- takeaways ---------------- */

/** (a) The KPI that moved the most against the previous period of the same length. */
export function biggestKpiChange(days: number, current: PeriodData, previous: PeriodData): string | null {
  const cur = kpis(current);
  const prev = kpis(previous);
  let best: { key: KpiKey; pct: number } | null = null;
  for (const key of KPI_KEYS) {
    if (kpiBase(key, current) < MIN_BASE || kpiBase(key, previous) < MIN_BASE) continue;
    const c = change(cur[key], prev[key]);
    if (!c || c.kind === "new" || c.kind === "flat") continue;
    if (!best || Math.abs(c.pct) > Math.abs(best.pct)) best = { key, pct: c.pct };
  }
  if (!best) return null;
  const verb = best.pct > 0 ? "rose" : "fell";
  return `${KPI_LABELS[best.key]} ${verb} ${Math.abs(best.pct)}% compared with the previous ${days} days, from ${fmtKpi(best.key, prev[best.key])} to ${fmtKpi(best.key, cur[best.key])}.`;
}

const LEAK_PHRASES: Record<string, string> = {
  "Started the quiz": "leave without starting the quiz",
  "Finished the quiz": "start the quiz but leave before finishing it",
  "Saw results": "finish the quiz but never reach the results",
  "Opened a gift": "see results but leave without opening a gift",
  "Clicked to a store": "open a gift but leave without clicking to a store",
};

/**
 * (b) The funnel step that loses the largest share of all visitors. In an open
 * funnel people skip steps (shared links open results directly, cards have
 * their own Buy button), so only the first step is a clean loss there.
 */
export function biggestLeak(funnel: Funnel): string | null {
  const steps = funnel.steps;
  const visitors = steps[0]?.users ?? 0;
  if (visitors <= 0) return null;
  let best: { phrase: string; lost: number } | null = null;
  const last = funnel.closed ? steps.length - 1 : Math.min(1, steps.length - 1);
  for (let i = 1; i <= last; i++) {
    const phrase = LEAK_PHRASES[steps[i].name];
    const lost = steps[i - 1].users - steps[i].users;
    if (phrase && lost > 0 && (!best || lost > best.lost)) best = { phrase, lost };
  }
  if (!best) return null;
  const pct = Math.round((best.lost / visitors) * 100);
  return pct > 0 ? `${pct}% of visitors ${best.phrase}.` : null;
}

const MIN_SOURCE_VISITS = 10;

/** (c) The source whose visits click to a store most often, among sources with at least 10 visits. */
export function bestSource(sources: SourceRow[], allVisits: number, allClicks: number): string | null {
  const eligible = sources.filter((s) => s.sessions >= MIN_SOURCE_VISITS && s.sessionSource !== "(not set)");
  if (eligible.length < 2) return null;
  let best = eligible[0];
  for (const s of eligible) if (s.storeClicks / s.sessions > best.storeClicks / best.sessions) best = s;
  if (best.storeClicks <= 0) return null;
  const who = best.sessionSource === "(direct)" ? "Direct visits" : `Visits from ${best.sessionSource}`;
  const all = per100(allClicks, allVisits);
  const tail = all == null ? "." : `, compared with ${fmtRate(all)} per 100 across all sources.`;
  return `${who} had the most store clicks per visit, ${fmtRate(per100(best.storeClicks, best.sessions))} per 100 visits${tail}`;
}

export function takeaways(input: { days: number; current: PeriodData; previous: PeriodData; funnel: Funnel; sources: SourceRow[] }): string[] {
  const { days, current, previous, funnel, sources } = input;
  return [
    biggestKpiChange(days, current, previous),
    biggestLeak(funnel),
    bestSource(sources, current.totals.sessions ?? 0, ev(current, "gift_buy_click").eventCount),
  ].filter((s): s is string => Boolean(s));
}

/** Funnel from event counts, for when GA's funnel report fails: each step counted on its own. */
export function fallbackFunnel(p: PeriodData): Funnel["steps"] {
  return [
    { name: "Visited", users: p.totals.activeUsers ?? 0 },
    { name: "Started the quiz", users: ev(p, "quiz_start").totalUsers },
    { name: "Finished the quiz", users: ev(p, "quiz_complete").totalUsers },
    { name: "Saw results", users: p.results.users },
    { name: "Opened a gift", users: ev(p, "gift_open").totalUsers },
    { name: "Clicked to a store", users: ev(p, "gift_buy_click").totalUsers },
  ];
}

/* ---------------- dates ---------------- */

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
const toMs = (ymd: string) => Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)));
const fromMs = (ms: number) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
};

/** YYYYMMDD plus n days. */
export const addDays = (ymd: string, n: number) => fromMs(toMs(ymd) + n * DAY_MS);
const daysBetween = (from: string, to: string) => Math.round((toMs(to) - toMs(from)) / DAY_MS);
/** "2026-10-17" to GA's "20261017". */
export const compactDate = (iso: string) => iso.replace(/-/g, "");

/** Today's date (YYYYMMDD) in the GA property's time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}${get("month")}${get("day")}`;
  } catch {
    return fromMs(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
}

const emptyDay = (date: string): DailyRow => ({
  date, visitors: 0, sessions: 0, quizStarters: 0, quizFinishers: 0, quizzes: 0, opens: 0, storeClicks: 0, resultsViews: 0,
});

/** One row per day from start to end; days GA left out (no data) count as zero. */
export function fillDays(rows: DailyRow[], start: string, end: string): DailyRow[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const out: DailyRow[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(byDate.get(d) ?? emptyDay(d));
  return out;
}

/* ---------------- before and after a change ---------------- */

const WINDOW_DAYS = 7;

export function windowStats(byDate: Map<string, DailyRow>, from: string, to: string): WindowStats {
  const sum = emptyDay(from);
  let days = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    days++;
    const r = byDate.get(d);
    if (!r) continue;
    sum.visitors += r.visitors;
    sum.quizStarters += r.quizStarters;
    sum.quizFinishers += r.quizFinishers;
    sum.opens += r.opens;
    sum.storeClicks += r.storeClicks;
    sum.resultsViews += r.resultsViews;
  }
  return {
    days,
    visitorsPerDay: days ? sum.visitors / days : 0,
    startShare: share(sum.quizStarters, sum.visitors),
    finishShare: share(sum.quizFinishers, sum.visitors),
    clicksPer100: per100(sum.storeClicks, sum.resultsViews),
    opensPer100: per100(sum.opens, sum.resultsViews),
  };
}

/**
 * For each date with changes: the 7 complete days before it against the days
 * after it (up to 7). The change day itself is left out, and so is today,
 * which is not over yet. `daily` covers seriesStart to today (YYYYMMDD).
 */
export function beforeAfter(daily: DailyRow[], seriesStart: string, today: string, changes: SiteChange[] = CHANGES): ChangeImpact[] {
  const byDate = new Map(daily.map((r) => [r.date, r]));
  const grouped = new Map<string, string[]>();
  for (const c of changes) grouped.set(c.date, [...(grouped.get(c.date) ?? []), c.title]);
  const yesterday = addDays(today, -1);

  const out: ChangeImpact[] = [];
  for (const [iso, titles] of [...grouped].sort((a, b) => a[0].localeCompare(b[0]))) {
    const d = compactDate(iso);
    if (d < seriesStart) continue;
    const beforeFrom = addDays(d, -WINDOW_DAYS);
    const before = beforeFrom >= seriesStart ? windowStats(byDate, beforeFrom, addDays(d, -1)) : null;
    const fullWeek = addDays(d, WINDOW_DAYS);
    const afterEnd = fullWeek < yesterday ? fullWeek : yesterday;
    const afterDays = Math.max(0, daysBetween(d, afterEnd));
    const status: ChangeStatus = d > today ? "future" : afterDays === 0 ? "waiting" : afterDays < WINDOW_DAYS ? "partial" : "complete";
    const after = afterDays > 0 ? windowStats(byDate, addDays(d, 1), afterEnd) : null;
    out.push({ date: iso, titles, status, afterDays, before, after });
  }
  return out;
}

/* ---------------- gifts ---------------- */

/** Opens and store clicks per gift from GA rows of (eventName, gift_name, eventCount). */
export function giftStats(rows: { eventName: string; name: string; eventCount: number }[]): GiftStat[] {
  const m = new Map<string, GiftStat>();
  for (const r of rows) {
    if (!r.name || r.name === "(not set)") continue;
    const g = m.get(r.name) ?? { name: r.name, opens: 0, clicks: 0 };
    if (r.eventName === "gift_open") g.opens += r.eventCount;
    else if (r.eventName === "gift_buy_click") g.clicks += r.eventCount;
    m.set(r.name, g);
  }
  return [...m.values()].sort((a, b) => b.clicks - a.clicks || b.opens - a.opens);
}

/** Gifts opened at least `minOpens` times whose clicks per open are below the all-gift rate, most opened first. */
export function lowClickGifts(stats: GiftStat[], minOpens = 3): { perOpen: number | null; gifts: GiftStat[] } {
  const opens = stats.reduce((a, g) => a + g.opens, 0);
  const clicks = stats.reduce((a, g) => a + g.clicks, 0);
  const perOpen = opens > 0 ? clicks / opens : null;
  if (perOpen == null) return { perOpen, gifts: [] };
  const gifts = stats
    .filter((g) => g.opens >= minOpens && g.clicks / g.opens < perOpen)
    .sort((a, b) => b.opens - a.opens || a.clicks - b.clicks);
  return { perOpen, gifts };
}
