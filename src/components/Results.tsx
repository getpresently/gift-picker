import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { GiftCard } from "./clay/GiftCard";
import { Hero } from "./clay/Hero";
import { Pillow } from "./clay/Pillow";
import { ProductModal } from "./clay/ProductModal";
import { useIsMobile } from "../hooks/useIsMobile";
import { useImpressions } from "../hooks/useImpressions";
import { clearAnswers, GENDER_OPTIONS, loadAnswers, QUESTIONS, saveAnswers, scoringAnswers, type Answers } from "../data/questions";
import { buildMatchReasons, foldTwins, rankGifts, SECONDARY_TONES, twinSeed, type RankedGift } from "../data/gifts";
import { useGifts } from "../data/giftsApi";
import { isDemoting, NOTIFY_OPT_IN_LIVE, postFeedback, postRequest, type FeedbackOption, type FeedbackRecord } from "../data/feedback";
import { NotifyOptIn } from "./clay/NotifyOptIn";
import { toggleSaved, useSaved } from "../data/saved";
import { buildShareUrl, hydrateAnswersFromShareUrl, shareOrCopy } from "../data/share";
import { resultsBand, searchShape, track } from "../data/analytics";
import { AffiliateDisclosure } from "./clay/AffiliateDisclosure";
import { buyLinks } from "../data/affiliate";
import { SiteHeader } from "./clay/SiteHeader";
import { FooterLinks } from "./clay/FooterLinks";
import { FooterBrand } from "./clay/FooterBrand";
import { RefineModal } from "./clay/RefineModal";

