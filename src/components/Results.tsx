import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { GiftCard } from "./clay/GiftCard";
import { Hero } from "./clay/Hero";
import { Pillow } from "./clay/Pillow";
import { PresentlyMark } from "./clay/PresentlyMark";
import { ProductModal } from "./clay/ProductModal";
import { Wordmark } from "./clay/Wordmark";
import { useIsMobile } from "../hooks/useIsMobile";
import { clearAnswers, loadAnswers, QUESTIONS } from "../data/questions";
import { buildMatchReasons, rankGifts, SECONDARY_TONES, type RankedGift } from "../data/gifts";
import { useGifts } from "../data/giftsApi";
import { postFeedback, postRequest, type FeedbackOption, type FeedbackRecord } from "../data/feedback";
import { buildShareUrl, hydrateAnswersFromShareUrl, shareOrCopy } from "../data/share";

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

  // Answers come from sessionStorage by default; fall back to share-URL
  // params so a recipient can land on /results?r=partner&... and see the
  // same picks without taking the quiz themselves.
  const answers = useMemo(() => {
    const stored = loadAnswers();
    if (Object.keys(stored).length) return stored;
    const hydrated = hydrateAnswersFromShareUrl();
    return hydrated ?? stored;
  }, []);
  const ranked = useMemo<RankedGift[]>(() => rankGifts(allGifts, answers), [allGifts, answers]);

  const [feedbackById, setFeedbackById] = useState<Record<string, FeedbackRecord>>({});
  // Live re-rank: flagged gifts sort to the bottom (stable within each group).
  const picks = useMemo<RankedGift[]>(() => {
    return ranked
      .map((g, i) => ({ g, i, flagged: !!feedbackById[g.id] }))
      .sort((a, b) => (a.flagged === b.flagged ? a.i - b.i : a.flagged ? 1 : -1))
      .map((x) => x.g);
  }, [ranked, feedbackById]);

  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const openModal = (i: number) => setModalIndex(i);
  const closeModal = () => setModalIndex(null);
  const navigateModal = (i: number) => setModalIndex(i);

  const modalReasons = useMemo(() => {
    if (modalIndex === null || !picks[modalIndex]) return [];
    return buildMatchReasons(picks[modalIndex], answers);
  }, [modalIndex, picks, answers]);

  const handleReport = (gift: RankedGift) => (opt: FeedbackOption, detail?: string) => {
    const record: FeedbackRecord = { option: opt, detail, at: new Date().toISOString() };
    setFeedbackById((prev) => ({ ...prev, [gift.id]: record }));
    postFeedback({
      giftId: gift.id,
      giftName: gift.name,
      brand: gift.brand,
      reason: opt.v,
      reasonLabel: opt.l,
      detail,
      answers,
      at: record.at,
    });
  };

  const handleUndoReport = (gift: RankedGift) => () => {
    setFeedbackById((prev) => {
      const next = { ...prev };
      delete next[gift.id];
      return next;
    });
  };

  const flaggedCount = Object.keys(feedbackById).length;

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "failed">("idle");
  const handleShare = async () => {
    const url = buildShareUrl(answers);
    const result = await shareOrCopy(url);
    setShareStatus(result);
    setTimeout(() => setShareStatus("idle"), 2200);
  };

  const [requestSent, setRequestSent] = useState(false);
  const handleRequestMore = async () => {
    if (requestSent) return;
    setRequestSent(true);
    await postRequest(answers);
  };

  // If user lands here with no answers at all, bounce to /quiz.
  useEffect(() => {
    if (!Object.keys(answers).length) navigate("/quiz", { replace: true });
  }, [answers, navigate]);

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      const adding = !next.has(id);
      if (adding) next.add(id);
      else next.delete(id);
      saveSaved(next);
      // Log every heart-on event to the Feedback sheet as reason: heart.
      // Useful as a positive signal alongside the negative "Something off" reports.
      if (adding) {
        const gift = picks.find((p) => p.id === id);
        if (gift) {
          postFeedback({
            giftId: gift.id,
            giftName: gift.name,
            brand: gift.brand,
            reason: "heart",
            reasonLabel: "Saved (heart)",
            answers,
            at: new Date().toISOString(),
          });
        }
      }
      return next;
    });
  };

  const restart = () => {
    clearAnswers();
    navigate("/");
  };

  // Headline labels
  const labelFor = (qid: string, val: string | undefined): string | null => {
    if (!val) return null;
    const q = QUESTIONS.find((x) => x.id === qid);
    if (!q || q.type === "slider") return val;
    return q.options.find((o) => o.v === val)?.l ?? val;
  };
  const recipientLabel = labelFor("recipient", answers.recipient)?.toLowerCase() ?? "them";
  const occasionLabel = labelFor("occasion", answers.occasion);
  const budget = answers.budget;

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
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {flaggedCount > 0 && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "rgba(196,71,126,0.12)",
                    border: "1px solid rgba(196,71,126,0.25)",
                    fontFamily: "Geist, sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#C4477E",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#C4477E",
                      boxShadow: "0 0 0 3px rgba(196,71,126,0.25)",
                    }}
                  />
                  {flaggedCount} reported · refining…
                </div>
              )}
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
                  : `${picks.length} picks tailored for them`}
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
              For your <em style={{ color: "#C4477E", fontStyle: "italic" }}>{recipientLabel}</em>, with love.
            </h1>
            {(occasionLabel || typeof budget === "number") && (
              <p
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 15,
                  color: "rgba(35,20,16,0.55)",
                  marginTop: 14,
                }}
              >
                {[occasionLabel, typeof budget === "number" ? `$${budget} budget` : null, "hand-curated, not auto-generated"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          {/* States: loading, error, empty, results */}
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
          {!loading && !error && picks.length === 0 && (
            <EmptyState onRestart={restart} onRequestMore={handleRequestMore} requestSent={requestSent} />
          )}

          {!loading && !error && hero && (
            <>
              <div style={{ marginBottom: isMobile ? 28 : 36 }}>
                <Hero
                  gift={hero}
                  saved={saved.has(hero.id)}
                  onToggleSave={toggleSave}
                  isMobile={isMobile}
                  onOpenModal={() => openModal(0)}
                  feedback={feedbackById[hero.id]}
                  onReport={handleReport(hero)}
                  onUndoReport={handleUndoReport(hero)}
                />
              </div>

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
                        onOpenDetails={() => openModal(i + 1)}
                        feedback={feedbackById[g.id]}
                        onReport={handleReport(g)}
                        onUndoReport={handleUndoReport(g)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* "Request more" ghost link — small, always visible below grid */}
              <div style={{ textAlign: "center", marginTop: isMobile ? 24 : 32 }}>
                <button
                  type="button"
                  onClick={handleRequestMore}
                  disabled={requestSent}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    fontFamily: "Geist, sans-serif",
                    fontSize: 13,
                    color: requestSent ? "rgba(35,20,16,0.45)" : "#C4477E",
                    cursor: requestSent ? "default" : "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    textDecorationColor: requestSent ? "rgba(35,20,16,0.25)" : "rgba(196,71,126,0.35)",
                  }}
                >
                  {requestSent
                    ? "✓ Thanks — we'll add more like these"
                    : "Not quite right? Request more suggestions in this category →"}
                </button>
              </div>

              <div
                style={{
                  marginTop: isMobile ? 24 : 32,
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Pillow tone="ink" size="lg" onClick={handleShare}>
                  {shareStatus === "copied"
                    ? "Copied ✓"
                    : shareStatus === "shared"
                      ? "Shared ✓"
                      : shareStatus === "failed"
                        ? "Couldn't copy"
                        : "📤 Share these picks"}
                </Pillow>
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

      {/* Product detail modal — carousel across all picks */}
      <ProductModal
        gifts={picks}
        currentIndex={modalIndex}
        onNavigate={navigateModal}
        onClose={closeModal}
        isMobile={isMobile}
        matchReasons={modalReasons}
        feedback={modalIndex !== null && picks[modalIndex] ? feedbackById[picks[modalIndex].id] : undefined}
        onReport={modalIndex !== null && picks[modalIndex] ? handleReport(picks[modalIndex]) : undefined}
        onUndoReport={
          modalIndex !== null && picks[modalIndex] ? handleUndoReport(picks[modalIndex]) : undefined
        }
        saved={modalIndex !== null && picks[modalIndex] ? saved.has(picks[modalIndex].id) : false}
        onToggleSave={toggleSave}
      />
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

function EmptyState({
  onRestart,
  onRequestMore,
  requestSent,
}: {
  onRestart: () => void;
  onRequestMore: () => void;
  requestSent: boolean;
}) {
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
        Our catalog doesn't have great picks for this combination yet. Help us grow — tell us what's missing.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Pillow tone="coral" size="md" onClick={onRequestMore} disabled={requestSent}>
          {requestSent ? "✓ Thanks — we'll add more" : "Request more in this category"}
        </Pillow>
        <Pillow tone="cream" size="md" onClick={onRestart}>↻ Try different answers</Pillow>
      </div>
    </div>
  );
}
