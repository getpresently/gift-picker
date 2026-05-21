import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { ClaySurface } from "./clay/ClaySurface";
import { GiftBox3D } from "./clay/GiftBox3D";
import { GiftCard } from "./clay/GiftCard";
import { Pillow } from "./clay/Pillow";
import { PresentlyMark } from "./clay/PresentlyMark";
import { Wordmark } from "./clay/Wordmark";
import { useIsMobile } from "../hooks/useIsMobile";
import { clearAnswers, loadAnswers, QUESTIONS, type Answers } from "../data/questions";
import { INTEREST_LABELS, rankGifts, SECONDARY_TONES, VIBE_LABELS, type Gift } from "../data/gifts";
import { useGifts } from "../data/giftsApi";

const openExternal = (url: string) => {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
};

/** Generates real "why this works" bullets from the hero gift + the user's answers. */
function buildWhyBullets(hero: Gift, answers: Answers): string[] {
  const lc = (s: string) => s.toLowerCase();
  const bullets: string[] = [];

  if (typeof answers.budget === "number") {
    bullets.push(`Lands inside your $${answers.budget} budget`);
  }
  if (hero.brand) {
    bullets.push(`From ${hero.brand}`);
  }

  const matchedVibes = (answers.vibe ?? [])
    .flatMap((v) => VIBE_LABELS[v] ?? [])
    .filter((label) => hero.types.some((t) => lc(t).includes(lc(label)) || lc(label).includes(lc(t))));
  if (matchedVibes.length) {
    bullets.push(`A ${matchedVibes.join(", ").toLowerCase()} fit`);
  }

  const matchedInterests = (answers.interests ?? [])
    .flatMap((v) => INTEREST_LABELS[v] ?? [])
    .filter((label) => hero.interests.some((i) => lc(i).includes(lc(label)) || lc(label).includes(lc(i))));
  if (matchedInterests.length) {
    bullets.push(matchedInterests.slice(0, 2).join(" · "));
  }

  return bullets.slice(0, 4);
}

const SAVED_KEY = "giftpicker_saved_v1";

