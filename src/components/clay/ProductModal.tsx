import { useEffect, useState } from "react";
import { FeedbackPopover } from "./FeedbackPopover";
import { GiftBox3D } from "./GiftBox3D";
import { Pillow } from "./Pillow";
import { PriceDisplay } from "./PriceDisplay";
import type { RankedGift } from "../../data/gifts";
import type { FeedbackOption, FeedbackRecord } from "../../data/feedback";

type Props = {
  gifts: RankedGift[];
  currentIndex: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
  isMobile: boolean;
  /** Optional dynamic "Why we picked this" bullets — currently hidden by design. */
  matchReasons?: string[];
  /** Feedback record for the gift at currentIndex (if reported). */
  feedback?: FeedbackRecord;
  /** Called when the user picks a feedback option for the current gift. */
  onReport?: (opt: FeedbackOption, detail?: string) => void;
  /** Called when the user clears feedback for the current gift. */
  onUndoReport?: () => void;
};

const openExternal = (url: string) => {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
};

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
  feedback,
  onReport,
  onUndoReport,
}: Props) {
  const open = currentIndex !== null && currentIndex >= 0 && gifts[currentIndex] !== undefined;
  const gift = open ? gifts[currentIndex as number] : null;
  const canPrev = open && (currentIndex as number) > 0;
  const canNext = open && (currentIndex as number) < gifts.length - 1;
  const reported = !!feedback;

  const [popoverOpen, setPopoverOpen] = useState(false);
  // Close the popover whenever the modal navigates to a new gift.
  useEffect(() => {
    setPopoverOpen(false);
  }, [currentIndex]);

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

  if (!open || !gift) return null;
  const idx = currentIndex as number;
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
      {/* Desktop nav arrows — outside the card */}
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
          maxWidth: 760,
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
            flex: isMobile ? "0 0 auto" : "1 1 50%",
            aspectRatio: isMobile ? "4/3" : "auto",
            minHeight: isMobile ? 0 : 380,
            background: "linear-gradient(160deg, #FFE9A8, #F7C76A)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {gift.image ? (
            <img
              src={gift.image}
              alt={gift.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <GiftBox3D size={220} color="butter" rotate={-10} ribbonColor="#FF8166" />
            </div>
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

        {/* Content side */}
        <div
          style={{
            flex: isMobile ? "1 1 auto" : "1 1 50%",
            padding: isMobile ? 22 : 28,
            overflowY: "auto",
            minHeight: 0,
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

          {/* "Why we picked this" — built but hidden by default. Remove the
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

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
            <Pillow
              tone="coral"
              size="md"
              onClick={(e) => {
                e?.stopPropagation?.();
                openExternal(gift.link);
              }}
            >
              View on {gift.brand || "store"} →
            </Pillow>
            {gift.amazonLink && (
              <Pillow
                tone="ink"
                size="md"
                onClick={(e) => {
                  e?.stopPropagation?.();
                  openExternal(gift.amazonLink);
                }}
              >
                Buy on Amazon →
              </Pillow>
            )}
          </div>

          {/* "Something off?" feedback link */}
          {onReport && (
            <div style={{ position: "relative", marginTop: 14, alignSelf: "flex-start" }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (reported && onUndoReport) onUndoReport();
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
                  onReport(opt, detail);
                  setPopoverOpen(false);
                }}
                anchorSide="left"
                openUp
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
