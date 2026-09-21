import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BudgetSlider } from "./BudgetSlider";
import { ChipChoice } from "./ChipChoice";
import { Pillow } from "./Pillow";
import {
  GENDER_OPTIONS,
  QUESTIONS,
  getActiveOptions,
  getActiveQuestions,
  type Answers,
  type Question,
} from "../../data/questions";

type Props = {
  open: boolean;
  answers: Answers;
  isMobile: boolean;
  onClose: () => void;
  onApply: (next: Answers) => void;
};

const q = (id: keyof Answers) => QUESTIONS.find((x) => x.id === id) as Question;

/** Drop answers the quiz itself would no longer ask, after an upstream change. */
function reconcile(a: Answers): Answers {
  const next = { ...a };
  const active = getActiveQuestions(next).map((x) => x.id);
  if (!active.includes("age")) delete next.age;
  if (next.age && !getActiveOptions(q("age"), next).some((o) => o.v === next.age)) delete next.age;
  if (next.occasion && !getActiveOptions(q("occasion"), next).some((o) => o.v === next.occasion)) {
    delete next.occasion;
    delete next.occasionOther;
  }
  if (next.occasion !== "other") delete next.occasionOther;
  return next;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: "Geist, sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(35,20,16,0.6)",
          }}
        >
          {title}
        </h3>
        {hint && <span style={{ fontFamily: "Geist, sans-serif", fontSize: 12, color: "rgba(35,20,16,0.45)" }}>{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export function RefineModal({ open, answers, isMobile, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<Answers>(answers);

  // Start from the live answers every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setDraft(answers);
  }, [open, answers]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const set = (patch: Partial<Answers>) => setDraft((d) => reconcile({ ...d, ...patch }));
  const toggle = (id: "interests" | "vibe", v: string, max: number) =>
    setDraft((d) => {
      const cur = d[id] ?? [];
      if (cur.includes(v)) return { ...d, [id]: cur.filter((x) => x !== v) };
      if (cur.length >= max) return d;
      return { ...d, [id]: [...cur, v] };
    });

  const activeIds = getActiveQuestions(draft).map((x) => x.id);
  const grid = (cols: number) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${isMobile ? Math.min(cols, 2) : cols}, 1fr)`,
    gap: 8,
  });
  const budgetQ = q("budget");
  const interestsQ = q("interests");
  const vibeQ = q("vibe");
  const canApply = !!draft.recipient;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Adjust your answers"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(35,20,16,0.38)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 24,
        animation: "fbFade 180ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: isMobile ? "92vh" : "88vh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #FFFCF5 0%, #FBF1E1 100%)",
          borderRadius: isMobile ? "24px 24px 0 0" : 24,
          boxShadow: "inset 0 1.2px 0 rgba(255,255,255,0.8), 0 40px 80px -20px rgba(30,15,10,0.5)",
          overflow: "hidden",
          animation: isMobile ? "fbSheetUp 260ms cubic-bezier(.22,1.4,.4,1)" : "fbPop 220ms cubic-bezier(.22,1.4,.4,1)",
        }}
      >
        <div style={{ padding: isMobile ? "20px 20px 8px" : "26px 28px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontFamily: '"Instrument Serif", serif', fontWeight: 400, fontSize: isMobile ? 28 : 32, color: "#231410" }}>
            Adjust your picks
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.9)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -2px rgba(80,30,30,0.25)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2L10 10M10 2L2 10" stroke="#231410" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: isMobile ? "8px 20px 16px" : "10px 28px 18px", minHeight: 0 }}>
          <Section title="Who's it for">
            <div style={grid(4)}>
              {q("recipient").type !== "slider" &&
                (q("recipient") as Exclude<Question, { type: "slider" }>).options.map((o) => (
                  <ChipChoice key={o.v} option={o} selected={draft.recipient === o.v} atMax={false} onClick={() => set({ recipient: o.v })} />
                ))}
            </div>
            <div style={{ ...grid(3), marginTop: 8 }} role="radiogroup" aria-label="Gift is for">
              {GENDER_OPTIONS.map((g) => (
                <ChipChoice
                  key={g.v}
                  option={{ v: g.v, l: g.l }}
                  selected={(draft.gender ?? "any") === g.v}
                  atMax={false}
                  onClick={() => setDraft((d) => ({ ...d, gender: g.v }))}
                />
              ))}
            </div>
          </Section>

          {activeIds.includes("age") && (
            <Section title="Their age">
              <div style={grid(3)}>
                {getActiveOptions(q("age"), draft).map((o) => (
                  <ChipChoice key={o.v} option={o} selected={draft.age === o.v} atMax={false} onClick={() => set({ age: o.v })} />
                ))}
              </div>
            </Section>
          )}

          <Section title="Occasion">
            <div style={grid(3)}>
              {getActiveOptions(q("occasion"), draft).map((o) => (
                <ChipChoice key={o.v} option={o} selected={draft.occasion === o.v} atMax={false} onClick={() => set({ occasion: o.v })} />
              ))}
            </div>
            {draft.occasion === "other" && (
              <input
                type="text"
                value={draft.occasionOther ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, occasionOther: e.target.value }))}
                placeholder="Type occasion"
                maxLength={60}
                style={{
                  marginTop: 10,
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "11px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: "rgba(35,20,16,0.05)",
                  boxShadow: "inset 0 0 0 1.5px rgba(35,20,16,0.1)",
                  fontFamily: "Geist, sans-serif",
                  fontSize: 14,
                  color: "#231410",
                  outline: "none",
                }}
              />
            )}
          </Section>

          {interestsQ.type === "multi" && (
            <Section title="Interests" hint={`up to ${interestsQ.max}`}>
              <div style={grid(3)}>
                {interestsQ.options.map((o) => {
                  const sel = (draft.interests ?? []).includes(o.v);
                  return (
                    <ChipChoice
                      key={o.v}
                      option={o}
                      selected={sel}
                      atMax={!sel && (draft.interests ?? []).length >= interestsQ.max}
                      onClick={() => toggle("interests", o.v, interestsQ.max)}
                    />
                  );
                })}
              </div>
            </Section>
          )}

          {vibeQ.type === "multi" && (
            <Section title="Vibe" hint={`up to ${vibeQ.max}`}>
              <div style={grid(4)}>
                {vibeQ.options.map((o) => {
                  const sel = (draft.vibe ?? []).includes(o.v);
                  return (
                    <ChipChoice
                      key={o.v}
                      option={o}
                      selected={sel}
                      atMax={!sel && (draft.vibe ?? []).length >= vibeQ.max}
                      onClick={() => toggle("vibe", o.v, vibeQ.max)}
                    />
                  );
                })}
              </div>
            </Section>
          )}

          {budgetQ.type === "slider" && (
            <Section title="Budget">
              <BudgetSlider
                value={typeof draft.budget === "number" ? draft.budget : budgetQ.defaultValue}
                onChange={(v) => setDraft((d) => ({ ...d, budget: v }))}
                min={budgetQ.min}
                max={budgetQ.max}
                step={budgetQ.step}
              />
            </Section>
          )}

        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 14,
            padding: isMobile ? "12px 20px 20px" : "14px 28px 22px",
            borderTop: "1px solid rgba(35,20,16,0.06)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "Geist, sans-serif",
              fontSize: 14,
              color: "rgba(35,20,16,0.6)",
            }}
          >
            Cancel
          </button>
          <Pillow tone="coral" size="md" onClick={() => canApply && onApply(reconcile(draft))} disabled={!canApply}>
            Update picks
          </Pillow>
        </div>
      </div>
    </div>
  );
}
