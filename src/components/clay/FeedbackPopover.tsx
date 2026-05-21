import { useState } from "react";
import { FEEDBACK_OPTIONS, type FeedbackOption } from "../../data/feedback";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (opt: FeedbackOption, detail?: string) => void;
  /** Anchors the popover left or right relative to its parent. */
  anchorSide?: "left" | "right";
  /** Float the popover above the trigger (used on the hero where space below is tight). */
  openUp?: boolean;
};

export function FeedbackPopover({ open, onClose, onPick, anchorSide = "right", openUp = false }: Props) {
  const [otherMode, setOtherMode] = useState(false);
  const [text, setText] = useState("");

  if (!open) return null;

  const onPickInternal = (opt: FeedbackOption) => {
    if (opt.v === "other") {
      setOtherMode(true);
      return;
    }
    onPick(opt);
    reset();
  };

  const sendOther = () => {
    const opt = FEEDBACK_OPTIONS.find((o) => o.v === "other");
    if (!opt || !text.trim()) return;
    onPick(opt, text.trim());
    reset();
  };

  const reset = () => {
    setOtherMode(false);
    setText("");
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    reset();
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        ...(openUp ? { bottom: 36 } : { top: 36 }),
        ...(anchorSide === "right" ? { right: 0 } : { left: 0 }),
        width: 260,
        background: "linear-gradient(160deg, #FFFCF5 0%, #F5E7D2 100%)",
        borderRadius: 18,
        boxShadow:
          "inset 0 1.2px 0 rgba(255,255,255,0.8), 0 18px 36px -16px rgba(80,30,30,0.35), 0 6px 14px -6px rgba(80,30,30,0.2)",
        padding: 14,
        zIndex: 20,
        animation: "fbPop 200ms cubic-bezier(.22,1.4,.4,1)",
      }}
    >
      {/* Tail pointing to trigger */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          ...(openUp ? { bottom: -4 } : { top: -4 }),
          ...(anchorSide === "right" ? { right: 22 } : { left: 22 }),
          width: 8,
          height: 8,
          background: openUp
            ? "linear-gradient(160deg, #FFFCF5 0%, #F5E7D2 100%)"
            : "#FFFCF5",
          transform: "rotate(45deg)",
        }}
      />

      <div
        style={{
          fontFamily: "Geist, sans-serif",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(35,20,16,0.55)",
          fontWeight: 600,
          padding: "0 2px 8px",
        }}
      >
        Something off?
      </div>

      {!otherMode ? (
        <>
          {FEEDBACK_OPTIONS.map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPickInternal(opt);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 8px",
                borderRadius: 10,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "Geist, sans-serif",
                fontSize: 13,
                color: "#231410",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(35,20,16,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{opt.e}</span>
              <span>{opt.l}</span>
            </button>
          ))}
          <div
            style={{
              borderTop: "1px solid rgba(35,20,16,0.08)",
              marginTop: 8,
              paddingTop: 8,
              fontFamily: "Geist, sans-serif",
              fontSize: 11,
              color: "rgba(35,20,16,0.5)",
              textAlign: "center",
            }}
          >
            Helps us tune your picks.
          </div>
        </>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell us what's off…"
            autoFocus
            rows={3}
            style={{
              width: "100%",
              fontFamily: "Geist, sans-serif",
              fontSize: 13,
              color: "#231410",
              background: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(35,20,16,0.1)",
              borderRadius: 10,
              padding: 8,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <button
              type="button"
              onClick={handleCloseClick}
              style={{
                background: "transparent",
                border: "none",
                padding: "6px 10px",
                fontFamily: "Geist, sans-serif",
                fontSize: 12,
                color: "rgba(35,20,16,0.55)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sendOther();
              }}
              disabled={!text.trim()}
              style={{
                padding: "6px 14px",
                borderRadius: 10,
                background: text.trim()
                  ? "linear-gradient(180deg, #FF8C71, #E64B45)"
                  : "rgba(35,20,16,0.08)",
                color: text.trim() ? "#FFF8EE" : "rgba(35,20,16,0.4)",
                fontFamily: "Geist, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                border: "none",
                cursor: text.trim() ? "pointer" : "not-allowed",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
