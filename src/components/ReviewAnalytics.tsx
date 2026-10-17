import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ClaySurface } from "./clay/ClaySurface";
import { useIsMobile } from "../hooks/useIsMobile";

/**
 * Analytics tab of /review: how visitors move through the site, built from the
 * Google Analytics 4 data the site already collects (no extra tracking). The
 * numbers come from the worker's /api/analytics, gated by the review password.
 */

type EventStat = { eventCount: number; totalUsers: number };
type Report = {
  ok: true;
  days: number;
  generatedAt: string;
  missingDims: string[];
  totals: { activeUsers?: number; newUsers?: number; sessions?: number; engagedSessions?: number; userEngagementDuration?: number };
  events: Record<string, EventStat | undefined>;
  results: { views: number; seconds: number; users: number };
  funnel: { closed: boolean; error?: string; steps: { name: string; users: number }[] };
  trend: { date: string; visitors: number; sessions: number; quizzes: number; storeClicks: number }[];
  sources: { sessionSource: string; sessions: number; engagedSessions: number }[];
  devices: { deviceCategory: string; sessions: number }[];
  newVsReturning: { newVsReturning: string; activeUsers: number }[];
  destinations: { "customEvent:destination": string; eventCount: number }[] | null;
  topGifts: { eventName: string; "customEvent:gift_name": string; eventCount: number }[] | null;
  quizSteps: { "customEvent:step_index": string; totalUsers: number }[] | null;
};
type Failure = { ok: false; error: string; detail?: string };

