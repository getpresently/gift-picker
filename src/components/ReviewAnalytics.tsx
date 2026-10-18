import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ClaySurface } from "./clay/ClaySurface";
import { useIsMobile } from "../hooks/useIsMobile";
import { QUESTIONS } from "../data/questions";
import { INTEREST_LABELS } from "../data/gifts";
import { RESULTS_BANDS } from "../data/analytics";
import { CHANGES } from "../data/changes";
import {
  addDays, beforeAfter, change, fmt, fmtKpi, fmtRate, fmtShare, giftStats, kpis, lowClickGifts, mostCopiedGifts, mostOpenedGifts, NA,
  per100, rarelyTappedGifts, shareBreakdown, shareTotals, takeaways,
  type ChangeImpact, type CopiedGift, type DailyRow, type Funnel, type GiftStat, type KpiKey, type Kpis, type OpenedGift,
  type PeriodData, type SeenGift, type ShareBreakdown, type ShareTotals, type SourceRow, type WindowStats,
} from "../data/insights";

/**
 * Analytics tab of /review: how visitors move through the site, built from the
 * Google Analytics 4 data the site collects through track(). The numbers come
 * from the worker's /api/analytics, gated by the review password; the math
 * lives in src/data/insights.ts.
 */

type Report = {
  ok: true;
  days: number;
  generatedAt: string;
  /** Today in the GA property's time zone, YYYYMMDD. */
  today: string;
  missingDims: string[];
  totals: PeriodData["totals"];
  events: PeriodData["events"];
  results: PeriodData["results"];
  kpis: { current: Kpis; previous: Kpis };
  takeaways: string[];
  funnel: Funnel;
  trend: { date: string; visitors: number; quizzes: number; storeClicks: number }[];
  changes: ChangeImpact[];
  sources: SourceRow[];
  devices: { deviceCategory: string; sessions: number; storeClicks: number }[];
  newVsReturning: { newVsReturning: string; activeUsers: number }[];
  destinations: { "customEvent:destination": string; eventCount: number }[] | null;
  gifts: GiftStat[] | null;
  lowClickGifts: { perOpen: number | null; gifts: GiftStat[] } | null;
  /** fromCards: detail opens count only taps on results cards (false until the source dimension is registered). */
  openedGifts: { fromCards: boolean; gifts: OpenedGift[] } | null;
  rarelyTapped: { per100: number | null; gifts: SeenGift[] } | null;
  quizSteps: { "customEvent:step_index": string; totalUsers: number }[] | null;
  recipients: { recipient: string; count: number }[] | null;
  interests: { interest: string; count: number }[] | null;
  resultsBands: { band: string; count: number }[] | null;
  shares: { current: ShareTotals; previous: ShareTotals };
  copiedGifts: CopiedGift[] | null;
  shareRecipients: ShareBreakdown | null;
  shareOccasions: ShareBreakdown | null;
};
type Failure = { ok: false; error: string; detail?: string };

const INK = "#231410";
const INK_2 = "rgba(35,20,16,0.62)";
const INK_3 = "rgba(35,20,16,0.42)";
const GRID = "rgba(35,20,16,0.08)";
const CORAL = "#E64B45"; // sequential and series 1 (Amazon)
const PLUM = "#7E3F71"; // series 2 (brand stores) and change markers; validated pair, light surface
const SANS = "Geist, sans-serif";

const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : NA);
const dayLabel = (d: string) => new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const sourceLabel = (s: string) => (s === "(direct)" ? "Direct" : s);
const FILLS_IN = "Fills in from the day this was turned on.";
const needsDim = (dim: string) => `Needs the ${dim} custom dimension (see the note above).`;

const optionLabel = (qid: string, v: string) => {
  const q = QUESTIONS.find((x) => x.id === qid);
  return (q && q.type !== "slider" && q.options.find((o) => o.v === v)?.l) || undefined;
};
const recipientLabel = (v: string) => optionLabel("recipient", v) ?? v;
const occasionLabel = (v: string) => optionLabel("occasion", v) ?? v;
const interestLabel = (v: string) => optionLabel("interests", v) ?? INTEREST_LABELS[v]?.[0] ?? v;
const BAND_LABELS: Record<string, string> = { none: "No results", "under 8": "Fewer than 8", "8 to 19": "8 to 19", "20 plus": "20 or more" };

/* ---------------- shared pieces ---------------- */

function Card({ title, sub, children, table }: { title: string; sub?: string; children: ReactNode; table?: ReactNode }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <ClaySurface tint="cream" style={{ padding: 22, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 16, color: INK }}>{title}</div>
          {sub && <div style={{ fontFamily: SANS, fontSize: 13, color: INK_2, marginTop: 3, lineHeight: 1.45 }}>{sub}</div>}
        </div>
        {table && (
          <button type="button" onClick={() => setShowTable((v) => !v)} style={linkButton}>
            {showTable ? "Show chart" : "Show table"}
          </button>
        )}
      </div>
      {showTable && table ? table : children}
    </ClaySurface>
  );
}

const linkButton: CSSProperties = {
  background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: SANS, fontSize: 13,
  color: INK_2, textDecoration: "underline", textUnderlineOffset: 3, whiteSpace: "nowrap",
};

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 13, color: INK }}>
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={`${h}-${i}`} style={{ textAlign: i ? "right" : "left", fontWeight: 600, color: INK_2, padding: "6px 4px", borderBottom: `1px solid ${GRID}` }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri}>
            {r.map((c, ci) => (
              <td key={ci} style={{ textAlign: ci ? "right" : "left", padding: "6px 4px", borderBottom: `1px solid ${GRID}`, fontVariantNumeric: ci ? "tabular-nums" : undefined }}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Hover or focus tooltip. `lines` turns it into a wrapping box (one line each);
 * `align` keeps a wide box inside the card near the chart's edges.
 */
function Tip({ text, lines, align = "center", children, style }: {
  text: string; lines?: string[]; align?: "left" | "center" | "right"; children: ReactNode; style?: CSSProperties;
}) {
  const [show, setShow] = useState(false);
  const place: CSSProperties = align === "left" ? { left: 0 } : align === "right" ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" };
  return (
    <span
      tabIndex={0}
      aria-label={lines ? lines.join(". ") : text}
      onPointerEnter={() => setShow(true)}
      onPointerLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      style={{ position: "relative", display: "block", outline: "none", ...style }}
    >
      {children}
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 6px)", zIndex: 5, ...place,
          background: INK, color: "#FFF8EE", fontFamily: SANS, fontSize: 12, padding: "6px 9px", borderRadius: 8,
          pointerEvents: "none", lineHeight: 1.45,
          ...(lines ? { whiteSpace: "normal", width: 250 } : { whiteSpace: "nowrap" }),
        }}>
          {lines ? (
            <>
              <span style={{ display: "block", fontWeight: 600 }}>{text}</span>
              {lines.map((l) => <span key={l} style={{ display: "block" }}>{l}</span>)}
            </>
          ) : text}
        </span>
      )}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ fontFamily: SANS, fontSize: 13, color: INK_2, padding: "8px 0" }}>{text}</div>;
}

