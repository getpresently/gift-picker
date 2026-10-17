import { useEffect, useRef, useState } from "react";
import { FeedbackPopover } from "./FeedbackPopover";
import { GiftBox3D } from "./GiftBox3D";
import { BuyButtons } from "./BuyButtons";
import { PriceDisplay } from "./PriceDisplay";
import { TwinRow } from "./TwinRow";
import { useImageFallback } from "../../hooks/useImageFallback";
import { track } from "../../data/analytics";
import type { RankedGift } from "../../data/gifts";
import type { FeedbackOption, FeedbackRecord } from "../../data/feedback";

type Props = {
  gifts: RankedGift[];
  currentIndex: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
  isMobile: boolean;
  /** Optional dynamic "Why we picked this" bullets, currently hidden by design. */
  matchReasons?: string[];
  /** Feedback records by gift id; the modal reads the shown gift's (list gift or twin). */
  feedbackById?: Record<string, FeedbackRecord>;
  /** Called when the user picks a feedback option for the shown gift. */
  onReport?: (gift: RankedGift, opt: FeedbackOption, detail?: string) => void;
  /** Called when the user clears feedback for the shown gift. */
  onUndoReport?: (gift: RankedGift) => void;
  /** Hearted gift ids; the heart reflects the shown gift. */
  savedIds?: Set<string>;
  /** Toggle the heart for the shown gift. */
  onToggleSave?: (giftId: string) => void;
};


/** Bottom-edge fade for the scrolling details, used as a CSS mask. */
const SCROLL_FADE = "linear-gradient(to bottom, #000 calc(100% - 56px), transparent)";

function navBtnStyle(enabled: boolean): React.CSSProperties {
  return {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: enabled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
    backdropFilter: "blur(6px)",
    border: "none",
    cursor: enabled ? "pointer" : "not-allowed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: enabled
      ? "inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 14px -2px rgba(30,15,10,0.4)"
      : "inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 6px -2px rgba(30,15,10,0.2)",
    color: enabled ? "#231410" : "rgba(35,20,16,0.4)",
    transition: "all 160ms ease",
  };
}

