import type { CSSProperties } from "react";
import { useImageFallback } from "../../hooks/useImageFallback";
import type { Gift } from "../../data/gifts";

type Props<T extends Gift> = {
  /** The other gifts in the twin group; at most 2 are shown, and none renders nothing. */
  twins: T[];
  /** Opens that twin's own GiftPicker listing (never the store). */
  onOpen: (twin: T) => void;
  style?: CSSProperties;
};

/**
 * "Also from another maker": near-identical gifts from other brands, shown
 * in the product modal and on the gift page. Lives in the scrolling content,
 * never in the pinned Buy-button footer.
 */
export function TwinRow<T extends Gift>({ twins, onOpen, style }: Props<T>) {
  const shown = twins.slice(0, 2);
  if (!shown.length) return null;
  return (
    <div style={style}>
      <div
        style={{
          fontFamily: "Geist, sans-serif",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(35,20,16,0.55)",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        Also from another maker
      </div>
      {shown.map((t, i) => (
        <button
          key={t.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(t);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            marginTop: i ? 8 : 0,
            padding: 10,
            border: "none",
            borderRadius: 14,
            background: "rgba(35,20,16,0.045)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <TwinThumb src={t.image} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontFamily: "Geist, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.3,
                color: "#231410",
              }}
            >
              {t.name}
            </span>
            <span
              style={{
                display: "block",
                marginTop: 2,
                fontFamily: "Geist, sans-serif",
                fontSize: 12,
                color: "rgba(35,20,16,0.6)",
              }}
            >
              {[t.brand, t.priceLabel].filter(Boolean).join(", ")}
            </span>
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden style={{ color: "rgba(35,20,16,0.45)", flexShrink: 0 }}>
            <path d="M5 2 L10 7 L5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}

const THUMB: CSSProperties = { width: 56, height: 56, borderRadius: 10, background: "#fff", flexShrink: 0 };

/** The twin's photo, or a plain tile with a gift emoji when it fails to load. */
function TwinThumb({ src }: { src: string }) {
  const { failed, onError } = useImageFallback(src);
  if (!src || failed) {
    return (
      <span aria-hidden style={{ ...THUMB, display: "grid", placeItems: "center", fontSize: 24 }}>
        🎁
      </span>
    );
  }
  return <img key={src} src={src} alt="" onError={onError} style={{ ...THUMB, objectFit: "contain" }} />;
}