/* ---------------- stat tiles ---------------- */

function changeText(c: ReturnType<typeof change>, days: number): string | null {
  if (!c) return null;
  const vs = `vs previous ${days} days`;
  if (c.kind === "new") return `New, none in the previous ${days} days`;
  if (c.kind === "flat") return `No change ${vs}`;
  return `${c.kind === "up" ? "↑" : "↓"} ${Math.abs(c.pct)}% ${vs}`;
}

function Stat({ label, value, note, delta }: { label: string; value: string; note?: string; delta?: string | null }) {
  return (
    <ClaySurface tint="cream" style={{ padding: "16px 18px" }}>
      <div style={{ fontFamily: SANS, fontSize: 13, color: INK_2 }}>{label}</div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: INK, marginTop: 4, letterSpacing: "-0.01em" }}>{value}</div>
      {delta && <div style={{ fontFamily: SANS, fontSize: 12, color: INK, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{delta}</div>}
      {note && <div style={{ fontFamily: SANS, fontSize: 12, color: INK_3, marginTop: 4 }}>{note}</div>}
    </ClaySurface>
  );
}

/* ---------------- charts ---------------- */

/**
 * Horizontal bars, one hue, value at the tip. All rows share one grid, so every
 * bar is measured against the same track and lengths stay comparable on phones.
 */
function HBars({ items, sub }: { items: { label: string; value: number; tip: string }[]; sub?: (v: number, i: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(80px, min(170px, 36%)) minmax(0, 1fr) auto", columnGap: 12, rowGap: 10, alignItems: "center" }}>
      {items.map((it, i) => (
        <Fragment key={it.label}>
          <div style={{ fontFamily: SANS, fontSize: 13, color: INK, overflowWrap: "anywhere" }}>{it.label}</div>
          <Tip text={it.tip}>
            <div style={{ width: `${Math.max(1.5, (it.value / max) * 100)}%`, height: 20, background: CORAL, borderRadius: "0 4px 4px 0" }} />
          </Tip>
          <span style={{ fontFamily: SANS, fontSize: 13, color: INK, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
            {fmt(it.value)}
            {sub && <span style={{ color: INK_3 }}> {sub(it.value, i)}</span>}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

type Marks = Map<string, string[]>;

/**
 * One small column chart per measure (small multiples, never a second axis).
 * Days with site changes get a dashed line and a marker under the axis that
 * lists the changes on hover.
 */
function MiniColumns({ title, points, marks }: { title: string; points: { date: string; value: number }[]; marks?: Marks }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((a, p) => a + p.value, 0);
  const H = 88;
  const center = "min(12px, 50%)"; // middle of a bar, which is at most 24px wide and left-aligned in its column
  const anyMark = !!marks && points.some((p) => marks.has(p.date));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 13, marginBottom: 8 }}>
        <span style={{ color: INK }}>{title}</span>
        <span style={{ color: INK_2, fontVariantNumeric: "tabular-nums" }}>{fmt(total)} total</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: H, borderBottom: `1px solid ${GRID}` }}>
        {points.map((p) => (
          <div key={p.date} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "flex-end", position: "relative" }}>
            {marks?.has(p.date) && (
              <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: center, borderLeft: `1px dashed ${PLUM}`, opacity: 0.6 }} />
            )}
            <Tip text={`${dayLabel(p.date)}: ${fmt(p.value)}`} style={{ width: "100%" }}>
              <div style={{ height: H, display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", minWidth: 2, maxWidth: 24, height: Math.max(p.value ? 2 : 0, (p.value / max) * (H - 4)), background: CORAL, borderRadius: "4px 4px 0 0" }} />
              </div>
            </Tip>
          </div>
        ))}
      </div>
      {anyMark && (
        <div style={{ display: "flex", gap: 2, height: 14 }}>
          {points.map((p, i) => {
            const titles = marks?.get(p.date);
            const align = i < points.length / 3 ? "left" : i > (points.length * 2) / 3 ? "right" : "center";
            return (
              <div key={p.date} style={{ flex: 1, minWidth: 0, position: "relative" }}>
                {titles && (
                  <Tip text={`Changes on ${dayLabel(p.date)}`} lines={titles} align={align} style={{ position: "absolute", left: center, top: 2, transform: "translateX(-50%)", width: 14, height: 12 }}>
                    <span style={{ display: "block", margin: "1px auto 0", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: `8px solid ${PLUM}` }} />
                  </Tip>
                )}
              </div>
            );
          })}
        </div>
      )}
      {points.length > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 11, color: INK_3, marginTop: 4 }}>
          <span>{dayLabel(points[0].date)}</span>
          <span>{dayLabel(points[points.length - 1].date)}</span>
        </div>
      )}
    </div>
  );
}

/** Part-to-whole for two series, legend plus direct labels. */
function SplitBar({ a, b }: { a: { label: string; value: number }; b: { label: string; value: number } }) {
  const total = a.value + b.value;
  if (!total) return <Empty text="No store clicks in this period." />;
  const legend = (color: string, label: string, value: number) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 13, color: INK }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      {label} <span style={{ color: INK_2 }}>{fmt(value)} ({pct(value, total)})</span>
    </span>
  );
  return (
    <div>
      <div style={{ display: "flex", gap: 2, height: 22, marginBottom: 10 }}>
        {a.value > 0 && <Tip style={{ flex: a.value }} text={`${a.label}: ${fmt(a.value)} (${pct(a.value, total)})`}><div style={{ width: "100%", height: 22, background: CORAL, borderRadius: b.value ? "4px 0 0 4px" : 4 }} /></Tip>}
        {b.value > 0 && <Tip style={{ flex: b.value }} text={`${b.label}: ${fmt(b.value)} (${pct(b.value, total)})`}><div style={{ width: "100%", height: 22, background: PLUM, borderRadius: a.value ? "0 4px 4px 0" : 4 }} /></Tip>}
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {legend(CORAL, a.label, a.value)}
        {legend(PLUM, b.label, b.value)}
      </div>
    </div>
  );
}

/* ---------------- changes and their results ---------------- */

