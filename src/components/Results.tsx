import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { GiftCard } from "./clay/GiftCard";
import { Hero } from "./clay/Hero";
import { Pillow } from "./clay/Pillow";
import { ProductModal } from "./clay/ProductModal";
import { Wordmark } from "./clay/Wordmark";
import { useIsMobile } from "../hooks/useIsMobile";
import { clearAnswers, GENDER_OPTIONS, loadAnswers, QUESTIONS, saveAnswers, scoringAnswers, type Answers } from "../data/questions";
import { buildMatchReasons, rankGifts, SECONDARY_TONES, type RankedGift } from "../data/gifts";
import { useGifts } from "../data/giftsApi";
import { isDemoting, NOTIFY_OPT_IN_LIVE, postFeedback, postRequest, type FeedbackOption, type FeedbackRecord } from "../data/feedback";
import { NotifyOptIn } from "./clay/NotifyOptIn";
import { loadSaved, saveSaved } from "../data/saved";
import { buildShareUrl, hydrateAnswersFromShareUrl, shareOrCopy } from "../data/share";
import { track } from "../data/analytics";
import { AffiliateDisclosure } from "./clay/AffiliateDisclosure";
import { isAmazonUrl } from "../data/affiliate";
import { SiteHeader } from "./clay/SiteHeader";
import { FooterLinks } from "./clay/FooterLinks";
import { PresentlyMark } from "./clay/PresentlyMark";
import { RefineModal } from "./clay/RefineModal";