function loadSaved(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SAVED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSaved(s: Set<string>) {
  try {
    sessionStorage.setItem(SAVED_KEY, JSON.stringify([...s]));
  } catch {
    // no-op
  }
}

export function Results() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: allGifts, loading, error } = useGifts();
  const [saved, setSaved] = useState<Set<string>>(() => loadSaved());

  const answers = useMemo(() => loadAnswers(), []);
  const picks = useMemo<Gift[]>(() => rankGifts(allGifts, answers), [allGifts, answers]);

  // If user lands here with no answers at all, bounce to /quiz.
  useEffect(() => {
    if (!Object.keys(answers).length) navigate("/quiz", { replace: true });
  }, [answers, navigate]);

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveSaved(next);
      return next;
    });
  };

  const restart = () => {
    clearAnswers();
    navigate("/");
  };

  // Derive headline labels
  const labelFor = (qid: string, val: string | undefined): string | null => {
    if (!val) return null;
    const q = QUESTIONS.find((x) => x.id === qid);
    if (!q || q.type === "slider") return val;
    return q.options.find((o) => o.v === val)?.l ?? val;
  };
  const recipientLabel = labelFor("recipient", answers.recipient)?.toLowerCase() ?? "them";
  const occasionLabel = labelFor("occasion", answers.occasion);
  const budget = answers.budget ?? 100;

  const [hero, ...rest] = picks;

  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <AmbientGlow variant="results" />

        {/* Sticky full-width nav */}
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
            <Wordmark size={isMobile ? "sm" : "md"} onClick={restart} />
            <button
              type="button"
              onClick={restart}
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                border: "none",
                borderRadius: 999,
                padding: "8px 16px",
                fontFamily: "Geist, sans-serif",
                fontSize: 13,
                color: "#5A3F36",
                cursor: "pointer",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -3px rgba(80,30,30,0.18)",
              }}
            >
              ↻ Start over
            </button>
          </div>
        </header>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: isMobile ? "32px 20px 40px" : "40px 56px 64px",
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          {/* Reveal headline */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 48 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px -4px rgba(80,30,30,0.15)",
                fontFamily: "Geist, sans-serif",
                fontSize: 12,
                color: "#5A3F36",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: loading ? "#FFD074" : error ? "#E64B45" : "#4CAF50",
                  boxShadow: loading
                    ? "0 0 0 4px rgba(255,208,116,0.3)"
                    : error
                      ? "0 0 0 4px rgba(230,75,69,0.25)"
                      : "0 0 0 4px rgba(76,175,80,0.25)",
                }}
              />
              {loading
                ? "Finding your picks…"
                : error
                  ? "Couldn't reach the gift database"
                  : `Found ${picks.length} ${picks.length === 1 ? "gift" : "gifts"}`}
            </div>
            <h1
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: isMobile ? 40 : 64,
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                color: "#231410",
                margin: 0,
                fontWeight: 400,
                textWrap: "balance" as never,
              }}
            >
              For your <em style={{ color: "#C4477E", fontStyle: "italic" }}>{recipientLabel}</em>,
              <br />
              with love and ${budget}.
            </h1>
            {occasionLabel && (
              <p
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 15,
                  color: "rgba(35,20,16,0.55)",
                  marginTop: 14,
                }}
              >
                {occasionLabel} · hand-curated, not auto-generated
              </p>
            )}
          </div>

          {/* States: loading, error, empty, results */}
          {loading && <LoadingState />}

          {!loading && error && <ErrorState message={error} onRetry={() => window.location.reload()} />}

          {!loading && !error && picks.length === 0 && <EmptyState onRestart={restart} />}

          {!loading && !error && hero && (
            <>
              {isMobile ? (
                <div style={{ marginBottom: 24 }}>
                  <GiftCard
                    gift={hero}
                    tone="plum"
                    hero
                    badge="Top pick"
                    saved={saved.has(hero.id)}
                    onToggleSave={toggleSave}
                    isMobile={isMobile}
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 1fr",
                    gap: 24,
                    alignItems: "stretch",
                    marginBottom: 36,
                  }}
                >
                  {/* LEFT: plum hero with floating decoration */}
                  <ClaySurface
                    tint="plum"
                    style={{
                      padding: 32,
                      color: "#FFF8EE",
                      position: "relative",
                      overflow: "hidden",
                      minHeight: 360,
                    }}
                  >
                    <div style={{ position: "relative", zIndex: 1, maxWidth: 380 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontFamily: "Geist, sans-serif",
                          fontSize: 11,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#FFD074",
                          marginBottom: 16,
                        }}
                      >
                        <span>✦</span> Your top pick
                      </div>
                      <h2
                        style={{
                          fontFamily: '"Instrument Serif", serif',
                          fontSize: 44,
                          lineHeight: 1.08,
                          letterSpacing: "-0.02em",
                          margin: 0,
                          fontWeight: 400,
                        }}
                      >
                        {hero.name}
                      </h2>
                      {hero.description && (
                        <p
                          style={{
                            fontFamily: "Geist, sans-serif",
                            fontSize: 16,
                            lineHeight: 1.55,
                            color: "rgba(255,248,238,0.78)",
                            marginTop: 16,
                          }}
                        >
                          {hero.description}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 24 }}>
                        <div
                          style={{
                            fontFamily: '"Instrument Serif", serif',
                            fontSize: 56,
                            letterSpacing: "-0.03em",
                            lineHeight: 1,
                          }}
                        >
                          {hero.priceLabel || "—"}
                        </div>
                        {hero.brand && (
                          <div
                            style={{
                              fontFamily: "Geist, sans-serif",
                              fontSize: 14,
                              color: "rgba(255,248,238,0.6)",
                            }}
                          >
                            from {hero.brand}
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: 24 }}>
                        <Pillow tone="coral" size="md" onClick={() => openExternal(hero.link)}>
                          View gift →
                        </Pillow>
                      </div>
                    </div>
                    {/* Floating decorative GiftBox3D */}
                    <div style={{ position: "absolute", right: -30, bottom: -30, opacity: 0.9, pointerEvents: "none" }}>
                      <GiftBox3D size={260} color="butter" rotate={-12} ribbonColor="#FF8166" />
                    </div>
                  </ClaySurface>

                  {/* RIGHT: stacked side panels */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <ClaySurface tint="rose" style={{ padding: 22 }}>
                      <div
                        style={{
                          fontFamily: "Geist, sans-serif",
                          fontSize: 11,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "rgba(35,20,16,0.55)",
                        }}
                      >
                        Why this works
                      </div>
                      <ul
                        style={{
                          fontFamily: "Geist, sans-serif",
                          fontSize: 14,
                          color: "#231410",
                          lineHeight: 1.55,
                          marginTop: 12,
                          paddingLeft: 18,
                        }}
                      >
                        {buildWhyBullets(hero, answers).map((b, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </ClaySurface>
                    <ClaySurface tint="butter" style={{ padding: 22 }}>
                      <div
                        style={{
                          fontFamily: "Geist, sans-serif",
                          fontSize: 11,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "rgba(35,20,16,0.55)",
                        }}
                      >
                        At a glance
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                        <div
                          style={{
                            fontFamily: '"Instrument Serif", serif',
                            fontSize: 48,
                            lineHeight: 1,
                            color: "#231410",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {picks.length}
                        </div>
                        <div style={{ fontFamily: "Geist, sans-serif", fontSize: 13, color: "rgba(35,20,16,0.65)" }}>
                          matches, hand-picked from {allGifts.length} curated gifts.
                        </div>
                      </div>
                    </ClaySurface>
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <>
                  <div style={{ textAlign: "center", margin: isMobile ? "8px 0 20px" : "12px 0 28px" }}>
                    <span
                      style={{
                        fontFamily: "Geist, sans-serif",
                        fontSize: 12,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(35,20,16,0.5)",
                      }}
                    >
                      More they might love
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: isMobile ? 12 : 18,
                    }}
                  >
                    {rest.map((g, i) => (
                      <GiftCard
                        key={g.id || `gift-${i}`}
                        gift={g}
                        tone={SECONDARY_TONES[i % SECONDARY_TONES.length]}
                        saved={saved.has(g.id)}
                        onToggleSave={toggleSave}
                        isMobile={isMobile}
                      />
                    ))}
                  </div>
                </>
              )}

              <div
                style={{
                  marginTop: isMobile ? 36 : 56,
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Pillow tone="cream" size="lg" onClick={restart}>
                  ↻ Try again
                </Pillow>
              </div>
            </>
          )}

          <footer
            style={{
              marginTop: isMobile ? 40 : 56,
              paddingTop: 24,
              borderTop: "1px solid rgba(35,20,16,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <Wordmark size="sm" />
            <PresentlyMark />
          </footer>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "48px 0",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "3px solid rgba(35,20,16,0.12)",
          borderTopColor: "#E64B45",
          animation: "spin 800ms linear infinite",
        }}
      />
      <div
        style={{
          fontFamily: "Geist, sans-serif",
          fontSize: 13,
          color: "rgba(35,20,16,0.55)",
          marginTop: 14,
        }}
      >
        Curating your picks…
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <p
        style={{
          fontFamily: "Geist, sans-serif",
          fontSize: 15,
          color: "rgba(35,20,16,0.7)",
          maxWidth: 460,
          margin: "0 auto 18px",
        }}
      >
        We couldn't reach the gift database just now. Try refreshing in a moment.
      </p>
      <p
        style={{
          fontFamily: "Geist, sans-serif",
          fontSize: 11,
          color: "rgba(35,20,16,0.4)",
          marginBottom: 18,
        }}
      >
        ({message})
      </p>
      <Pillow tone="coral" size="md" onClick={onRetry}>Reload</Pillow>
    </div>
  );
}

function EmptyState({ onRestart }: { onRestart: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <h2
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 32,
          color: "#231410",
          margin: "0 0 12px",
          fontWeight: 400,
        }}
      >
        Nothing matched — yet.
      </h2>
      <p
        style={{
          fontFamily: "Geist, sans-serif",
          fontSize: 15,
          color: "rgba(35,20,16,0.65)",
          maxWidth: 480,
          margin: "0 auto 24px",
          lineHeight: 1.55,
        }}
      >
        Try widening your budget or interests. Our catalog is growing — we'll have better picks for them soon.
      </p>
      <Pillow tone="coral" size="md" onClick={onRestart}>↻ Try again</Pillow>
    </div>
  );
}