const IMPACT_ROWS: { label: string; get: (w: WindowStats) => number | null; show: (v: number | null) => string }[] = [
  { label: "Visitors per day", get: (w) => w.visitorsPerDay, show: fmtRate },
  { label: "Visitors who start the quiz", get: (w) => w.startShare, show: fmtShare },
  { label: "Visitors who finish the quiz", get: (w) => w.finishShare, show: fmtShare },
  { label: "Store clicks per 100 results views", get: (w) => w.clicksPer100, show: fmtRate },
  { label: "Gift opens per 100 results views", get: (w) => w.opensPer100, show: fmtRate },
];

const isoLabel = (iso: string) => dayLabel(iso.replace(/-/g, ""));

function statusText(c: ChangeImpact): string {
  if (c.status === "future" || c.status === "waiting") return "No data yet";
  if (c.status === "partial") return `${c.afterDays} ${c.afterDays === 1 ? "day" : "days"} so far`;
  return "Full week after";
}

function Arrow({ before, after, show }: { before: number | null; after: number | null; show: (v: number | null) => string }) {
  if (before == null || after == null || show(before) === show(after)) return null;
  const up = after > before;
  return <span aria-label={up ? "up" : "down"} title={up ? "Up" : "Down"}>{up ? "↑" : "↓"}</span>;
}

