import { BowLogo } from "./BowLogo";

type Size = "sm" | "md" | "lg";

type Props = {
  size?: Size;
  light?: boolean;
  onClick?: () => void;
};

// `lift` raises the mark so the red box sits on the wordmark's baseline with
// the bow just above the x-height. Centering the whole SVG left the box (and
// its drop shadow) hanging below the letters; 2px was still visibly low.
const sizes: Record<Size, { gap: number; logo: number; font: number; lift: number }> = {
  sm: { gap: 6, logo: 22, font: 15, lift: 2.5 },
  md: { gap: 8, logo: 28, font: 18, lift: 3 },
  lg: { gap: 10, logo: 36, font: 22, lift: 4 },
};

export function Wordmark({ size = "md", light = false, onClick }: Props) {
  const s = sizes[size];
  return (
    <button
      onClick={onClick}
      aria-label="GiftPicker home"
      style={{
        display: "flex",
        alignItems: "center",
        gap: s.gap,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: onClick ? "pointer" : "default",
        WebkitTapHighlightColor: "transparent",
        outline: "none",
      }}
    >
      <span style={{ display: "block", transform: `translateY(-${s.lift}px)` }}>
        <BowLogo size={s.logo} />
      </span>
      <span
        style={{
          fontFamily: "Geist, system-ui, sans-serif",
          fontWeight: 600,
          fontSize: s.font,
          letterSpacing: "-0.02em",
          color: light ? "#FFF8EE" : "#231410",
        }}
      >
        giftpicker<span style={{ color: "#C4477E" }}>.</span>
      </span>
    </button>
  );
}
