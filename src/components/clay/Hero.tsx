import { useState } from "react";
import type { CSSProperties } from "react";
import { ClaySurface } from "./ClaySurface";
import { FeedbackPopover } from "./FeedbackPopover";
import { Pillow } from "./Pillow";
import { PriceDisplay } from "./PriceDisplay";
import type { RankedGift } from "../../data/gifts";
import type { FeedbackOption, FeedbackRecord } from "../../data/feedback";

type Props = {
  gift: RankedGift;
  saved: boolean;
  onToggleSave: (id: string) => void;
  isMobile: boolean;
  onOpenModal?: () => void;
  feedback?: FeedbackRecord;
  onReport?: (option: FeedbackOption, detail?: string) => void;
  onUndoReport?: () => void;
};

function clampLines(n: number): CSSProperties {
  return {
    display: "-webkit-box",
    WebkitLineClamp: n,
    WebkitBoxOrient: "vertical" as never,
    overflow: "hidden",
  };
}

const openExternal = (url: string) => {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
};

export function Hero({
  gift,
  saved,
  onToggleSave,
  isMobile,
  onOpenModal,
  feedback,
  onReport,
  onUndoReport,
}: Props) {
  const [imgHover, setImgHover] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const reported = !!feedback;
  const match = typeof gift.matchScore === "number" ? Math.round(gift.matchScore) : null;
  const eyebrowText = match !== null ? `TOP PICK · ${match}% MATCH` : "TOP PICK";

  return (
    <ClaySurface
      tint="plum"
      style={{
        position: "relative",
        // Extra top padding clears the eyebrow badge (which overhangs by ~14px)
        // and gives the brand line some breathing room below it.
        padding: isMobile ? "36px 18px 20px" : "44px 28px 22px",
        color: "#FFF8EE",
        overflow: "visible", // allow eyebrow badge to overlap
      }}
    >
      {/* Eyebrow badge */}
      <div
        style={{
          position: "absolute",
          top: -14,
          left: isMobile ? 18 : 28,
          padding: isMobile ? "7px 14px 7px 12px" : "8px 16px 8px 14px",
          borderRadius: 999,
          background: "linear-gradient(180deg, #FF8C71 0%, #E64B45 100%)",
          color: "#FFF8EE",
          fontFamily: "Geist, sans-serif",
          fontSize: isMobile ? 11 : 12,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          boxShadow:
            "inset 0 1.4px 0 rgba(255,255,255,0.5), 0 10px 22px -6px rgba(180,40,35,0.5), 0 2px 0 rgba(0,0,0,0.12)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          zIndex: 3,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="#FFD074" aria-hidden="true">
          <path d="M8 1l2.1 4.4 4.9.7-3.5 3.4.8 4.8L8 12l-4.3 2.3.8-4.8L1 6.1l4.9-.7z" />
        </svg>
        {eyebrowText}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
          gridTemplateAreas: isMobile ? '"image" "text"' : '"text image"',
          gap: isMobile ? 18 : 28,
          alignItems: "start",
        }}
      >
        {/* TEXT */}
        <div style={{ gridArea: "text", display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {gift.brand && (
            <div
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#FFD074",
                marginTop: isMobile ? 4 : 0,
              }}
            >
              {gift.brand}
            </div>
          )}
          <h2
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: isMobile ? 28 : 40,
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "#FFF8EE",
              ...clampLines(2),
            }}
          >
            {gift.name}
          </h2>
          {gift.description && (
            <p
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 15,
                lineHeight: 1.55,
                color: "rgba(255,248,238,0.78)",
                margin: 0,
                ...clampLines(3),
              }}
            >
              {gift.description}
            </p>
          )}
          <div style={{ marginTop: 4 }}>
            <PriceDisplay gift={gift} variant="hero" invert />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            {onOpenModal && (
              <Pillow tone="cream" size="md" onClick={onOpenModal}>
                More details
              </Pillow>
            )}
            <Pillow
              tone="coral"
              size="md"
              onClick={(e) => {
                e?.stopPropagation?.();
                openExternal(gift.link);
              }}
            >
              View gift →
            </Pillow>
          </div>
          {onReport && (
            <div style={{ position: "relative", marginTop: 8, alignSelf: "flex-start" }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (reported && onUndoReport) {
                    onUndoReport();
                  } else {
                    setPopoverOpen((o) => !o);
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  fontFamily: "Geist, sans-serif",
                  fontSize: 12,
                  color: reported ? "#FFD074" : "rgba(255,248,238,0.55)",
                  cursor: "pointer",
                  textAlign: "left",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  textDecorationColor: reported ? "#FFD074" : "rgba(255,248,238,0.3)",
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

        {/* IMAGE WELL */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenModal) onOpenModal();
          }}
          onMouseEnter={() => setImgHover(true)}
          onMouseLeave={() => setImgHover(false)}
          aria-label="Open details"
          style={{
            gridArea: "image",
            position: "relative",
            aspectRatio: isMobile ? "16/10" : "1/1",
            borderRadius: 18,
            background: "linear-gradient(160deg, #FFE9A8, #F7C76A)",
            border: "none",
            cursor: onOpenModal ? "pointer" : "default",
            overflow: "hidden",
            padding: 0,
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 -20px 40px -10px rgba(0,0,0,0.18), 0 10px 24px -8px rgba(0,0,0,0.35)",
            transform: imgHover ? "translateY(-2px)" : "translateY(0)",
            transition: "transform 200ms cubic-bezier(.22,1.4,.4,1)",
          }}
        >
          {gift.image && (
            <img
              src={gift.image}
              alt={gift.name}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          )}
          {/* Save heart top-right */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(gift.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onToggleSave(gift.id);
              }
            }}
            aria-label={saved ? "Unsave" : "Save"}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -2px rgba(80,30,30,0.25)",
              cursor: "pointer",
              zIndex: 2,
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
          </span>
        </button>
      </div>
    </ClaySurface>
  );
}