export function Results() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: allGifts, loading, error } = useGifts();
  const [saved, setSaved] = useState<Set<string>>(() => loadSaved());

  // Answers come from sessionStorage by default; fall back to share-URL
  // params so a recipient can land on /results?r=partner&... and see the
  // same picks without taking the quiz themselves.
  const [answers, setAnswers] = useState<Answers>(() => {
    const stored = loadAnswers();
    if (Object.keys(stored).length) return stored;
    const hydrated = hydrateAnswersFromShareUrl();
    return hydrated ?? stored;
  });
  // Scoring sees typed occasions it recognizes (Christmas, a promotion) as
  // the built-in occasion; the header keeps the shopper's own wording.
  const scoring = useMemo(() => scoringAnswers(answers), [answers]);
  const ranked = useMemo<RankedGift[]>(() => rankGifts(allGifts, scoring), [allGifts, scoring]);

  const [feedbackById, setFeedbackById] = useState<Record<string, FeedbackRecord>>({});
  // Live re-rank: gifts reported as disliked or unavailable sort to the bottom (stable within each group).
  const picks = useMemo<RankedGift[]>(() => {
    return ranked
      .map((g, i) => ({ g, i, flagged: isDemoting(feedbackById[g.id]) }))
      .sort((a, b) => (a.flagged === b.flagged ? a.i - b.i : a.flagged ? 1 : -1))
      .map((x) => x.g);
  }, [ranked, feedbackById]);

  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const openModal = (i: number) => setModalIndex(i);
  const closeModal = () => setModalIndex(null);
  const navigateModal = (i: number) => setModalIndex(i);

  const modalReasons = useMemo(() => {
    if (modalIndex === null || !picks[modalIndex]) return [];
    return buildMatchReasons(picks[modalIndex], scoring);
  }, [modalIndex, picks, scoring]);

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
    track("gift_feedback", {
      gift_id: gift.id,
      brand: gift.brand,
      reason: opt.v,
      has_detail: !!detail,
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
    track("gift_share", { method: result });
    setTimeout(() => setShareStatus("idle"), 2200);
  };

  const [refineOpen, setRefineOpen] = useState(false);
  const applyRefine = (next: Answers) => {
    setAnswers(next);
    saveAnswers(next);
    setRequestSent(false);
    setRefineOpen(false);
    track("results_refine", {
      recipient: next.recipient,
      age: next.age,
      occasion: next.occasion,
      interests_count: next.interests?.length ?? 0,
      vibe_count: next.vibe?.length ?? 0,
      budget: next.budget,
      gender: next.gender ?? "any",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [requestSent, setRequestSent] = useState(false);
  const handleRequestMore = async () => {
    if (requestSent) return;
    setRequestSent(true);
    track("request_more");
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
          track("gift_save", {
            gift_id: gift.id,
            brand: gift.brand,
            price: gift.price,
          });
        }
      }
      return next;
    });
  };

  // "Start over" wipes the current answers and drops the user back at
  // the first quiz question (not the landing page) so they can retake
  // immediately without the marketing hero in between.
  const restart = () => {
    clearAnswers();
    navigate("/quiz");
  };
  // Wordmark click goes home (no wipe), leaves the session intact in
  // case they want to come back to these picks via the back button.
  const goHome = () => navigate("/");

  // Headline labels
  const labelFor = (qid: string, val: string | undefined): string | null => {
    if (!val) return null;
    const q = QUESTIONS.find((x) => x.id === qid);
    if (!q || q.type === "slider") return val;
    return q.options.find((o) => o.v === val)?.l ?? val;
  };
  const recipientLabel = labelFor("recipient", answers.recipient)?.toLowerCase() ?? "them";
  // When the user typed a free-text occasion, show their wording in the
  // breadcrumb instead of the literal "Other" label.
  const occasionLabel =
    answers.occasion === "other" && answers.occasionOther?.trim()
      ? answers.occasionOther.trim()
      : labelFor("occasion", answers.occasion);
  const budget = answers.budget;
  const genderLabel =
    answers.gender && answers.gender !== "any" ? GENDER_OPTIONS.find((g) => g.v === answers.gender)?.l ?? null : null;

  // Humanize the selected interest values (the answers store the v codes,
  // e.g. "cooking", but the breadcrumb wants the friendly labels).
  const interestsLabel = useMemo(() => {
    const vals = answers.interests ?? [];
    if (!vals.length) return null;
    const q = QUESTIONS.find((x) => x.id === "interests");
    if (!q || q.type !== "multi") return vals.join(", ");
    return vals
      .map((v) => q.options.find((o) => o.v === v)?.l ?? v)
      .join(", ");
  }, [answers.interests]);

  // Summary line under the headline. The adjust button rides on the last
  // part (inside a nowrap span) so it never wraps onto a line of its own.
  const summaryParts = [
    genderLabel,
    occasionLabel,
    interestsLabel,
    typeof budget === "number" ? `$${budget} budget` : null,
  ].filter((p): p is string => Boolean(p));

  const [hero, ...rest] = picks;

  // Reveal the secondary grid in batches of 8 so the page doesn't dump
  // 30+ cards at once. "View more" extends the visible slice; once it
  // covers the full list the button hides itself.
  const BATCH_SIZE = 8;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  // Reset the batch window if the underlying list of picks changes
  // (new ranking, hydration from share URL, flagging a gift).
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [rest.length]);
  const visibleRest = rest.slice(0, visibleCount);
  const hasMore = rest.length > visibleCount;

  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <AmbientGlow variant="results" />

        <SiteHeader onLogoClick={goHome}>
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
        </SiteHeader>

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
            <p style={{ fontFamily: "Geist, sans-serif", fontSize: 15, lineHeight: 1.7, color: "rgba(35,20,16,0.55)", margin: "14px 0 0" }}>
              {summaryParts.slice(0, -1).map((part) => `${part} · `).join("")}
              <span style={{ whiteSpace: "nowrap" }}>
                {summaryParts[summaryParts.length - 1]}
                <button
                  type="button"
                  onClick={() => setRefineOpen(true)}
                  aria-label="Adjust your answers"
                  title="Adjust your answers"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(255,255,255,0.75)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 8px -2px rgba(80,30,30,0.2)",
                    color: "#5A3F36",
                    cursor: "pointer",
                    display: "inline-flex",
                    verticalAlign: "middle",
                    marginLeft: 8,
                    position: "relative",
                    top: -1,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 4h6.2M11.8 4H14M2 8h1.7M7.3 8H14M2 12h8.2M13.8 12H14" />
                    <circle cx="10" cy="4" r="1.8" />
                    <circle cx="5.5" cy="8" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                  </svg>
                </button>
              </span>
            </p>
          </div>

          {/* States: loading, error, empty, results */}
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
          {!loading && !error && picks.length === 0 && (
            <EmptyState onRestart={restart} onRequestMore={handleRequestMore} requestSent={requestSent} answers={answers} />
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
                    {visibleRest.map((g, i) => (
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

                  {hasMore && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: isMobile ? 24 : 32,
                      }}
                    >
                      <Pillow
                        tone="cream"
                        size="md"
                        onClick={() => setVisibleCount((n) => n + BATCH_SIZE)}
                      >
                        Load more
                      </Pillow>
                    </div>
                  )}
                </>
              )}

              {/* Bottom actions, single Share CTA + one muted text link.
                  Start-over already lives in the header so we don't repeat
                  it here. Big margin above so Share doesn't feel stacked
                  on top of "Load more", it's a separate page-end intent. */}
              <div
                style={{
                  marginTop: isMobile ? 56 : 72,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Pillow tone="ink" size="md" onClick={handleShare}>
                  {shareStatus === "copied"
                    ? "Copied ✓"
                    : shareStatus === "shared"
                      ? "Shared ✓"
                      : shareStatus === "failed"
                        ? "Couldn't copy"
                        : "📤 Share these picks"}
                </Pillow>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    fontFamily: "Geist, sans-serif",
                    fontSize: 13,
                  }}
                >
                  <button
                    type="button"
                    onClick={restart}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "rgba(35,20,16,0.6)",
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                      textDecorationColor: "rgba(35,20,16,0.25)",
                    }}
                  >
                    ↻ Start over
                  </button>
                  <span aria-hidden style={{ color: "rgba(35,20,16,0.3)" }}>·</span>
                  <button
                    type="button"
                    onClick={handleRequestMore}
                    disabled={requestSent}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: requestSent ? "default" : "pointer",
                      color: requestSent ? "rgba(35,20,16,0.45)" : "#C4477E",
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                      textDecorationColor: requestSent ? "rgba(35,20,16,0.25)" : "rgba(196,71,126,0.35)",
                    }}
                  >
                    {requestSent ? "✓ Thanks, we'll add more" : "Request more like these →"}
                  </button>
                </div>
                {requestSent && NOTIFY_OPT_IN_LIVE && (
                  <div style={{ marginTop: 18 }}>
                    <NotifyOptIn answers={answers} />
                  </div>
                )}
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
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <PresentlyMark />
              <FooterLinks />
            </div>
            {picks.some((g) => g.amazonLink || isAmazonUrl(g.link)) && <AffiliateDisclosure />}
          </footer>
        </div>
      </div>

      <RefineModal
        open={refineOpen}
        answers={answers}
        isMobile={isMobile}
        onClose={() => setRefineOpen(false)}
        onApply={applyRefine}
      />

      {/* Product detail modal, carousel across all picks */}
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
  answers,
}: {
  onRestart: () => void;
  onRequestMore: () => void;
  requestSent: boolean;
  answers: Answers;
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
        Nothing matched yet.
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
        Our catalog doesn't have great picks for this combination yet. Help us grow: tell us what's missing.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Pillow tone="coral" size="md" onClick={onRequestMore} disabled={requestSent}>
          {requestSent ? "✓ Thanks, we'll add more" : "Request more in this category"}
        </Pillow>
        <Pillow tone="cream" size="md" onClick={onRestart}>↻ Try different answers</Pillow>
      </div>
      {requestSent && NOTIFY_OPT_IN_LIVE && (
        <div style={{ marginTop: 22 }}>
          <NotifyOptIn answers={answers} />
        </div>
      )}
    </div>
  );
}
