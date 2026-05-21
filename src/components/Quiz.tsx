import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { BudgetSlider } from "./clay/BudgetSlider";
import { ChipChoice } from "./clay/ChipChoice";
import { ChoiceTile } from "./clay/ChoiceTile";
import { Pillow } from "./clay/Pillow";
import { ProgressDots } from "./clay/ProgressDots";
import { Wordmark } from "./clay/Wordmark";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  getActiveOptions,
  getActiveQuestions,
  loadAnswers,
  saveAnswers,
  clearAnswers,
  type Answers,
  type Option,
  type Question,
} from "../data/questions";

export function Quiz() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => loadAnswers());
  const [showAllInterests, setShowAllInterests] = useState(false);
  const advanceTimerRef = useRef<number | null>(null);

  const activeQuestions: Question[] = getActiveQuestions(answers);
  // Clamp step if the active list shrinks (e.g., recipient changed to grandparent → age skipped).
  const safeStep = Math.min(step, activeQuestions.length - 1);
  const q: Question = activeQuestions[safeStep];
  const isLast = safeStep === activeQuestions.length - 1;
  const value = answers[q.id];
  const activeOptions = getActiveOptions(q, answers);

  const canAdvance =
    q.type === "slider"
      ? true
      : q.type === "multi"
        ? Array.isArray(value) && value.length > 0
        : value !== undefined;

  // Persist answers whenever they change so a refresh/back doesn't blank progress.
  useEffect(() => {
    saveAnswers(answers);
  }, [answers]);

  // Reset "show more" expansion when the question changes.
  useEffect(() => {
    setShowAllInterests(false);
  }, [step]);

  // Clear any pending auto-advance when the question changes or component unmounts.
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);
  useEffect(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, [step]);

  // Initialize slider default once on landing on a slider question.
  useEffect(() => {
    if (q.type === "slider" && answers[q.id] === undefined) {
      setAnswers((a) => ({ ...a, [q.id]: q.defaultValue }));
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (i: number, withAnswers?: Answers) => {
    const a = withAnswers ?? answers;
    const list = getActiveQuestions(a);
    if (i >= list.length) {
      saveAnswers(a);
      navigate("/results");
    } else {
      setStep(i);
    }
  };
  const next = () => {
    if (canAdvance) goTo(safeStep + 1);
  };
  const back = () => {
    if (safeStep === 0) {
      navigate("/");
    } else {
      setStep(safeStep - 1);
    }
  };

  const pickChoice = (opt: Option) => {
    const newAnswers: Answers = { ...answers, [q.id]: opt.v };
    setAnswers(newAnswers);
    if (q.type === "choice" && q.autoAdvance) {
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = window.setTimeout(() => goTo(safeStep + 1, newAnswers), 320);
    }
  };

  const toggleMulti = (opt: Option) => {
    if (q.type !== "multi") return;
    const max = q.max;
    setAnswers((a) => {
      const current = a[q.id];
      const arr = Array.isArray(current) ? current : [];
      if (arr.includes(opt.v)) return { ...a, [q.id]: arr.filter((x) => x !== opt.v) };
      if (!max || arr.length < max) return { ...a, [q.id]: [...arr, opt.v] };
      return a;
    });
  };

  const setSlider = (v: number) => setAnswers((a) => ({ ...a, [q.id]: v }));

  const multiCount = Array.isArray(value) ? value.length : 0;
  const visibleInterestOptions =
    q.type === "multi" && q.showMoreAfter && !showAllInterests
      ? activeOptions.slice(0, q.showMoreAfter)
      : activeOptions;

  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <AmbientGlow variant="quiz" />

        {/* Full-viewport-width sticky nav */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(251, 241, 225, 0.82)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(35,20,16,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              maxWidth: 1280,
              margin: "0 auto",
              padding: isMobile ? "20px 20px 14px" : "20px 56px 16px",
            }}
          >
            <button
              type="button"
              onClick={back}
              aria-label="Back"
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                border: "none",
                borderRadius: 999,
                width: 40,
                height: 40,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -3px rgba(80,30,30,0.18)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M9 2L4 7L9 12"
                  stroke="#231410"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <Wordmark size={isMobile ? "sm" : "md"} onClick={() => { clearAnswers(); navigate("/"); }} />
            <div style={{ width: 40 }} aria-hidden="true" />
          </div>
        </header>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: isMobile ? "24px 20px 32px" : "32px 56px 48px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            maxWidth: 1280,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Progress */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: isMobile ? 24 : 36 }}>
            <ProgressDots total={activeQuestions.length} step={safeStep} />
          </div>

          {/* Question card */}
          <div
            key={safeStep}
            style={{
              maxWidth: q.type === "multi" ? 640 : 540,
              margin: "0 auto",
              width: "100%",
              animation: "qslide 360ms cubic-bezier(.22,1.4,.4,1)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: isMobile ? 24 : 32 }}>
              <h1
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: isMobile ? 36 : 46,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  color: "#231410",
                  margin: 0,
                  fontWeight: 400,
                  textWrap: "balance" as never,
                }}
              >
                {q.label}
              </h1>
              <p
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 15,
                  color: "rgba(35,20,16,0.55)",
                  marginTop: 10,
                }}
              >
                {q.helper}
                {q.type === "multi" && (
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 12,
                      color: multiCount === q.max ? "#E64B45" : "rgba(35,20,16,0.45)",
                    }}
                  >
                    · {multiCount}/{q.max} selected
                  </span>
                )}
              </p>
            </div>

            {q.type === "choice" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                {activeOptions.map((opt) => (
                  <ChoiceTile
                    key={opt.v}
                    option={opt}
                    selected={value === opt.v}
                    onClick={() => pickChoice(opt)}
                    big
                  />
                ))}
              </div>
            )}

            {q.type === "multi" && q.bigTiles && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                {activeOptions.map((opt) => {
                  const arr = Array.isArray(value) ? value : [];
                  const sel = arr.includes(opt.v);
                  const atMax = arr.length >= q.max && !sel;
                  return (
                    <ChoiceTile
                      key={opt.v}
                      option={opt}
                      selected={sel}
                      onClick={() => toggleMulti(opt)}
                      disabled={atMax}
                      big
                    />
                  );
                })}
              </div>
            )}

            {q.type === "multi" && !q.bigTiles && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                    gap: isMobile ? 8 : 10,
                  }}
                >
                  {visibleInterestOptions.map((opt) => {
                    const arr = Array.isArray(value) ? value : [];
                    const sel = arr.includes(opt.v);
                    const atMax = arr.length >= q.max && !sel;
                    return (
                      <ChipChoice
                        key={opt.v}
                        option={opt}
                        selected={sel}
                        atMax={atMax}
                        onClick={() => toggleMulti(opt)}
                      />
                    );
                  })}
                </div>
                {q.showMoreAfter && activeOptions.length > q.showMoreAfter && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => setShowAllInterests((s) => !s)}
                      style={{
                        background: "rgba(255,255,255,0.65)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(35,20,16,0.1)",
                        padding: "8px 16px",
                        borderRadius: 999,
                        cursor: "pointer",
                        fontFamily: "Geist, sans-serif",
                        fontSize: 13,
                        color: "#5A3F36",
                        fontWeight: 500,
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 8px -2px rgba(80,30,30,0.15)",
                      }}
                    >
                      {showAllInterests ? "↑ Show fewer" : `↓ Show ${activeOptions.length - q.showMoreAfter} more`}
                    </button>
                  </div>
                )}
              </>
            )}

            {q.type === "slider" && (
              <BudgetSlider
                value={typeof value === "number" ? value : q.defaultValue}
                onChange={setSlider}
                min={q.min}
                max={q.max}
                step={q.step}
              />
            )}
          </div>

          {/* Next button area */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: isMobile ? 28 : 36,
              display: "flex",
              justifyContent: "center",
              minHeight: 64,
            }}
          >
            {q.type !== "choice" && (
              <Pillow
                tone={canAdvance ? "coral" : "cream"}
                size="lg"
                onClick={next}
                disabled={!canAdvance}
                style={{
                  minWidth: isMobile ? 240 : 280,
                  opacity: canAdvance ? 1 : 0.5,
                  cursor: canAdvance ? "pointer" : "not-allowed",
                }}
              >
                {isLast ? "Reveal my picks ✨" : "Next →"}
              </Pillow>
            )}
            {q.type === "choice" && (
              <div
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 12,
                  color: "rgba(35,20,16,0.4)",
                  letterSpacing: "0.04em",
                }}
              >
                {value !== undefined ? "advancing…" : "tap an option to continue"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
