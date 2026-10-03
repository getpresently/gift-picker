import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { BudgetSlider } from "./clay/BudgetSlider";
import { ChipChoice } from "./clay/ChipChoice";
import { ChoiceTile } from "./clay/ChoiceTile";
import { OccasionOtherTile } from "./clay/OccasionOtherTile";
import { Pillow } from "./clay/Pillow";
import { ProgressDots } from "./clay/ProgressDots";
import { useIsMobile } from "../hooks/useIsMobile";
import { postRequest } from "../data/feedback";
import { track } from "../data/analytics";
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
import { SiteHeader } from "./clay/SiteHeader";

const OCCASION_OTHER_MIN_LENGTH = 2;

export function Quiz() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => loadAnswers());
  const [showAllInterests, setShowAllInterests] = useState(false);
  const advanceTimerRef = useRef<number | null>(null);
  // True only between a tap on an auto-advance option and the move to the
  // next question, so "advancing…" never shows for a remembered answer.
  const [advancing, setAdvancing] = useState(false);
  // Whether the page is taller than the screen, i.e. answers can scroll
  // under the pinned Next button and need the fade behind it.
  const [pageScrolls, setPageScrolls] = useState(false);
  useEffect(() => {
    const check = () => setPageScrolls(document.documentElement.scrollHeight > window.innerHeight + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(document.body);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, []);

  const activeQuestions: Question[] = getActiveQuestions(answers);
  // Clamp step if the active list shrinks (e.g., recipient changed to grandparent → age skipped).
  const safeStep = Math.min(step, activeQuestions.length - 1);
  const q: Question = activeQuestions[safeStep];
  const isLast = safeStep === activeQuestions.length - 1;
  const value = answers[q.id];
  const activeOptions = getActiveOptions(q, answers);

  // "Other" on the occasion question needs a non-empty typed value before
  // we let the user advance, otherwise they could ship a blank custom
  // occasion to the Requests sheet.
  const isOccasionOtherSelected = q.id === "occasion" && value === "other";
  const occasionOtherTyped = (answers.occasionOther ?? "").trim();
  const canAdvance =
    q.type === "slider"
      ? true
      : q.type === "multi"
        ? Array.isArray(value) && value.length > 0
        : isOccasionOtherSelected
          ? occasionOtherTyped.length >= OCCASION_OTHER_MIN_LENGTH
          : value !== undefined;

  // Persist answers whenever they change so a refresh/back doesn't blank progress.
  useEffect(() => {
    saveAnswers(answers);
  }, [answers]);

  // Reset "show more" expansion when the question changes.
  useEffect(() => {
    setShowAllInterests(false);
  }, [step]);

  // Scroll back to the top of the screen whenever the step changes so
  // long answer lists don't leave the next question scrolled off-screen.
  // Also fire a quiz_step_view analytics event so we can see funnel
  // drop-off by question id in GA.
  useEffect(() => {
    window.scrollTo(0, 0);
    const activeQ = activeQuestions[Math.min(step, activeQuestions.length - 1)];
    if (activeQ) {
      track("quiz_step_view", { step_index: step, question_id: activeQ.id });
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setAdvancing(false);
  }, [step]);

  // Initialize slider default once on landing on a slider question.
  useEffect(() => {
    if (q.type === "slider" && answers[q.id] === undefined) {
      setAnswers((a) => ({ ...a, [q.id]: q.defaultValue, budgetMin: a.budgetMin ?? q.defaultMin }));
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (i: number, withAnswers?: Answers) => {
    const a = withAnswers ?? answers;
    const list = getActiveQuestions(a);
    if (i >= list.length) {
      saveAnswers(a);
      // If the user typed a free-text occasion, log it to the Requests
      // sheet so Dalia can see what new categories users are asking for,
      // in their own words. The occasion column gets a "NEW: <typed text>"
      // marker; the rest of the answers ride along for context. (Typed names
      // for occasions we already offer still score as those occasions; see
      // scoringAnswers.)
      if (a.occasion === "other" && a.occasionOther?.trim()) {
        postRequest({ ...a, occasion: `NEW: ${a.occasionOther.trim()}` });
        track("occasion_other_typed", { value: a.occasionOther.trim() });
      }
      // Quiz funnel completion event. Includes the high-level answer
      // dimensions so we can segment completion rate by recipient /
      // age bracket / occasion / budget without joining sheets.
      track("quiz_complete", {
        recipient: a.recipient,
        age: a.age,
        occasion: a.occasion === "other" ? "other" : a.occasion,
        interests_count: a.interests?.length ?? 0,
        vibe_count: a.vibe?.length ?? 0,
        budget: a.budget,
      });
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
    // On the occasion question: picking "Other" reveals a text input and
    // disables auto-advance. Picking anything else clears any previously
    // typed free-text so a quick re-pick doesn't carry stale state.
    const pickingOccasionOther = q.id === "occasion" && opt.v === "other";
    const clearOccasionOther = q.id === "occasion" && opt.v !== "other";

    const newAnswers: Answers = {
      ...answers,
      [q.id]: opt.v,
      ...(clearOccasionOther ? { occasionOther: undefined } : {}),
    };
    setAnswers(newAnswers);
    if (q.type === "choice" && q.autoAdvance && !pickingOccasionOther) {
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
      setAdvancing(true);
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

        <SiteHeader onLogoClick={() => { clearAnswers(); navigate("/"); }} />

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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 40px",
              alignItems: "center",
              marginBottom: isMobile ? 24 : 36,
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
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ProgressDots total={activeQuestions.length} step={safeStep} />
            </div>
            <div aria-hidden="true" />
          </div>

          {/* Question card */}
          <div
            key={safeStep}
            style={{
              // Three-across occasions get the same width as the interests grid.
              maxWidth: q.type === "multi" || q.id === "occasion" ? 640 : 540,
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
              {(q.helper || q.type === "multi") && (
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
              )}
            </div>

            {q.type === "choice" && (
              <>
                <div
                  style={{
                    display: "grid",
                    // Occasions and recipients are short words, so they fit
                    // two across on phones instead of one long column (and
                    // occasions three across on desktop).
                    gridTemplateColumns:
                      q.id === "occasion"
                        ? `repeat(${isMobile ? 2 : 3}, minmax(0, 1fr))`
                        : isMobile && q.id !== "recipient"
                          ? "1fr"
                          : "repeat(2, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  {activeOptions.map((opt) => {
                    // The "Other" tile on the occasion question morphs into
                    // an inline text input when selected, see
                    // OccasionOtherTile for the input-in-tile behavior.
                    if (q.id === "occasion" && opt.v === "other") {
                      return (
                        <div key={opt.v} style={{ display: "grid", gridColumn: value === opt.v ? "1 / -1" : undefined }}>
                        <OccasionOtherTile
                          option={opt}
                          selected={value === opt.v}
                          value={answers.occasionOther ?? ""}
                          onSelect={() => pickChoice(opt)}
                          onChange={(v) =>
                            setAnswers((a) => ({ ...a, occasionOther: v }))
                          }
                          onSubmit={() => {
                            if (canAdvance) next();
                          }}
                          big
                        />
                        </div>
                      );
                    }
                    return (
                      <ChoiceTile
                        key={opt.v}
                        option={opt}
                        selected={value === opt.v}
                        onClick={() => pickChoice(opt)}
                        big
                      />
                    );
                  })}
                </div>
              </>
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
                minValue={answers.budgetMin ?? q.min}
                onMinChange={(v) => setAnswers((a) => ({ ...a, budgetMin: v > q.min ? v : undefined }))}
                min={q.min}
                max={q.max}
                step={q.step}
              />
            )}
          </div>

          {/* Next button area */}
          <div
            // Pinned to the bottom of the screen so Next is always in reach;
            // when answers scroll underneath, a soft fade keeps them from
            // crowding the button.
            style={{
              marginTop: "auto",
              position: "sticky",
              bottom: 0,
              zIndex: 2,
              paddingTop: isMobile ? 28 : 36,
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              display: "flex",
              justifyContent: "center",
              minHeight: 64,
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "0 -48px",
                zIndex: -1,
                pointerEvents: "none",
                background: "linear-gradient(to bottom, rgba(251,241,225,0) 0%, rgba(251,241,225,0.94) 45%)",
                WebkitMaskImage: "linear-gradient(to right, transparent, #000 18%, #000 82%, transparent)",
                maskImage: "linear-gradient(to right, transparent, #000 18%, #000 82%, transparent)",
                opacity: pageScrolls ? 1 : 0,
                transition: "opacity 200ms ease",
              }}
            />
            {/* Choice questions auto-advance and only show a status hint.
                Exceptions get a Next button: "Other" on the occasion
                question (after typing), and a choice already answered on an
                earlier visit, so the visitor can keep it without re-tapping. */}
            {(q.type !== "choice" || isOccasionOtherSelected || (value !== undefined && !advancing)) && (
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
            {q.type === "choice" && !isOccasionOtherSelected && (value === undefined || advancing) && (
              <div
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 12,
                  color: "rgba(35,20,16,0.4)",
                  letterSpacing: "0.04em",
                }}
              >
                {advancing ? "advancing…" : "tap an option to continue"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