const INK = "#231410";
const INK_2 = "rgba(35,20,16,0.62)";
const INK_3 = "rgba(35,20,16,0.42)";
const GRID = "rgba(35,20,16,0.08)";
const TRACK = "rgba(230,75,69,0.12)";
const CORAL = "#E64B45"; // sequential and series 1 (Amazon)
const PLUM = "#7E3F71"; // series 2 (brand stores); validated pair, light surface
const SANS = "Geist, sans-serif";

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}K` : Math.round(n).toLocaleString());
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "–");
const ratio = (a: number, b: number) => (b > 0 ? (a / b).toFixed(1) : "–");
/** Events per 100 results views: small per-view rates (0.04) read better this way. */
const per100 = (a: number, b: number) => (b > 0 ? fmt((a / b) * 100) : "–");
const duration = (s: number) => {
  if (!isFinite(s) || s <= 0) return "–";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m ? `${m}m ${String(sec).padStart(2, "0")}s` : `${sec}s`;
};
const dayLabel = (d: string) => new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/* ---------------- shared pieces ---------------- */

function Card({ title, sub, children, table }: { title: string; sub?: string; children: ReactNode; table?: ReactNode }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <ClaySurface tint="cream" style={{ padding: 22, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 16, color: INK }}>{title}</div>
          {sub && <div style={{ fontFamily: SANS, fontSize: 13, color: INK_2, marginTop: 3 }}>{sub}</div>}
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
            <th key={h} style={{ textAlign: i ? "right" : "left", fontWeight: 600, color: INK_2, padding: "6px 4px", borderBottom: `1px solid ${GRID}` }}>{h}</th>
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

function Tip({ text, children, style }: { text: string; children: ReactNode; style?: CSSProperties }) {
  const [show, setShow] = useState(false);
  return (
    <span
      tabIndex={0}
      aria-label={text}
      onPointerEnter={() => setShow(true)}
      onPointerLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      style={{ position: "relative", display: "block", outline: "none", ...style }}
    >
      {children}
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", zIndex: 5,
          background: INK, color: "#FFF8EE", fontFamily: SANS, fontSize: 12, padding: "6px 9px", borderRadius: 8,
          whiteSpace: "nowrap", pointerEvents: "none",
        }}>{text}</span>
      )}
    </span>
  );
}

/* ---------------- stat tiles ---------------- */

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <ClaySurface tint="cream" style={{ padding: "16px 18px" }}>
      <div style={{ fontFamily: SANS, fontSize: 13, color: INK_2 }}>{label}</div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: INK, marginTop: 4, letterSpacing: "-0.01em" }}>{value}</div>
      {note && <div style={{ fontFamily: SANS, fontSize: 12, color: INK_3, marginTop: 4 }}>{note}</div>}
    </ClaySurface>
  );
}

/* ---------------- charts ---------------- */

/** Horizontal bars, one hue, value at the tip; used for the funnel and quiz steps. */
function HBars({ items, sub }: { items: { label: string; value: number; tip: string; note?: string }[]; sub?: (v: number, i: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((it, i) => (
        <div key={it.label} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 170px) 1fr", gap: 12, alignItems: "center" }}>
          <div style={{ fontFamily: SANS, fontSize: 13, color: INK }}>{it.label}</div>
          <Tip text={it.tip}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: `0 0 ${Math.max(1.5, (it.value / max) * 82)}%`, height: 20, background: CORAL, borderRadius: "0 4px 4px 0" }} />
              <span style={{ fontFamily: SANS, fontSize: 13, color: INK, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {fmt(it.value)}
                {sub && <span style={{ color: INK_3 }}> {sub(it.value, i)}</span>}
              </span>
            </div>
          </Tip>
        </div>
      ))}
    </div>
  );
}

/** One small column chart per measure (small multiples, never a second axis). */
function MiniColumns({ title, points }: { title: string; points: { date: string; value: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((a, p) => a + p.value, 0);
  const H = 88;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 13, marginBottom: 8 }}>
        <span style={{ color: INK }}>{title}</span>
        <span style={{ color: INK_2, fontVariantNumeric: "tabular-nums" }}>{fmt(total)} total</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: H, borderBottom: `1px solid ${GRID}` }}>
        {points.map((p) => (
          <div key={p.date} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
            <Tip text={`${dayLabel(p.date)}: ${fmt(p.value)}`}>
              <div style={{ height: H, display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", minWidth: 2, maxWidth: 24, height: Math.max(p.value ? 2 : 0, (p.value / max) * (H - 4)), background: CORAL, borderRadius: "4px 4px 0 0" }} />
              </div>
            </Tip>
          </div>
        ))}
      </div>
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

function Empty({ text }: { text: string }) {
  return <div style={{ fontFamily: SANS, fontSize: 13, color: INK_2, padding: "8px 0" }}>{text}</div>;
}

/* ---------------- the page ---------------- */

const RANGES = [7, 30, 90] as const;

export function ReviewAnalytics({ secret }: { secret: string }) {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<Report | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (fresh = false) => {
    setLoading(true);
    try {
      if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("mock")) {
        setData(mockReport(days));
        setFailure(null);
        return;
      }
      const res = await fetch(`/api/analytics?days=${days}${fresh ? "&fresh=1" : ""}`, { headers: { "x-review-secret": secret } });
      const json = (await res.json()) as Report | Failure;
      if (json.ok) {
        setData(json);
        setFailure(null);
      } else setFailure(json);
    } catch {
      setFailure({ ok: false, error: "network" });
    } finally {
      setLoading(false);
    }
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
    unauthorized: "The analytics endpoint did not accept the review password. Sign out and in again.",
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

function Dashboard({ r }: { r: Report }) {
  const isMobile = useIsMobile();
  const ev = (n: string) => r.events[n] ?? { eventCount: 0, totalUsers: 0 };
  const visitors = r.totals.activeUsers ?? 0;
  const quizDone = ev("quiz_complete");
  const opens = ev("gift_open");
  const clicks = ev("gift_buy_click");
  const avgResults = r.results.views ? r.results.seconds / r.results.views : 0;

  const amazon = r.destinations?.find((d) => d["customEvent:destination"] === "amazon")?.eventCount ?? 0;
  const brand = r.destinations?.find((d) => d["customEvent:destination"] === "brand")?.eventCount ?? 0;

  const funnelSteps = r.funnel.steps.length
    ? r.funnel.steps
    : [
        { name: "Visited", users: visitors },
        { name: "Started the quiz", users: ev("quiz_start").totalUsers },
        { name: "Finished the quiz", users: quizDone.totalUsers },
        { name: "Saw results", users: r.results.users },
        { name: "Opened a gift", users: opens.totalUsers },
        { name: "Clicked to a store", users: clicks.totalUsers },
      ];

  const giftRows = (() => {
    if (!r.topGifts) return [];
    const m = new Map<string, { name: string; opens: number; clicks: number }>();
    for (const g of r.topGifts) {
      const name = g["customEvent:gift_name"];
      if (!name || name === "(not set)") continue;
      const row = m.get(name) ?? { name, opens: 0, clicks: 0 };
      if (g.eventName === "gift_open") row.opens += g.eventCount;
      else row.clicks += g.eventCount;
      m.set(name, row);
    }
    return [...m.values()].sort((a, b) => b.clicks - a.clicks || b.opens - a.opens).slice(0, 12);
  })();

  const steps = (r.quizSteps ?? [])
    .map((s) => ({ step: Number(s["customEvent:step_index"]), users: s.totalUsers }))
    .filter((s) => Number.isFinite(s.step))
    .sort((a, b) => a.step - b.step);

  return (
    <>
      {r.missingDims.length > 0 && (
        <ClaySurface tint="butter" style={{ padding: 16, marginBottom: 18, fontFamily: SANS, fontSize: 13, color: INK, lineHeight: 1.5 }}>
          A few charts need GA to report event details. In Google Analytics, open Admin, Custom definitions, and create
          event-scoped custom dimensions named {r.missingDims.map((d) => <code key={d} style={{ marginRight: 6 }}>{d}</code>)}
          (same parameter name). They fill in from the day they are created.
        </ClaySurface>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
        <Stat label="Visitors" value={fmt(visitors)} note={`${fmt(r.totals.sessions ?? 0)} visits`} />
        <Stat label="Quizzes finished" value={fmt(quizDone.eventCount)} note={`${fmt(quizDone.totalUsers)} people`} />
        <Stat label="Quizzes per quiz taker" value={ratio(quizDone.eventCount, quizDone.totalUsers)} />
        <Stat label="Time on results" value={duration(avgResults)} note="average engaged time per view" />
        <Stat label="Gifts opened per 100 results views" value={per100(opens.eventCount, r.results.views)} />
        <Stat label="Store clicks per 100 results views" value={per100(clicks.eventCount, r.results.views)} note={`${fmt(clicks.eventCount)} clicks in all`} />
      </div>

      <Card
        title="From visit to store click"
        sub={r.funnel.closed ? "People who reached each step after every earlier one" : "People who did each step in the period, as a share of all visitors (people can skip steps: a shared link opens results directly, and cards have their own Buy button)"}
        table={<DataTable head={["Step", "People", "Of the step before", "Of all visitors"]}
          rows={funnelSteps.map((s, i) => [s.name, fmt(s.users), i ? pct(s.users, funnelSteps[i - 1].users) : "", pct(s.users, funnelSteps[0].users)])} />}
      >
        <HBars
          items={funnelSteps.map((s, i) => ({
            label: s.name, value: s.users,
            tip: `${s.name}: ${fmt(s.users)} people${i ? (r.funnel.closed ? `, ${pct(s.users, funnelSteps[i - 1].users)} of the step before` : `, ${pct(s.users, funnelSteps[0].users)} of all visitors`) : ""}`,
          }))}
          sub={(v, i) => (i ? `· ${pct(v, r.funnel.closed ? funnelSteps[i - 1].users : funnelSteps[0].users)}` : "")}
        />
      </Card>

      <Card
        title="Day by day"
        sub="Visitors, finished quizzes, and store clicks"
        table={<DataTable head={["Day", "Visitors", "Quizzes", "Store clicks"]}
          rows={r.trend.map((t) => [dayLabel(t.date), fmt(t.visitors), fmt(t.quizzes), fmt(t.storeClicks)])} />}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 22 }}>
          <MiniColumns title="Visitors" points={r.trend.map((t) => ({ date: t.date, value: t.visitors }))} />
          <MiniColumns title="Quizzes finished" points={r.trend.map((t) => ({ date: t.date, value: t.quizzes }))} />
          <MiniColumns title="Store clicks" points={r.trend.map((t) => ({ date: t.date, value: t.storeClicks }))} />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <Card title="Where store clicks go" sub="Amazon versus the brand's own store">
          {r.destinations ? <SplitBar a={{ label: "Amazon", value: amazon }} b={{ label: "Brand store", value: brand }} />
            : <Empty text="Needs the destination custom dimension (see the note above)." />}
        </Card>
        <Card title="What people do on results" sub="Per results view in this period"
          table={<DataTable head={["Action", "Count"]} rows={[
            ["Results views", fmt(r.results.views)], ["Gifts opened", fmt(opens.eventCount)], ["Store clicks", fmt(clicks.eventCount)],
            ["Loaded more", fmt(ev("results_load_more").eventCount)], ["Refined answers", fmt(ev("results_refine").eventCount)],
            ["Saved a gift", fmt(ev("gift_save").eventCount)], ["Shared", fmt(ev("gift_share").eventCount)], ["Asked for more", fmt(ev("request_more").eventCount)],
          ]} />}
        >
          <HBars items={[
            ["Opened a gift", opens.eventCount], ["Clicked to a store", clicks.eventCount], ["Loaded more", ev("results_load_more").eventCount],
            ["Refined answers", ev("results_refine").eventCount], ["Saved a gift", ev("gift_save").eventCount], ["Shared", ev("gift_share").eventCount],
          ].map(([label, value]) => ({ label: String(label), value: Number(value), tip: `${label}: ${fmt(Number(value))} (${per100(Number(value), r.results.views)} per 100 results views)` }))} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <Card title="Where people drop off in the quiz" sub="People who saw each question">
          {steps.length ? (
            <HBars items={steps.map((s, i) => ({
              label: `Question ${s.step + 1}`, value: s.users,
              tip: `Question ${s.step + 1}: ${fmt(s.users)} people${i ? `, ${pct(s.users, steps[i - 1].users)} of the question before` : ""}`,
            }))} sub={(v, i) => (i ? `· ${pct(v, steps[i - 1].users)}` : "")} />
          ) : <Empty text={r.quizSteps ? "No quiz steps in this period." : "Needs the step_index custom dimension (see the note above)."} />}
        </Card>
        <Card title="Where visits come from" sub="Top sources by visits"
          table={<DataTable head={["Source", "Visits", "Engaged"]} rows={r.sources.map((s) => [s.sessionSource, fmt(s.sessions), pct(s.engagedSessions, s.sessions)])} />}
        >
          <HBars items={r.sources.slice(0, 8).map((s) => ({
            label: s.sessionSource === "(direct)" ? "Direct" : s.sessionSource, value: s.sessions,
            tip: `${s.sessionSource}: ${fmt(s.sessions)} visits, ${pct(s.engagedSessions, s.sessions)} engaged`,
          }))} />
        </Card>
      </div>

      <Card title="Most opened and clicked gifts" sub="Top 12 by store clicks">
        {r.topGifts ? (giftRows.length
          ? <DataTable head={["Gift", "Opened", "Store clicks"]} rows={giftRows.map((g) => [g.name, fmt(g.opens), fmt(g.clicks)])} />
          : <Empty text="No gift opens in this period." />)
          : <Empty text="Needs the gift_name custom dimension (see the note above)." />}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <Card title="Devices" sub="Visits by device">
          <DataTable head={["Device", "Visits", "Share"]} rows={r.devices.map((d) => [cap(d.deviceCategory), fmt(d.sessions), pct(d.sessions, r.devices.reduce((a, x) => a + x.sessions, 0))])} />
        </Card>
        <Card title="New and returning visitors">
          <DataTable head={["Visitors", "People"]} rows={r.newVsReturning.filter((n) => n.newVsReturning).map((n) => [cap(n.newVsReturning || "Unknown"), fmt(n.activeUsers)])} />
        </Card>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: INK_3, marginTop: 4 }}>
        From Google Analytics, so visitors with ad blockers are not counted. Numbers refresh every 10 minutes.
      </div>
    </>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------- dev-only sample data (vite dev with ?mock) ---------------- */

function mockReport(days: number): Report {
  const today = new Date();
  const trend = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const v = Math.round(40 + 30 * Math.sin(i / 3) + (i === days - 3 ? 260 : 0) + Math.random() * 20);
    return { date: ds, visitors: v, sessions: Math.round(v * 1.2), quizzes: Math.round(v * 0.45), storeClicks: Math.round(v * 0.3) };
  });
  const sum = (k: "visitors" | "quizzes" | "storeClicks") => trend.reduce((a, t) => a + t[k], 0);
  const visitors = sum("visitors");
  return {
    ok: true, days, generatedAt: new Date().toISOString(), missingDims: [],
    totals: { activeUsers: visitors, newUsers: Math.round(visitors * 0.8), sessions: Math.round(visitors * 1.2), engagedSessions: Math.round(visitors * 0.7), userEngagementDuration: visitors * 95 },
    events: {
      quiz_start: { eventCount: Math.round(visitors * 0.62), totalUsers: Math.round(visitors * 0.58) },
      quiz_complete: { eventCount: sum("quizzes"), totalUsers: Math.round(sum("quizzes") / 1.4) },
      gift_open: { eventCount: Math.round(visitors * 1.1), totalUsers: Math.round(visitors * 0.3) },
      gift_buy_click: { eventCount: sum("storeClicks"), totalUsers: Math.round(sum("storeClicks") / 1.6) },
      results_load_more: { eventCount: Math.round(visitors * 0.2), totalUsers: 0 },
      results_refine: { eventCount: Math.round(visitors * 0.12), totalUsers: 0 },
      gift_save: { eventCount: Math.round(visitors * 0.08), totalUsers: 0 },
      gift_share: { eventCount: Math.round(visitors * 0.03), totalUsers: 0 },
      request_more: { eventCount: Math.round(visitors * 0.02), totalUsers: 0 },
    },
    results: { views: Math.round(sum("quizzes") * 1.3), seconds: Math.round(sum("quizzes") * 1.3 * 104), users: Math.round(sum("quizzes") / 1.35) },
    funnel: { closed: true, steps: [
      { name: "Visited", users: visitors }, { name: "Started the quiz", users: Math.round(visitors * 0.58) },
      { name: "Finished the quiz", users: Math.round(visitors * 0.41) }, { name: "Saw results", users: Math.round(visitors * 0.4) },
      { name: "Opened a gift", users: Math.round(visitors * 0.26) }, { name: "Clicked to a store", users: Math.round(visitors * 0.14) },
    ] },
    trend,
    sources: [
      { sessionSource: "producthunt.com", sessions: 420, engagedSessions: 310 }, { sessionSource: "(direct)", sessions: 380, engagedSessions: 190 },
      { sessionSource: "google", sessions: 260, engagedSessions: 170 }, { sessionSource: "t.co", sessions: 90, engagedSessions: 40 },
      { sessionSource: "linkedin.com", sessions: 60, engagedSessions: 35 },
    ],
    devices: [{ deviceCategory: "mobile", sessions: 820 }, { deviceCategory: "desktop", sessions: 360 }, { deviceCategory: "tablet", sessions: 30 }],
    newVsReturning: [{ newVsReturning: "new", activeUsers: Math.round(visitors * 0.8) }, { newVsReturning: "returning", activeUsers: Math.round(visitors * 0.2) }],
    destinations: [{ "customEvent:destination": "amazon", eventCount: Math.round(sum("storeClicks") * 0.58) }, { "customEvent:destination": "brand", eventCount: Math.round(sum("storeClicks") * 0.42) }],
    topGifts: [
      { eventName: "gift_buy_click", "customEvent:gift_name": "Sound Clock: Alarmo", eventCount: 41 }, { eventName: "gift_open", "customEvent:gift_name": "Sound Clock: Alarmo", eventCount: 96 },
      { eventName: "gift_buy_click", "customEvent:gift_name": "Fluff Yeah Slippers", eventCount: 33 }, { eventName: "gift_open", "customEvent:gift_name": "Fluff Yeah Slippers", eventCount: 71 },
      { eventName: "gift_open", "customEvent:gift_name": "Exploding Kittens: Original Edition", eventCount: 58 }, { eventName: "gift_buy_click", "customEvent:gift_name": "Exploding Kittens: Original Edition", eventCount: 19 },
    ],
    quizSteps: [0, 1, 2, 3, 4, 5].map((s) => ({ "customEvent:step_index": String(s), totalUsers: Math.round(visitors * 0.58 * Math.pow(0.9, s)) })),
  };
}