export function Results() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: allGifts, loading, error } = useGifts();
  const saved = useSaved();

  // A share link (/results?r=partner&...) wins over answers this tab saved
  // earlier, so opening someone's shared picks never shows your own. With no
  // share params, answers come from sessionStorage.
  const [answers, setAnswers] = useState<Answers>(() => hydrateAnswersFromShareUrl() ?? loadAnswers());
  // Scoring sees typed occasions it recognizes (Christmas, a promotion) as
  // the built-in occasion; the header keeps the shopper's own wording.
  const scoring = useMemo(() => scoringAnswers(answers), [answers]);
  const ranked = useMemo<RankedGift[]>(() => rankGifts(allGifts, scoring), [allGifts, scoring]);
  // The twin coin toss leaves out budget, vibe, and occasion (see twinSeed).
  const seed = twinSeed(answers);

  const [feedbackById, setFeedbackById] = useState<Record<string, FeedbackRecord>>({});
  // Live re-rank: gifts reported as disliked or unavailable sort to the bottom
  // (stable within each group). Twins fold after that, so a reported twin
  // hands its card to the other maker's gift.
  const picks = useMemo<RankedGift[]>(() => {
    const demoted = new Set(ranked.filter((g) => isDemoting(feedbackById[g.id])).map((g) => g.id));
    const order = [...ranked.filter((g) => !demoted.has(g.id)), ...ranked.filter((g) => demoted.has(g.id))];
    return foldTwins(order, seed, demoted);
  }, [ranked, feedbackById, seed]);

  // One results_view per ranking shown (the catalog arriving, or new answers
  // from Adjust), never per re-render or report: the ref remembers the last
  // ranking counted. The count is the cards shown, twins folded.
  const countedRanking = useRef<RankedGift[] | null>(null);
  useEffect(() => {
    if (loading || error || !Object.keys(answers).length || countedRanking.current === ranked) return;
    countedRanking.current = ranked;
    track("results_view", { results_count: picks.length, results_band: resultsBand(picks.length) });
  }, [ranked, picks, loading, error, answers]);

  // gift_impression: once per gift per ranking, when its card has been at
  // least half on screen for a moment. With gift_open from a card, GA can
  // count taps per 100 times seen.
  const { refFor: seenRef, markSeen } = useImpressions(ranked, (id) => {
    const i = picks.findIndex((g) => g.id === id);
    const g = picks[i];
    if (g) track("gift_impression", { gift_id: g.id, gift_name: g.name, brand: g.brand, position: i + 1 });
  });

  const [modalIndex, setModalIndex] = useState<number | null>(null);
  // Every time a gift's details are shown, so GA4 can count gift opens
  // per gift alongside gift_buy_click.
  const trackOpen = (i: number, source: string) => {
    const g = picks[i];
    if (g) track("gift_open", { gift_id: g.id, gift_name: g.name, brand: g.brand, price: g.price, position: i + 1, source });
  };
  const openModal = (i: number) => {
    setModalIndex(i);
    // A tapped card was seen, even if it had not been on screen for long.
    if (picks[i]) markSeen(picks[i].id);
    trackOpen(i, i === 0 ? "top_pick" : "grid");
  };
  const closeModal = () => setModalIndex(null);
  const navigateModal = (i: number) => {
    setModalIndex(i);
    trackOpen(i, "modal_nav");
  };

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

  // Reports on gifts in the current results, twins included; reports made
  // before an Edit answers change stay in feedbackById but no longer count.
  const flaggedCount = picks.flatMap((g) => [g, ...(g.twins ?? [])]).filter((g) => feedbackById[g.id]).length;

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "failed">("idle");
  const handleShare = async () => {
    const url = buildShareUrl(answers);
    const result = await shareOrCopy(url);
    setShareStatus(result);
    track("gift_share", { method: result, ...searchShape(answers), results_count: picks.length });
    setTimeout(() => setShareStatus("idle"), 2200);
  };

  const [refineOpen, setRefineOpen] = useState(false);
  // After Update picks, the results show a short "Updating your picks" spinner
  // and the new cards ease in, so the change reads as a fresh search even
  // when the ranking itself is instant (Dalia, 10/24).
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(refreshTimer.current), []);
  const applyRefine = (next: Answers) => {
    setAnswers(next);
    saveAnswers(next);
    setRequestSent(false);
    setRefineOpen(false);
    setRefreshing(true);
    window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => {
      setRefreshing(false);
      setAnimateFrom(0);
    }, 700);
    track("results_refine", {
      recipient: next.recipient,
      age: next.age,
      occasion: next.occasion,
      interests_count: next.interests?.length ?? 0,
      vibe_count: next.vibe?.length ?? 0,
      budget: next.budget,
      gender: next.gender ?? "any",
      amazon_only: !!next.amazonOnly,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [requestSent, setRequestSent] = useState(false);
  const handleRequestMore = async () => {
    if (requestSent) return;
    setRequestSent(true);
    track("request_more");
    await postRequest(answers, picks.length);
  };

  // If user lands here with no answers at all, bounce to /quiz.
  useEffect(() => {
    if (!Object.keys(answers).length) navigate("/quiz", { replace: true });
  }, [answers, navigate]);

  const toggleSave = (id: string) => {
    // Log every heart-on event to the Feedback sheet as reason: heart.
    // Useful as a positive signal alongside the negative "Something off" reports.
    if (!toggleSaved(id)) return;
    // A twin opened inside the modal is not in picks, so search those too.
    const gift = picks.flatMap((p) => [p, ...(p.twins ?? [])]).find((p) => p.id === id);
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
  // Headline "For your <em>sibling</em>, with love." Some recipients need
  // their own wording: "Treat myself" is the shopper, a Child is often a
  // niece, a nephew, or a friend's kid rather than their own, and the
  // Mentor / Teacher option reads better as one word.
  const RECIPIENT_HEADLINE: Record<string, [string, string, string]> = {
    self: ["For ", "you", ", with love."],
    child: ["For the ", "kid", " in your life, with love."],
    mentor: ["For your ", "mentor", ", with love."],
  };
  const [headlinePre, headlineEm, headlinePost] = RECIPIENT_HEADLINE[answers.recipient ?? ""] ?? [
    "For your ",
    labelFor("recipient", answers.recipient)?.toLowerCase() ?? "them",
    ", with love.",
  ];
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
    answers.amazonOnly ? "Amazon only" : null,
    occasionLabel,
    interestsLabel,
    typeof budget === "number"
      ? typeof answers.budgetMin === "number"
        ? `$${answers.budgetMin}\u2013$${budget} budget`
        : `$${budget} budget`
      : null,
    "hand-curated",
  ].filter((p): p is string => Boolean(p));

  const [hero, ...rest] = picks;

  // Reveal the secondary grid in batches of 8 so the page doesn't dump
  // 30+ cards at once. "View more" extends the visible slice; once it
  // covers the full list the button hides itself.
  const BATCH_SIZE = 8;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  // Index of the first card from the latest "Load more"; those cards ease in.
  const [animateFrom, setAnimateFrom] = useState<number | null>(null);
  // A new ranking (edited answers, gifts loaded) starts over at one batch.
  // Reporting a gift only reorders the list, so it keeps what is shown.
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    setAnimateFrom(null);
  }, [ranked]);
  const visibleRest = rest.slice(0, visibleCount);
  const hasMore = rest.length > visibleCount;
  // "Load more" adds the next cards where the button was and pushes the
  // button below them; the page itself does not move (Dalia 10/17/26: the
  // old scroll to the first new card felt like a jump). The whole page opts
  // out of scroll anchoring (overflowAnchor below), or Chrome scrolls down to
  // keep the content under the button in view. Opting out only the button and
  // what follows it was not enough: Chrome still jumped (tested 10/17/26).
  const loadMore = () => {
    setAnimateFrom(visibleCount);
    setVisibleCount((n) => n + BATCH_SIZE);
    track("results_load_more", { shown: Math.min(visibleCount + BATCH_SIZE, rest.length), total: rest.length });
  };

  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative", overflowAnchor: "none" }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <AmbientGlow variant="results" />

        <SiteHeader nav={false} onLogoClick={goHome}>
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
          <main>
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
              {loading || refreshing
                ? refreshing ? "Updating your picks…" : "Finding your picks…"
                : error
                  ? "Couldn't reach the gift database"
                  : `${picks.length} picks tailored for ${answers.recipient === "self" ? "you" : "them"}`}
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
              {headlinePre}
              <em style={{ color: "#C4477E", fontStyle: "italic" }}>{headlineEm}</em>
              {headlinePost}
            </h1>
            <p style={{ fontFamily: "Geist, sans-serif", fontSize: 15, lineHeight: 1.7, color: "rgba(35,20,16,0.55)", margin: "14px 0 0" }}>
              {summaryParts.slice(0, -1).map((part) => `${part} · `).join("")}
              <span style={{ whiteSpace: "nowrap" }}>
                {summaryParts[summaryParts.length - 1]}
                <button
                  type="button"
                  onClick={() => setRefineOpen(true)}
                  style={{
                    height: 30,
                    padding: "0 10px 0 8px",
                    gap: 6,
                    borderRadius: 999,
                    border: "none",
                    background: "rgba(35,20,16,0.05)",
                    color: "rgba(35,20,16,0.65)",
                    fontFamily: "Geist, sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    verticalAlign: "middle",
                    marginLeft: 10,
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
                  Edit answers
                </button>
              </span>
            </p>
          </div>

          {/* States: loading, error, empty, results */}
          {(loading || refreshing) && <LoadingState tall={refreshing} />}
          {!loading && !refreshing && error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
          {!loading && !refreshing && !error && picks.length === 0 && (
            <EmptyState onRestart={restart} onRequestMore={handleRequestMore} requestSent={requestSent} answers={answers} />
          )}

          {!loading && !refreshing && !error && hero && (
            <>
              <div ref={seenRef(hero.id)} className={animateFrom === 0 ? "card-in" : undefined} style={{ marginBottom: isMobile ? 28 : 36 }}>
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
                      More {answers.recipient === "self" ? "you" : "they"} might love
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: isMobile ? 12 : 18,
                    }}
                  >
                    {visibleRest.map((g, i) => {
                      const easeIn = animateFrom !== null && i >= animateFrom;
                      return (
                        // The wrapper is a one-cell grid so the card still stretches to the row height.
                        <div
                          key={g.id || `gift-${i}`}
                          ref={seenRef(g.id)}
                          className={easeIn ? "card-in" : undefined}
                          style={{ display: "grid", animationDelay: easeIn ? `${(i - animateFrom) * 45}ms` : undefined }}
                        >
                          <GiftCard
                            gift={g}
                            tone={SECONDARY_TONES[i % SECONDARY_TONES.length]}
                            saved={saved.has(g.id)}
                            onToggleSave={toggleSave}
                            isMobile={isMobile}
                            href={g.id ? `/gift/${g.id}` : undefined}
                            onOpenDetails={() => openModal(i + 1)}
                            feedback={feedbackById[g.id]}
                            onReport={handleReport(g)}
                            onUndoReport={handleUndoReport(g)}
                          />
                        </div>
                      );
                    })}
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
                        onClick={loadMore}
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

          </main>
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
            <FooterBrand />
            <FooterLinks />
            {picks.some((g) => buyLinks(g).amazon) && <AffiliateDisclosure />}
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
        feedbackById={feedbackById}
        onReport={(g, opt, detail) => handleReport(g)(opt, detail)}
        onUndoReport={(g) => handleUndoReport(g)()}
        savedIds={saved}
        onToggleSave={toggleSave}
      />
    </div>
  );
}

// While picks update, `tall` holds the page's height so the footer doesn't jump up.
function LoadingState({ tall = false }: { tall?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "48px 0",
        minHeight: tall ? "70vh" : undefined,
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
