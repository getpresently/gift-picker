import { BowLogo } from "./BowLogo";

type Size = "sm" | "md" | "lg";

type Props = {
  size?: Size;
  light?: boolean;
  onClick?: () => void;
};

// `lift` raises the mark so its red box body, not the light bow above it,
// lines up with the x-height of the wordmark. Centering the whole SVG left
// the body (and its drop shadow) reading about 2px low at lg.
const sizes: Record<Size, { gap: number; logo: number; font: number; lift: number }> = {
  sm: { gap: 6, logo: 22, font: 15, lift: 1 },
  md: { gap: 8, logo: 28, font: 18, lift: 1.5 },
  lg: { gap: 10, logo: 36, font: 22, lift: 2 },
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