export function ProductModal({
  gifts,
  currentIndex,
  onNavigate,
  onClose,
  isMobile,
  matchReasons,
  feedbackById,
  onReport,
  onUndoReport,
  savedIds,
  onToggleSave,
}: Props) {
  const open = currentIndex !== null && currentIndex >= 0 && gifts[currentIndex] !== undefined;
  const listGift = open ? gifts[currentIndex as number] : null;
  // A twin opened from the "Also from another maker" row replaces the list
  // gift in place; the arrows and counter still walk the results list.
  const [twinView, setTwinView] = useState<RankedGift | null>(null);
  // Moving through the results drops an open twin. Reset during render (not
  // in an effect) so the next gift never flashes the old twin first.
  const [twinIndex, setTwinIndex] = useState(currentIndex);
  if (twinIndex !== currentIndex) {
    setTwinIndex(currentIndex);
    setTwinView(null);
  }
  const gift = twinView ?? listGift;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  const checkMoreBelow = () => {
    const el = scrollRef.current;
    setMoreBelow(!!el && el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  };
  useEffect(() => {
    checkMoreBelow();
    window.addEventListener("resize", checkMoreBelow);
    return () => window.removeEventListener("resize", checkMoreBelow);
  }, [open, gift?.id]);
  const canPrev = open && (currentIndex as number) > 0;
  const canNext = open && (currentIndex as number) < gifts.length - 1;
  const feedback = gift ? feedbackById?.[gift.id] : undefined;
  const reported = !!feedback;
  const saved = gift ? !!savedIds?.has(gift.id) : false;

  const [popoverOpen, setPopoverOpen] = useState(false);
  // Close the popover whenever the modal navigates to a new gift or twin.
  useEffect(() => {
    setPopoverOpen(false);
  }, [currentIndex, twinView]);

  // Fall back to the GiftBox3D placeholder if the photo URL is broken.
  // Reset hook tracks `gift.image` so navigating from a broken-photo
  // gift to a working one re-tries the next image cleanly.
  const { failed: imgFailed, onError: onImgError, loaded: imgLoaded, onLoad: onImgLoad } = useImageFallback(gift?.image);

  // Per-gift permalink (/gift/:id) copy affordance.
  const [linkCopied, setLinkCopied] = useState(false);
  useEffect(() => {
    setLinkCopied(false);
  }, [currentIndex, twinView]);
  const copyGiftLink = async () => {
    if (!gift) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/gift/${gift.id}`);
      setLinkCopied(true);
      track("gift_link_copy", { gift_id: gift.id, source: "modal" });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard unavailable; leave the button as-is.
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && canPrev) onNavigate((currentIndex as number) - 1);
      else if (e.key === "ArrowRight" && canNext) onNavigate((currentIndex as number) + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, currentIndex, canPrev, canNext, onClose, onNavigate]);

  if (!open || !gift || !listGift) return null;
  const idx = currentIndex as number;
  // The other gifts in this twin group: the list gift's twins, or, while a
  // twin is open, the list gift plus its remaining twins.
  const alternatives = twinView
    ? [listGift, ...(listGift.twins ?? []).filter((t) => t.id !== twinView.id)]
    : listGift.twins ?? [];
  const openAlternative = (alt: RankedGift) => {
    track("gift_twin_open", { gift_id: alt.id, from_gift_id: gift.id, source: "modal" });
    setTwinView(alt.id === listGift.id ? null : alt);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const match = typeof gift.matchScore === "number" ? Math.round(gift.matchScore) : null;
  // Derive simple tags from gift.interests / gift.types (up to 3)
  const tags = [...gift.interests.slice(0, 2), ...gift.types.slice(0, 1)].filter(Boolean).slice(0, 3);
  const reasons = matchReasons ?? [];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(35,20,16,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 32,
        animation: "fbFade 220ms cubic-bezier(.22,1.4,.4,1)",
      }}
    >
      {/* Desktop nav arrows, outside the card */}
      {!isMobile && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", zIndex: 5 }}
        >
          <button
            type="button"
            onClick={() => canPrev && onNavigate(idx - 1)}
            disabled={!canPrev}
            aria-label="Previous gift"
            style={navBtnStyle(canPrev)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2 L4 7 L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
      {!isMobile && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", zIndex: 5 }}
        >
          <button
            type="button"
            onClick={() => canNext && onNavigate(idx + 1)}
            disabled={!canNext}
            aria-label="Next gift"
            style={navBtnStyle(canNext)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2 L10 7 L5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg, #FFFCF5 0%, #FBF1E1 100%)",
          borderRadius: isMobile ? "24px 24px 0 0" : 24,
          width: "100%",
          maxWidth: isMobile ? 760 : 900,
          maxHeight: isMobile ? "92vh" : "90vh",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          overflow: "hidden",
          boxShadow:
            "inset 0 1.2px 0 rgba(255,255,255,0.8), 0 40px 80px -20px rgba(30,15,10,0.5), 0 16px 32px -8px rgba(30,15,10,0.3)",
          position: "relative",
          animation: isMobile
            ? "fbSheetUp 280ms cubic-bezier(.22,1.4,.4,1)"
            : "fbPop 240ms cubic-bezier(.22,1.4,.4,1)",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 6,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(6px)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -2px rgba(80,30,30,0.25)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2L10 10M10 2L2 10" stroke="#231410" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {/* Position counter */}
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            zIndex: 6,
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(35,20,16,0.7)",
            color: "#FFF8EE",
            fontFamily: "Geist, sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
            backdropFilter: "blur(6px)",
          }}
        >
          {idx + 1} / {gifts.length}
        </div>

        {/* Image side */}
        <div
          style={{
            flex: isMobile ? "0 0 auto" : "1 1 42%",
            aspectRatio: isMobile ? "4/3" : "auto",
            minHeight: isMobile ? 0 : 380,
            background: "linear-gradient(160deg, #FFE9A8, #F7C76A)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {gift.image && !imgFailed ? (
            <img
              key={gift.image}
              src={gift.image}
              alt={gift.name}
              onError={onImgError}
              onLoad={onImgLoad}
              style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 160ms ease", width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <GiftBox3D size={220} color="butter" rotate={-10} ribbonColor="#FF8166" />
            </div>
          )}

          {/* Save heart, top-right of image. On mobile, offset down to clear
              the modal's Close button which sits at top-right of the card. */}
          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(gift.id);
              }}
              aria-label={saved ? "Unsave" : "Save"}
              style={{
                position: "absolute",
                top: isMobile ? 56 : 14,
                right: 14,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(8px)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -2px rgba(80,30,30,0.25)",
                zIndex: 5,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill={saved ? "#E64B45" : "none"}
                stroke={saved ? "#E64B45" : "#231410"}
                strokeWidth={1.6}
              >
                <path
                  d="M8 14s-5-3.2-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 3.8-5 7-5 7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* Mobile inline nav arrows */}
          {isMobile && (
            <>
              <button
                type="button"
                onClick={() => canPrev && onNavigate(idx - 1)}
                disabled={!canPrev}
                aria-label="Previous gift"
                style={{
                  ...navBtnStyle(canPrev),
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 40,
                  height: 40,
                  zIndex: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2 L4 7 L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => canNext && onNavigate(idx + 1)}
                disabled={!canNext}
                aria-label="Next gift"
                style={{
                  ...navBtnStyle(canNext),
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 40,
                  height: 40,
                  zIndex: 4,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2 L10 7 L5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Content side, split into scrollable middle + fixed footer
            (CTAs) so the Buy buttons are always visible on mobile even
            when the description is long. */}
        <div
          style={{
            flex: isMobile ? "1 1 auto" : "1 1 58%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            position: "relative",
          }}
        >
          <div
            ref={scrollRef}
            onScroll={checkMoreBelow}
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              overflowY: "auto",
              // While more content sits below, the bottom edge fades into the card.
              ...(moreBelow ? { WebkitMaskImage: SCROLL_FADE, maskImage: SCROLL_FADE } : {}),
              padding: isMobile ? "22px 22px 14px" : "28px 28px 18px",
            }}
          >
          {gift.brand && (
            <div
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(35,20,16,0.55)",
                fontWeight: 600,
                marginTop: isMobile ? 4 : 0,
              }}
            >
              {gift.brand}
            </div>
          )}
          <h3
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontWeight: 400,
              fontSize: isMobile ? 26 : 32,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#231410",
              margin: "6px 0 0",
              textWrap: "balance" as never,
            }}
          >
            {gift.name}
          </h3>

          <div style={{ marginTop: 14 }}>
            <PriceDisplay gift={gift} variant="modal" />
          </div>

          {/* Match meter */}
          {match !== null && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 6,
                  fontFamily: "Geist, sans-serif",
                  fontSize: 12,
                  color: "rgba(35,20,16,0.6)",
                }}
              >
                <span style={{ fontWeight: 600, color: "#231410" }}>Match confidence</span>
                <span
                  style={{
                    fontFamily: '"Instrument Serif", serif',
                    fontSize: 20,
                    color: "#C4477E",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {match}%
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  background: "rgba(35,20,16,0.08)",
                  boxShadow: "inset 0 1.5px 2px rgba(35,20,16,0.12)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${match}%`,
                    height: "100%",
                    borderRadius: 4,
                    background: "linear-gradient(90deg, #FFD074, #FF8C71, #C4477E)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Description */}
          {gift.description && (
            <p
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 14,
                lineHeight: 1.6,
                color: "rgba(35,20,16,0.78)",
                marginTop: 18,
              }}
            >
              {gift.description}
            </p>
          )}

          {/* "Why we picked this", built but hidden by default. Remove the
              `display: none` to enable when product is ready. */}
          {reasons.length > 0 && (
            <div
              style={{
                display: "none",
                marginTop: 18,
                padding: 14,
                borderRadius: 14,
                background: "rgba(196,71,126,0.08)",
                border: "1px solid rgba(196,71,126,0.18)",
              }}
            >
              <div
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#C4477E",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Why we picked this
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontFamily: "Geist, sans-serif",
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "#231410",
                }}
              >
                {reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "rgba(35,20,16,0.06)",
                    fontFamily: "Geist, sans-serif",
                    fontSize: 12,
                    color: "rgba(35,20,16,0.7)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Twins from other brands. A row opens that gift's own listing
              here in the modal (not the store). */}
          {alternatives.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <TwinRow twins={alternatives} onOpen={openAlternative} />
            </div>
          )}

          </div>

          {/* Pinned footer, CTAs + feedback link. flexShrink:0 keeps it
              from being squeezed; on mobile a subtle top border + cream
              wash separates it from the scrolling content. */}
          <div
            style={{
              flexShrink: 0,
              padding: isMobile ? "14px 22px 22px" : "0 28px 28px",
              borderTop: isMobile ? "1px solid rgba(35,20,16,0.06)" : "none",
              background: isMobile
                ? "linear-gradient(180deg, #FBF1E1 0%, #FFFCF5 100%)"
                : "transparent",
              position: "relative",
              zIndex: 2,
            }}
          >
          <BuyButtons gift={gift} source="modal" oneRow={!isMobile} style={{ marginTop: isMobile ? 0 : 22 }} />

          {/* Footer links: "Something off?" feedback + per-gift permalink */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            {onReport && (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (reported && onUndoReport) onUndoReport(gift);
                    else setPopoverOpen((o) => !o);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    fontFamily: "Geist, sans-serif",
                    fontSize: 12,
                    color: reported ? "#C4477E" : "rgba(35,20,16,0.55)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    textDecorationColor: reported ? "#C4477E" : "rgba(35,20,16,0.3)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {reported ? `${feedback.option.e} Reported · undo` : "Something off?"}
                </button>
                <FeedbackPopover
                  open={popoverOpen}
                  onClose={() => setPopoverOpen(false)}
                  onPick={(opt, detail) => {
                    onReport(gift, opt, detail);
                    setPopoverOpen(false);
                  }}
                  anchorSide="left"
                  openUp
                />
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copyGiftLink();
              }}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                fontFamily: "Geist, sans-serif",
                fontSize: 12,
                color: linkCopied ? "#4CAF50" : "rgba(35,20,16,0.55)",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                textDecorationColor: "rgba(35,20,16,0.3)",
              }}
            >
              {linkCopied ? "Link copied ✓" : "🔗 Copy link"}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
