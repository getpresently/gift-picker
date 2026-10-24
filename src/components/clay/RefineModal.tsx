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
  reconcileAnswers,
  type Answers,
  type ChoiceQuestion,
  type Gender,
  type Option,
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

const LABEL = {
  fontFamily: "Geist, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "rgba(35,20,16,0.6)",
};

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <h3 style={{ margin: 0, ...LABEL }}>{title}</h3>
        {hint && <span style={{ fontFamily: "Geist, sans-serif", fontSize: 12, color: "rgba(35,20,16,0.45)" }}>{hint}</span>}
      </div>
      {children}
    </section>
  );
}

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%23231410' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";

/** A labeled native dropdown: phones get their own picker, and the sheet stays short. */
function Select({ label, value, options, onChange }: { label: string; value: string | undefined; options: Option[]; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <span style={LABEL}>{label}</span>
      <select
        className="refine-select"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          width: "100%",
          minWidth: 0,
          padding: "11px 32px 11px 12px",
          borderRadius: 14,
          border: "none",
          backgroundColor: "#FBF3E6",
          backgroundImage: `${SELECT_CHEVRON}, linear-gradient(160deg, #FFFCF5 0%, #F5E7D2 100%)`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center, 0 0",
          backgroundSize: "12px 12px, 100% 100%",
          boxShadow: "inset 0 1.2px 0 rgba(255,255,255,0.7), 0 6px 14px -6px rgba(80,30,30,0.15), 0 2px 0 rgba(90,40,30,0.08)",
          fontFamily: "Geist, sans-serif",
          fontSize: 14,
          fontWeight: 500,
          color: value ? "#231410" : "rgba(35,20,16,0.5)",
          cursor: "pointer",
          textOverflow: "ellipsis",
        }}
      >
        {!value && (
          <option value="" disabled>
            Choose one
          </option>
        )}
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {[o.e, o.l].filter(Boolean).join(" ")}
          </option>
        ))}
      </select>
    </label>
  );
}

/** "Amazon only": for shoppers in a hurry who want Prime shipping. */
function AmazonOnly({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        borderRadius: 16,
        border: "none",
        background: "rgba(35,20,16,0.04)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "Geist, sans-serif",
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#231410" }}>Amazon only</span>
        <span style={{ display: "block", fontSize: 12.5, lineHeight: 1.4, color: "rgba(35,20,16,0.55)", marginTop: 2 }}>
          Only show gifts you can order on Amazon, handy when you need one fast.
        </span>
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 42,
          height: 24,
          flexShrink: 0,
          borderRadius: 999,
          background: on ? "#E64B45" : "rgba(35,20,16,0.16)",
          position: "relative",
          transition: "background 160ms ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#FFFCF7",
            boxShadow: "0 1px 3px rgba(80,30,30,0.3)",
            transition: "left 160ms ease",
          }}
        />
      </span>
    </button>
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

  const set = (patch: Partial<Answers>) => setDraft((d) => reconcileAnswers({ ...d, ...patch }));
  const toggle = (id: "interests" | "vibe", v: string, max: number) =>
    setDraft((d) => {
      const cur = d[id] ?? [];
      if (cur.includes(v)) return { ...d, [id]: cur.filter((x) => x !== v) };
      if (cur.length >= max) return d;
      return { ...d, [id]: [...cur, v] };
    });

  const activeIds = getActiveQuestions(draft).map((x) => x.id);
  const wrap = { display: "flex", flexWrap: "wrap" as const, gap: 8 };
  const recipientQ = q("recipient") as ChoiceQuestion;
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
          maxWidth: 760,
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
          {/* One-answer questions are dropdowns, side by side, so the sheet
              fits on one screen (Dalia, 10/24: the tile grids felt long). */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : `repeat(${activeIds.includes("age") ? 4 : 3}, 1fr)`,
              gap: isMobile ? "12px 10px" : 12,
              marginBottom: draft.occasion === "other" ? 10 : 20,
            }}
          >
            <Select label="Who's it for" value={draft.recipient} options={recipientQ.options} onChange={(v) => set({ recipient: v })} />
            {activeIds.includes("age") && (
              <Select
                label={draft.recipient === "self" ? "Your age" : "Their age"}
                value={draft.age}
                options={getActiveOptions(q("age"), draft)}
                onChange={(v) => set({ age: v })}
              />
            )}
            <Select label="Occasion" value={draft.occasion} options={getActiveOptions(q("occasion"), draft)} onChange={(v) => set({ occasion: v })} />
            <Select
              label="Gift for"
              value={draft.gender ?? "any"}
              options={GENDER_OPTIONS.map((g) => ({ v: g.v, l: g.v === "any" ? "Anyone" : g.v === "him" ? "Him" : "Her" }))}
              onChange={(v) => setDraft((d) => ({ ...d, gender: v as Gender }))}
            />
          </div>
          {draft.occasion === "other" && (
            <input
              type="text"
              value={draft.occasionOther ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, occasionOther: e.target.value }))}
              placeholder="Type occasion"
              aria-label="Occasion"
              maxLength={60}
              style={{
                marginBottom: 20,
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

          {interestsQ.type === "multi" && (
            <Section title="Interests" hint={`up to ${interestsQ.max}`}>
              <div style={wrap}>
                {getActiveOptions(interestsQ, draft).map((o) => {
                  const sel = (draft.interests ?? []).includes(o.v);
                  return (
                    <ChipChoice
                      key={o.v}
                      option={o}
                      compact
                      selected={sel}
                      atMax={!sel && (draft.interests ?? []).length >= interestsQ.max}
                      onClick={() => toggle("interests", o.v, interestsQ.max)}
                    />
                  );
                })}
              </div>
            </Section>
          )}

          {vibeQ.type === "multi" && activeIds.includes("vibe") && (
            <Section title="Vibe" hint={`up to ${vibeQ.max}`}>
              <div style={wrap}>
                {vibeQ.options.map((o) => {
                  const sel = (draft.vibe ?? []).includes(o.v);
                  return (
                    <ChipChoice
                      key={o.v}
                      option={o}
                      compact
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
                minValue={draft.budgetMin ?? budgetQ.min}
                onMinChange={(v) => setDraft((d) => ({ ...d, budgetMin: v > budgetQ.min ? v : undefined }))}
                min={budgetQ.min}
                max={budgetQ.max}
                step={budgetQ.step}
                compact
              />
            </Section>
          )}

          <AmazonOnly on={!!draft.amazonOnly} onChange={(on) => setDraft((d) => ({ ...d, amazonOnly: on || undefined }))} />
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
          <Pillow tone="coral" size="md" onClick={() => canApply && onApply(reconcileAnswers(draft))} disabled={!canApply}>
            Update picks
          </Pillow>
        </div>
      </div>
    </div>
  );
}