function ChangeBlock({ c, first, isMobile }: { c: ChangeImpact; first: boolean; isMobile: boolean }) {
  const noData = c.status === "future" || c.status === "waiting";
  const cell: CSSProperties = { padding: "5px 4px", borderBottom: `1px solid ${GRID}`, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
  return (
    <div style={{
      display: "grid", gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(0, 1.15fr)", gap: isMobile ? 10 : 22,
      padding: "16px 0", borderTop: first ? "none" : `1px solid ${GRID}`,
    }}>
      <div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: INK, fontWeight: 600 }}>
          {isoLabel(c.date)} <span style={{ fontWeight: 400, color: INK_2, marginLeft: 6 }}>{statusText(c)}</span>
        </div>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontFamily: SANS, fontSize: 13, color: INK, lineHeight: 1.45, display: "grid", gap: 3 }}>
          {c.titles.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>
      {noData ? (
        <Empty text="No data yet. The after window starts the day after the change and counts only finished days." />
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 13, color: INK, alignSelf: "start" }}>
          <thead>
            <tr>
              <th style={{ ...cell, textAlign: "left", fontWeight: 600, color: INK_2 }} />
              <th style={{ ...cell, fontWeight: 600, color: INK_2 }}>Week before</th>
              <th style={{ ...cell, fontWeight: 600, color: INK_2 }}>{c.status === "complete" ? "Week after" : "So far"}</th>
              <th style={{ ...cell, width: 16 }} />
            </tr>
          </thead>
          <tbody>
            {IMPACT_ROWS.map((row) => {
              const b = c.before ? row.get(c.before) : null;
              const a = c.after ? row.get(c.after) : null;
              return (
                <tr key={row.label}>
                  <td style={{ ...cell, textAlign: "left", whiteSpace: "normal" }}>{row.label}</td>
                  <td style={cell}>{row.show(b)}</td>
                  <td style={cell}>{row.show(a)}</td>
                  <td style={{ ...cell, color: INK_2 }}><Arrow before={b} after={a} show={row.show} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ChangesCard({ changes }: { changes: ChangeImpact[] }) {
  const isMobile = useIsMobile();
  const [all, setAll] = useState(false);
  const newestFirst = [...changes].reverse();
  const shown = all ? newestFirst : newestFirst.slice(0, 5);
  return (
    <Card
      title="Changes and their results"
      sub="The 7 days before each change against up to 7 days after it. The change day and today are left out, and changes a few days apart share some days."
    >
      {shown.length ? shown.map((c, i) => <ChangeBlock key={c.date} c={c} first={i === 0} isMobile={isMobile} />)
        : <Empty text="No site changes in the last 90 days." />}
      {newestFirst.length > 5 && (
        <button type="button" onClick={() => setAll((v) => !v)} style={{ ...linkButton, marginTop: 6 }}>
          {all ? "Show the 5 latest" : `Show all ${newestFirst.length} dates`}
        </button>
      )}
    </Card>
  );
}

/* ---------------- what gets shared ---------------- */

/** Results shares and finished quizzes by one answer (recipient or occasion), with the share rate. */
function ShareBreakdownCard({ title, noun, dim, data, label, anyShares }: {
  title: string; noun: string; dim: string; data: ShareBreakdown | null; label: (v: string) => string; anyShares: boolean;
}) {
  const shared = data ? data.segments.filter((s) => s.shares > 0) : [];
  const rate = (v: number | null) => (v == null ? "under 10 quizzes, so no rate" : `${fmtRate(v)} per 100 finished quizzes`);
  return (
    <Card
      title={title}
      sub={`Results shares; the second number is shares per 100 finished quizzes (n/a under 10 quizzes)${data?.per100 != null ? `. All ${noun}s: ${fmtRate(data.per100)}` : ""}`}
      table={data?.segments.length ? <DataTable head={[cap(noun), "Shares", "Finished quizzes", "Per 100 quizzes"]}
        rows={data.segments.map((s) => [label(s.value), fmt(s.shares), fmt(s.quizzes), fmtRate(s.per100)])} /> : undefined}
    >
      {!data ? <Empty text={needsDim(dim)} />
        : shared.length ? (
          <HBars items={shared.map((s) => ({
            label: label(s.value), value: s.shares, tip: `${label(s.value)}: ${fmt(s.shares)} shares from ${fmt(s.quizzes)} finished quizzes, ${rate(s.per100)}`,
          }))} sub={(_, i) => `· ${fmtRate(shared[i].per100)}`} />
        ) : <Empty text={anyShares ? FILLS_IN : "No results shares in this period."} />}
    </Card>
  );
}

function SharesSection({ r }: { r: Report }) {
  const isMobile = useIsMobile();
  const { current: cur, previous: prev } = r.shares;
  const tile = (label: string, get: (s: ShareTotals) => number | null, note: string, show: (v: number | null) => string = (v) => (v == null ? NA : fmt(v))) => (
    <Stat label={label} value={show(get(cur))} delta={changeText(change(get(cur), get(prev)), r.days)} note={note} />
  );
  // Shares from days before method was registered have no split.
  const unsplit = cur.shared == null ? 0 : cur.resultsShares - cur.shared - (cur.copied ?? 0);
  const splitNote = cur.shared == null ? "Share sheet versus copied needs the method custom dimension"
    : `${fmt(cur.shared)} through the share sheet, ${fmt(cur.copied ?? 0)} copied${unsplit > 0 ? `, ${fmt(unsplit)} from before this was turned on` : ""}`;
  return (
    <>
      <div style={{ margin: "30px 0 14px" }}>
        <h2 style={{ fontFamily: SANS, fontWeight: 600, fontSize: 20, color: INK, margin: 0 }}>What gets shared</h2>
        <div style={{ fontFamily: SANS, fontSize: 13, color: INK_2, marginTop: 4, lineHeight: 1.45 }}>
          Results shared with the Share these picks button, gift links copied, and how often people open those links.
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
        {tile("Results shares", (s) => s.resultsShares, splitNote)}
        {tile("Gift links copied", (s) => s.giftCopies, "From gift details and gift pages")}
        {tile("Shared links opened", (s) => s.opens, "Results and gift links together")}
        {tile("Results links opened", (s) => s.resultsOpens,
          cur.resultsOpens == null ? "Needs the share_type custom dimension" : `${fmtRate(cur.opensPerResultsShare)} per results share`)}
        {tile("Gift links opened", (s) => s.giftOpens,
          cur.giftOpens == null ? "Needs the share_type custom dimension" : `${fmtRate(cur.opensPerGiftCopy)} per gift link copied`)}
        {tile("Opens per share", (s) => s.opensPerShare, "Opens of shared links per share, both kinds together", fmtRate)}
      </div>
      <div style={twoUp}>
        <ShareBreakdownCard title="Shares by recipient" noun="recipient" dim="recipient" data={r.shareRecipients} label={recipientLabel} anyShares={cur.resultsShares > 0} />
        <ShareBreakdownCard title="Shares by occasion" noun="occasion" dim="occasion" data={r.shareOccasions} label={occasionLabel} anyShares={cur.resultsShares > 0} />
      </div>
      <Card title="Most copied gifts" sub="Top 12 by links copied. The last column is copies per 100 opens on results, n/a under 3 opens.">
        {r.copiedGifts ? (r.copiedGifts.length
          ? <DataTable head={["Gift", "Copied", "Opened", "Per 100 opens"]}
            rows={r.copiedGifts.map((g) => [g.name, fmt(g.copies), fmt(g.opens), fmtRate(g.copiesPer100Opens)])} />
          : <Empty text={cur.giftCopies ? FILLS_IN : "No gift links copied in this period."} />)
          : <Empty text={needsDim("gift_name")} />}
      </Card>
    </>
  );
}

/* ---------------- what gets opened ---------------- */

function OpenedSection({ r }: { r: Report }) {
  const opened = r.openedGifts;
  const opensLabel = opened?.fromCards === false ? "Details opened, with arrow browsing" : "Details opened";
  const rare = r.rarelyTapped;
  const missing = (dims: string[]) => needsDim(dims.find((d) => r.missingDims.includes(d)) ?? dims[0]);
  return (
    <>
      <div style={{ margin: "30px 0 14px" }}>
        <h2 style={{ fontFamily: SANS, fontWeight: 600, fontSize: 20, color: INK, margin: 0 }}>What gets opened</h2>
        <div style={{ fontFamily: SANS, fontSize: 13, color: INK_2, marginTop: 4, lineHeight: 1.45 }}>
          How often people go from a gift's tile to its details, in the results modal or on its gift page, and which cards get seen but rarely tapped.
        </div>
      </div>
      <Card
        title="Most opened gifts"
        sub={opened?.fromCards === false
          ? "Top 12 by details opened plus gift page views. Until the source custom dimension is registered, details opened also counts browsing with the arrows in the details."
          : "Top 12 by details opened from a results tile plus gift page views, with store clicks and link copies for context"}
        table={opened?.gifts.length ? <DataTable head={["Gift", opensLabel, "Gift page views", "Total", "Store clicks", "Copied"]}
          rows={opened.gifts.map((g) => [g.name, fmt(g.opens), fmt(g.pageViews), fmt(g.total), fmt(g.clicks), fmt(g.copies)])} /> : undefined}
      >
        {opened ? (opened.gifts.length ? (
          <HBars items={opened.gifts.map((g) => ({
            label: g.name, value: g.total,
            tip: `${g.name}: ${fmt(g.opens)} ${opensLabel.toLowerCase()}, ${fmt(g.pageViews)} gift page views, ${fmt(g.clicks)} store clicks, ${fmt(g.copies)} copied`,
          }))} />
        ) : <Empty text="No gift details opened in this period." />) : <Empty text={needsDim("gift_name")} />}
      </Card>
      <Card
        title="Seen but rarely tapped"
        sub={`Seen at least 20 times on results, with fewer taps per 100 seen than all gifts together${rare?.per100 != null ? ` (${fmtRate(rare.per100)} per 100 seen)` : ""}. Cards lower on the page get fewer taps, so a gift here may need a better photo or title, or may just rank low.`}
      >
        {rare ? (rare.gifts.length
          ? <DataTable head={["Gift", "Seen", "Taps", "Per 100 seen"]} rows={rare.gifts.slice(0, 12).map((g) => [g.name, fmt(g.seen), fmt(g.taps), fmtRate(g.tapsPer100Seen)])} />
          : <Empty text={rare.per100 == null ? FILLS_IN : "No gift fits this in the period."} />)
          : <Empty text={missing(["gift_name", "source"])} />}
      </Card>
    </>
  );
}

/* ---------------- the page ---------------- */

const RANGES = [7, 30, 90] as const;

/**
 * Dev only: `npm run dev`, then /review?tab=analytics&mock shows sample data
 * without the password (&mock=missing shows the cards still waiting on GA
 * custom dimensions). Null in production builds, so the sample data is dropped.
 */
export function mockVariant(): string | null {
  return import.meta.env.DEV ? new URLSearchParams(window.location.search).get("mock") : null;
}

export function ReviewAnalytics({ secret }: { secret: string }) {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<Report | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [loading, setLoading] = useState(false);
  // Only the latest request may show its answer: clicking 90 days and then
  // 7 days must never leave the 90-day numbers under the 7-day pill.
  const latest = useRef(0);

  const load = useCallback(async (fresh = false) => {
    const id = ++latest.current;
    setLoading(true);
    let next: Report | Failure;
    const mock = mockVariant();
    if (mock !== null) next = mockReport(days, mock);
    else {
      try {
        const res = await fetch(`/api/analytics?days=${days}${fresh ? "&fresh=1" : ""}`, { headers: { "x-review-secret": secret } });
        next = (await res.json()) as Report | Failure;
      } catch {
        next = { ok: false, error: "network" };
      }
    }
    if (id !== latest.current) return;
    if (next.ok) {
      setData(next);
      setFailure(null);
    } else setFailure(next);
    setLoading(false);
  }, [days, secret]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        {RANGES.map((d) => {
          const active = d === days;
          return (
            <button key={d} type="button" onClick={() => setDays(d)} style={{
              padding: "8px 14px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 13, fontWeight: 600,
              background: active ? "linear-gradient(180deg, #FF8C71 0%, #E64B45 100%)" : "rgba(35,20,16,0.06)", color: active ? "#FFF8EE" : INK,
            }}>Last {d} days</button>
          );
        })}
        <button type="button" onClick={() => void load(true)} style={{ ...linkButton, marginLeft: 6 }}>Refresh</button>
        {data && <span style={{ fontFamily: SANS, fontSize: 12, color: INK_3 }}>Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
      </div>

      {failure && <FailureNote failure={failure} />}
      {!data && !failure && <Empty text={loading ? "Loading Google Analytics data…" : "No data yet."} />}
      {data && (
        <div style={{ opacity: loading ? 0.55 : 1, transition: "opacity 160ms" }}>
          <Dashboard r={data} />
        </div>
      )}
    </div>
  );
}

function FailureNote({ failure }: { failure: Failure }) {
  const text: Record<string, ReactNode> = {
    wrong_password: "The analytics endpoint did not accept the review password. Sign out and sign in again.",
    locked: "Too many wrong passwords, so password checks are paused for 15 minutes. Try again after that.",
    auth_unavailable: "The password check (the Apps Script) didn't answer. Refresh in a minute.",
    not_configured: (
      <>
        Google Analytics isn't connected yet. Create a Google Cloud service account, give its email Viewer access to the
        GA4 property, then run <code>npx wrangler secret put GA_SERVICE_ACCOUNT</code> in the gift-picker folder and paste
        the JSON key.
      </>
    ),
    network: "Couldn't reach the analytics endpoint. Check the connection and refresh.",
    ga_error: `Google Analytics returned an error: ${failure.detail ?? ""}`,
  };
  return (
    <ClaySurface tint="butter" style={{ padding: 18, marginBottom: 18, fontFamily: SANS, fontSize: 14, color: INK, lineHeight: 1.5 }}>
      {text[failure.error] ?? `Something went wrong (${failure.error}).`}
    </ClaySurface>
  );
}

const twoUp: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 };

function Dashboard({ r }: { r: Report }) {
  const isMobile = useIsMobile();
  const ev = (n: string) => r.events[n] ?? { eventCount: 0, totalUsers: 0 };
  const quizDone = ev("quiz_complete");
  const opens = ev("gift_open");
  const clicks = ev("gift_buy_click");
  const delta = (k: KpiKey) => changeText(change(r.kpis.current[k], r.kpis.previous[k]), r.days);
  const tile = (k: KpiKey, label: string, note?: string) => (
    <Stat label={label} value={fmtKpi(k, r.kpis.current[k])} delta={delta(k)} note={note} />
  );

  const amazon = r.destinations?.find((d) => d["customEvent:destination"] === "amazon")?.eventCount ?? 0;
  const brand = r.destinations?.find((d) => d["customEvent:destination"] === "brand")?.eventCount ?? 0;
  const funnelSteps = r.funnel.steps;
  // A closed funnel compares each step with the one before; an open one (people skip steps) with all visitors.
  const funnelBase = (i: number) => (r.funnel.closed ? funnelSteps[i - 1].users : funnelSteps[0].users);
  const funnelBaseLabel = r.funnel.closed ? "of the step before" : "of all visitors";
  const actions: [string, number][] = [
    ["Results views", r.results.views], ["Opened a gift", opens.eventCount], ["Clicked to a store", clicks.eventCount],
    ["Loaded more", ev("results_load_more").eventCount], ["Refined answers", ev("results_refine").eventCount],
    ["Saved a gift", ev("gift_save").eventCount], ["Shared", ev("gift_share").eventCount], ["Asked for more", ev("request_more").eventCount],
  ];

  const steps = (r.quizSteps ?? [])
    .map((s) => ({ step: Number(s["customEvent:step_index"]), users: s.totalUsers }))
    .filter((s) => Number.isFinite(s.step))
    .sort((a, b) => a.step - b.step);

  const marks: Marks = new Map(r.changes.map((c) => [c.date.replace(/-/g, ""), c.titles]));
  const sources = r.sources.slice(0, 8);
  const deviceTotal = r.devices.reduce((a, x) => a + x.sessions, 0);
  const recipientTotal = (r.recipients ?? []).reduce((a, x) => a + x.count, 0);
  const interestTotal = (r.interests ?? []).reduce((a, x) => a + x.count, 0);
  const bands = RESULTS_BANDS.map((b) => ({ band: b, count: r.resultsBands?.find((x) => x.band === b)?.count ?? 0 }));
  const bandTotal = bands.reduce((a, x) => a + x.count, 0);
  const lowClick = r.lowClickGifts;

  return (
    <>
      {r.missingDims.length > 0 && (
        <ClaySurface tint="butter" style={{ padding: 16, marginBottom: 18, fontFamily: SANS, fontSize: 13, color: INK, lineHeight: 1.5 }}>
          A few charts need GA to report event details. In Google Analytics, open Admin, Custom definitions, and create
          event-scoped custom dimensions named {r.missingDims.map((d) => <code key={d} style={{ marginRight: 6 }}>{d}</code>)}
          (same parameter name). They fill in from the day they are created.
        </ClaySurface>
      )}

      {r.takeaways.length > 0 && (
        <ClaySurface tint="cream" style={{ padding: "16px 20px", marginBottom: 18 }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: INK, marginBottom: 8 }}>Takeaways</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontFamily: SANS, fontSize: 14, color: INK, lineHeight: 1.45 }}>
            {r.takeaways.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </ClaySurface>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
        {tile("visitors", "Visitors", `${fmt(r.totals.sessions ?? 0)} visits`)}
        {tile("quizzesFinished", "Quizzes finished", `${fmt(quizDone.totalUsers)} people`)}
        {tile("quizzesPerTaker", "Quizzes per quiz taker")}
        {tile("resultsSeconds", "Time on results", "average engaged time per view")}
        {tile("opensPer100", "Gifts opened per 100 results views")}
        {tile("clicksPer100", "Store clicks per 100 results views", `${fmt(clicks.eventCount)} clicks in all`)}
      </div>

      <Card
        title="From visit to store click"
        sub={r.funnel.closed ? "People who reached each step after every earlier one" : "GA's funnel report did not load, so each step counts the people who did it in the period, as a share of all visitors (people can skip steps: a shared link opens results directly, and cards have their own Buy button)"}
        table={<DataTable head={["Step", "People", cap(funnelBaseLabel)]}
          rows={funnelSteps.map((s, i) => [s.name, fmt(s.users), i ? pct(s.users, funnelBase(i)) : ""])} />}
      >
        <HBars
          items={funnelSteps.map((s, i) => ({
            label: s.name, value: s.users,
            tip: `${s.name}: ${fmt(s.users)} people${i ? `, ${pct(s.users, funnelBase(i))} ${funnelBaseLabel}` : ""}`,
          }))}
          sub={(v, i) => (i ? `· ${pct(v, funnelBase(i))}` : "")}
        />
        {r.funnel.error && (
          <div style={{ fontFamily: SANS, fontSize: 12, color: INK_3, marginTop: 12 }}>Funnel report error: {r.funnel.error}</div>
        )}
      </Card>

      <Card
        title="Day by day"
        sub="Visitors, finished quizzes, and store clicks. Dashed lines mark days with site changes; point at the marker under a line to see them."
        table={<DataTable head={["Day", "Visitors", "Quizzes", "Store clicks", "Site changes"]}
          rows={r.trend.map((t) => [dayLabel(t.date), fmt(t.visitors), fmt(t.quizzes), fmt(t.storeClicks), marks.get(t.date)?.length ?? ""])} />}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 22 }}>
          <MiniColumns title="Visitors" marks={marks} points={r.trend.map((t) => ({ date: t.date, value: t.visitors }))} />
          <MiniColumns title="Quizzes finished" marks={marks} points={r.trend.map((t) => ({ date: t.date, value: t.quizzes }))} />
          <MiniColumns title="Store clicks" marks={marks} points={r.trend.map((t) => ({ date: t.date, value: t.storeClicks }))} />
        </div>
      </Card>

      <ChangesCard changes={r.changes} />

      <div style={twoUp}>
        <Card title="Where store clicks go" sub="Amazon versus the brand's own store">
          {r.destinations ? <SplitBar a={{ label: "Amazon", value: amazon }} b={{ label: "Brand store", value: brand }} />
            : <Empty text={needsDim("destination")} />}
        </Card>
        <Card title="What people do on results" sub="Counts in this period"
          table={<DataTable head={["Action", "Count", "Per 100 results views"]}
            rows={actions.map(([label, value], i) => [label, fmt(value), i ? fmtRate(per100(value, r.results.views)) : ""])} />}
        >
          <HBars items={actions.map(([label, value], i) => ({
            label, value,
            tip: i ? `${label}: ${fmt(value)} (${fmtRate(per100(value, r.results.views))} per 100 results views)` : `${label}: ${fmt(value)}`,
          }))} />
        </Card>
      </div>

      <div style={twoUp}>
        <Card title="Where people drop off in the quiz" sub="People who saw each question">
          {steps.length ? (
            <HBars items={steps.map((s, i) => ({
              label: `Question ${s.step + 1}`, value: s.users,
              tip: `Question ${s.step + 1}: ${fmt(s.users)} people${i ? `, ${pct(s.users, steps[i - 1].users)} of the question before` : ""}`,
            }))} sub={(v, i) => (i ? `· ${pct(v, steps[i - 1].users)}` : "")} />
          ) : <Empty text={r.quizSteps ? "No quiz steps in this period." : needsDim("step_index")} />}
        </Card>
        <Card title="Where visits come from" sub="Top sources by visits; the second number is store clicks per 100 visits"
          table={<DataTable head={["Source", "Visits", "Engaged", "Store clicks", "Per 100 visits"]}
            rows={r.sources.map((s) => [sourceLabel(s.sessionSource), fmt(s.sessions), pct(s.engagedSessions, s.sessions), fmt(s.storeClicks), fmtRate(per100(s.storeClicks, s.sessions))])} />}
        >
          {sources.length ? (
            <HBars
              items={sources.map((s) => ({
                label: sourceLabel(s.sessionSource), value: s.sessions,
                tip: `${s.sessionSource}: ${fmt(s.sessions)} visits, ${fmt(s.storeClicks)} store clicks (${fmtRate(per100(s.storeClicks, s.sessions))} per 100 visits)`,
              }))}
              sub={(_, i) => `· ${fmtRate(per100(sources[i].storeClicks, sources[i].sessions))}`}
            />
          ) : <Empty text="No visits in this period." />}
        </Card>
      </div>

      <div style={twoUp}>
        <Card title="Who people shop for" sub="Finished quizzes by recipient"
          table={r.recipients?.length ? <DataTable head={["Recipient", "Quizzes", "Share"]}
            rows={r.recipients.map((x) => [recipientLabel(x.recipient), fmt(x.count), pct(x.count, recipientTotal)])} /> : undefined}
        >
          {r.recipients?.length ? (
            <HBars items={r.recipients.map((x) => ({
              label: recipientLabel(x.recipient), value: x.count, tip: `${recipientLabel(x.recipient)}: ${fmt(x.count)} quizzes (${pct(x.count, recipientTotal)})`,
            }))} sub={(v) => `· ${pct(v, recipientTotal)}`} />
          ) : <Empty text={FILLS_IN} />}
        </Card>
        <Card title="Most picked interests" sub="Times each interest was picked in a finished quiz (top 10)"
          table={r.interests?.length ? <DataTable head={["Interest", "Picks", "Share of picks"]}
            rows={r.interests.map((x) => [interestLabel(x.interest), fmt(x.count), pct(x.count, interestTotal)])} /> : undefined}
        >
          {r.interests?.length ? (
            <HBars items={r.interests.slice(0, 10).map((x) => ({
              label: interestLabel(x.interest), value: x.count, tip: `${interestLabel(x.interest)}: ${fmt(x.count)} picks (${pct(x.count, interestTotal)} of all picks)`,
            }))} sub={(v) => `· ${pct(v, interestTotal)}`} />
          ) : <Empty text={FILLS_IN} />}
        </Card>
      </div>

      <Card title="How many results people get" sub="Share of results views by the number of gifts in the list"
        table={bandTotal ? <DataTable head={["Results in the list", "Views", "Share"]}
          rows={bands.map((b) => [BAND_LABELS[b.band], fmt(b.count), pct(b.count, bandTotal)])} /> : undefined}
      >
        {bandTotal ? (
          <HBars items={bands.map((b) => ({
            label: BAND_LABELS[b.band], value: b.count, tip: `${BAND_LABELS[b.band]}: ${fmt(b.count)} views (${pct(b.count, bandTotal)})`,
          }))} sub={(v) => `· ${pct(v, bandTotal)}`} />
        ) : <Empty text={FILLS_IN} />}
      </Card>

      <div style={twoUp}>
        <Card title="Most opened and clicked gifts" sub="Top 12 by store clicks">
          {r.gifts ? (r.gifts.length
            ? <DataTable head={["Gift", "Opened", "Store clicks"]} rows={r.gifts.slice(0, 12).map((g) => [g.name, fmt(g.opens), fmt(g.clicks)])} />
            : <Empty text="No gift opens in this period." />)
            : <Empty text={needsDim("gift_name")} />}
        </Card>
        <Card
          title="Opened but rarely clicked"
          sub={lowClick?.perOpen != null
            ? `Opened at least 3 times, with fewer store clicks per open than all gifts together (${fmtRate(lowClick.perOpen * 100)} per 100 opens)`
            : "Opened at least 3 times, with fewer store clicks per open than all gifts together"}
        >
          {lowClick ? (lowClick.gifts.length
            ? <DataTable head={["Gift", "Opened", "Store clicks"]} rows={lowClick.gifts.slice(0, 12).map((g) => [g.name, fmt(g.opens), fmt(g.clicks)])} />
            : <Empty text={lowClick.perOpen == null ? FILLS_IN : "No gift fits this in the period."} />)
            : <Empty text={FILLS_IN} />}
        </Card>
      </div>

      <SharesSection r={r} />
      <OpenedSection r={r} />

      <div style={twoUp}>
        <Card title="Devices" sub="Visits by device; the second number is store clicks per 100 visits"
          table={<DataTable head={["Device", "Visits", "Share", "Store clicks", "Per 100 visits"]}
            rows={r.devices.map((d) => [cap(d.deviceCategory), fmt(d.sessions), pct(d.sessions, deviceTotal), fmt(d.storeClicks), fmtRate(per100(d.storeClicks, d.sessions))])} />}
        >
          {r.devices.length ? (
            <HBars
              items={r.devices.map((d) => ({
                label: cap(d.deviceCategory), value: d.sessions,
                tip: `${cap(d.deviceCategory)}: ${fmt(d.sessions)} visits, ${fmt(d.storeClicks)} store clicks (${fmtRate(per100(d.storeClicks, d.sessions))} per 100 visits)`,
              }))}
              sub={(_, i) => `· ${fmtRate(per100(r.devices[i].storeClicks, r.devices[i].sessions))}`}
            />
          ) : <Empty text="No visits in this period." />}
        </Card>
        <Card title="New and returning visitors">
          <DataTable head={["Visitors", "People"]} rows={r.newVsReturning.filter((n) => n.newVsReturning).map((n) => [cap(n.newVsReturning || "Unknown"), fmt(n.activeUsers)])} />
        </Card>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: INK_3, marginTop: 4, lineHeight: 1.5 }}>
        From Google Analytics, so visitors with ad blockers are not counted. Numbers refresh every 10 minutes. Changes on
        the tiles compare with the previous {r.days} days; the current period includes today so far.
      </div>
    </>
  );
}

/* ---------------- dev-only sample data (vite dev with ?mock, or ?mock=missing) ---------------- */

function mockReport(days: number, variant: string | null): Report {
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const now = new Date();
  const today = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const first = addDays(today, -179); // 180 days, so the 90-day range has a previous period too

  const allDays: DailyRow[] = Array.from({ length: 180 }, (_, i) => {
    const date = addDays(first, i);
    const newSite = date >= "20261003";
    const visitors = Math.round((34 + 14 * Math.sin(i / 3) + rand() * 12) * (newSite ? 1.4 : 1) + (date === addDays(today, -3) ? 230 : 0));
    const quizStarters = Math.round(visitors * (newSite ? 0.6 : 0.48));
    const quizFinishers = Math.round(quizStarters * 0.72);
    const resultsViews = Math.round(quizFinishers * 1.3);
    return {
      date, visitors, quizStarters, quizFinishers, quizzes: Math.round(quizFinishers * 1.4),
      opens: Math.round(resultsViews * (date >= "20261013" ? 0.95 : 0.78)),
      storeClicks: Math.round(resultsViews * (date >= "20261007" ? 0.25 : 0.19)),
      resultsViews,
    };
  });
  const series = allDays.slice(-90);
  const period = (from: string, to: string): PeriodData => {
    const sel = allDays.filter((d) => d.date >= from && d.date <= to);
    const sum = (k: keyof Omit<DailyRow, "date">) => sel.reduce((a, d) => a + d[k], 0);
    const people = (n: number, perPerson: number) => ({ eventCount: n, totalUsers: Math.round(n / perPerson) });
    return {
      totals: { activeUsers: sum("visitors"), sessions: Math.round(sum("visitors") * 1.2) },
      events: {
        quiz_start: people(sum("quizStarters"), 1.05), quiz_complete: { eventCount: sum("quizzes"), totalUsers: sum("quizFinishers") },
        gift_open: people(sum("opens"), 3.4), gift_buy_click: people(sum("storeClicks"), 1.6),
        results_load_more: people(Math.round(sum("resultsViews") * 0.22), 1.3), results_refine: people(Math.round(sum("resultsViews") * 0.12), 1.2),
        gift_save: people(Math.round(sum("resultsViews") * 0.08), 1.5), gift_share: people(Math.round(sum("resultsViews") * (to >= "20261010" ? 0.034 : 0.026)), 1),
        request_more: people(Math.round(sum("resultsViews") * 0.02), 1),
        gift_link_copy: people(Math.round(sum("resultsViews") * 0.045), 1.1), share_open: people(Math.round(sum("resultsViews") * 0.07), 1),
      },
      results: { views: sum("resultsViews"), seconds: sum("resultsViews") * (to >= "20261003" ? 104 : 88), users: Math.round(sum("quizFinishers") * 0.98) },
    };
  };
  const current = period(addDays(today, -(days - 1)), today);
  const previous = period(addDays(today, -(2 * days - 1)), addDays(today, -days));
  const v = current.totals.activeUsers ?? 0;
  const funnel: Funnel = { closed: true, steps: [
    { name: "Visited", users: v }, { name: "Started the quiz", users: Math.round(v * 0.56) },
    { name: "Finished the quiz", users: Math.round(v * 0.41) }, { name: "Saw results", users: Math.round(v * 0.4) },
    { name: "Opened a gift", users: Math.round(v * 0.26) }, { name: "Clicked to a store", users: Math.round(v * 0.14) },
  ] };
  const scale = v / 1400;
  const n = (x: number) => Math.round(x * scale);
  const sources: SourceRow[] = [
    { sessionSource: "producthunt.com", sessions: n(420), engagedSessions: n(310), storeClicks: n(88) },
    { sessionSource: "(direct)", sessions: n(380), engagedSessions: n(190), storeClicks: n(41) },
    { sessionSource: "google", sessions: n(260), engagedSessions: n(170), storeClicks: n(52) },
    { sessionSource: "t.co", sessions: n(90), engagedSessions: n(40), storeClicks: n(6) },
    { sessionSource: "linkedin.com", sessions: n(60), engagedSessions: n(35), storeClicks: n(4) },
    { sessionSource: "reddit.com", sessions: 6, engagedSessions: 4, storeClicks: 3 },
  ];
  // name, opens, store clicks, copies, times seen, taps from a tile, gift page views
  const giftRows = [
    ["Sound Clock: Alarmo", 96, 41, 6, 610, 81, 22], ["Fluff Yeah Slippers", 71, 33, 3, 540, 60, 9], ["Exploding Kittens: Original Edition", 58, 19, 4, 480, 47, 14],
    ["Ember Mug 2", 44, 6, 1, 520, 31, 3], ["Personalized Star Map", 31, 4, 9, 300, 24, 31], ["Le Creuset Mini Cocotte", 22, 9, 0, 410, 15, 2],
    ["Bonsai Starter Kit", 17, 2, 2, 380, 12, 6], ["Vinyl Record Frame", 9, 1, 0, 260, 7, 0], ["Polaroid Go Gen 2", 6, 3, 1, 90, 5, 4],
    ["Mystery Book Box", 2, 0, 2, 15, 2, 1], ["Hand-Knit Wool Throw", 0, 0, 1, 0, 0, 12],
  ] as const;
  const gifts = giftStats(giftRows.flatMap(([name, o, c, k, seen]) => [
    { eventName: "gift_open", name, eventCount: n(o) }, { eventName: "gift_buy_click", name, eventCount: n(c) },
    { eventName: "gift_link_copy", name, eventCount: n(k) }, { eventName: "gift_impression", name, eventCount: n(seen) },
  ]));
  const missing = variant === "missing";
  // ?mock=nosource: everything but the source dimension, so detail opens fall back to every gift_open.
  const noSource = variant === "nosource";
  const taps = noSource ? null : Object.fromEntries(giftRows.map(([name, , , , , t]) => [name, n(t)]));
  const giftPageViews = Object.fromEntries(giftRows.map(([name, , , , , , pv]) => [name, n(pv)]));
  // gift_share by method and share_open by share_type, as GA would split them.
  const methodsOf = (p: PeriodData) => {
    const all = p.events.gift_share?.eventCount ?? 0;
    const shared = Math.round(all * 0.37);
    const copied = Math.round(all * 0.6);
    return { shared, copied, failed: all - shared - copied };
  };
  const openTypesOf = (p: PeriodData) => {
    const all = p.events.share_open?.eventCount ?? 0;
    const results = Math.round(all * 0.58);
    return { results, gift: all - results };
  };
  // Finished quizzes and a relative share rate by answer; the period's results shares are spread by quizzes times rate.
  const shareCount = current.events.gift_share?.eventCount ?? 0;
  const answerRows = (list: [string, number, number][]) => {
    const weight = list.reduce((a, [, q, rate]) => a + n(q) * rate, 0) || 1;
    return list.flatMap(([value, q, rate]) => [
      { eventName: "quiz_complete", value, eventCount: n(q) },
      { eventName: "gift_share", value, eventCount: Math.round((shareCount * n(q) * rate) / weight) },
    ]);
  };
  const shareRecipients = missing ? null : shareBreakdown(answerRows([
    ["partner", 310, 7.5], ["friend", 220, 3.2], ["parent", 180, 2.4], ["sibling", 96, 3.1], ["self", 74, 0.8], ["child", 61, 2.2],
    ["coworker", 40, 4.4], ["grandparent", 22, 1.5], ["mentor", 12, 6],
  ]));
  return {
    ok: true, days, generatedAt: new Date().toISOString(), today,
    missingDims: missing ? ["gift_name", "recipient", "interest", "results_band", "occasion", "method", "share_type", "source"] : noSource ? ["source"] : [],
    totals: current.totals, events: current.events, results: current.results,
    kpis: { current: kpis(current), previous: kpis(previous) },
    takeaways: takeaways({ days, current, previous, funnel, sources, shareRecipients }),
    funnel,
    trend: series.slice(-days).map((d) => ({ date: d.date, visitors: d.visitors, quizzes: d.quizzes, storeClicks: d.storeClicks })),
    changes: beforeAfter(series, series[0].date, today, CHANGES),
    sources,
    devices: [
      { deviceCategory: "mobile", sessions: n(820), storeClicks: n(118) },
      { deviceCategory: "desktop", sessions: n(360), storeClicks: n(70) },
      { deviceCategory: "tablet", sessions: n(30), storeClicks: n(3) },
    ],
    newVsReturning: [{ newVsReturning: "new", activeUsers: Math.round(v * 0.8) }, { newVsReturning: "returning", activeUsers: Math.round(v * 0.2) }],
    destinations: [{ "customEvent:destination": "amazon", eventCount: n(140) }, { "customEvent:destination": "brand", eventCount: n(101) }],
    gifts: missing ? null : gifts.filter((g) => g.opens || g.clicks),
    lowClickGifts: missing ? null : lowClickGifts(gifts),
    openedGifts: missing ? null : { fromCards: taps != null, gifts: mostOpenedGifts(gifts, taps, giftPageViews) },
    rarelyTapped: missing || !taps ? null : rarelyTappedGifts(gifts, taps),
    quizSteps: [0, 1, 2, 3, 4, 5].map((s) => ({ "customEvent:step_index": String(s), totalUsers: Math.round(v * 0.56 * Math.pow(0.9, s)) })),
    recipients: missing ? null : [
      ["partner", 310], ["friend", 220], ["parent", 180], ["sibling", 96], ["self", 74], ["child", 61], ["coworker", 40], ["grandparent", 22], ["mentor", 12],
    ].map(([recipient, c]) => ({ recipient: String(recipient), count: n(Number(c)) })),
    interests: missing ? null : [
      ["tech", 240], ["food", 190], ["home", 170], ["cooking", 150], ["books", 120], ["outdoors", 110], ["music", 96], ["wellness", 90],
      ["creative", 70], ["gaming", 64], ["travel", 52], ["pets", 40],
    ].map(([interest, c]) => ({ interest: String(interest), count: n(Number(c)) })),
    resultsBands: missing ? null : [
      { band: "20 plus", count: n(620) }, { band: "8 to 19", count: n(210) }, { band: "under 8", count: n(70) }, { band: "none", count: n(12) },
    ],
    shares: {
      current: shareTotals(current, missing ? null : methodsOf(current), missing ? null : openTypesOf(current)),
      previous: shareTotals(previous, missing ? null : methodsOf(previous), missing ? null : openTypesOf(previous)),
    },
    copiedGifts: missing ? null : mostCopiedGifts(gifts),
    shareRecipients,
    shareOccasions: missing ? null : shareBreakdown(answerRows([
      ["bday", 300, 3.4], ["holi", 260, 5.2], ["anni", 120, 6.1], ["jb", 90, 2.1], ["wed", 60, 4.8], ["thank", 40, 2.6],
      ["newjob", 30, 3.3], ["housewarm", 25, 2.2], ["other", 22, 4.1], ["baby", 20, 3.9], ["appreciate", 15, 2.1], ["sympathy", 8, 1],
    ])),
  };
}
