import { useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

export type PillowTone = "coral" | "ink" | "cream" | "plum";
export type PillowSize = "sm" | "md" | "lg";

type ToneSpec = { bg: string; hoverBg: string; fg: string; shadow: string };

const tones: Record<PillowTone, ToneSpec> = {
  coral: {
    bg: "linear-gradient(180deg, #FF8C71 0%, #E64B45 100%)",
    hoverBg: "linear-gradient(180deg, #FF9D85 0%, #ED5751 100%)",
    fg: "#FFF8EE",
    shadow: "180, 40, 35",
  },
  ink: {
    bg: "linear-gradient(180deg, #3A201A 0%, #1A0E0B 100%)",
    hoverBg: "linear-gradient(180deg, #4A2A22 0%, #2A1812 100%)",
    fg: "#FFF8EE",
    shadow: "30, 15, 10",
  },
  cream: {
    bg: "linear-gradient(180deg, #FFFCF5 0%, #F5E7D2 100%)",
    hoverBg: "linear-gradient(180deg, #FFFFFC 0%, #FBEFDD 100%)",
    fg: "#231410",
    shadow: "90, 50, 30",
  },
  plum: {
    bg: "linear-gradient(180deg, #6E3464 0%, #3A1A36 100%)",
    hoverBg: "linear-gradient(180deg, #7E4474 0%, #4A2A46 100%)",
    fg: "#FFF8EE",
    shadow: "50, 20, 40",
  },
};

const sizes: Record<PillowSize, { px: number; py: number; font: number; radius: number }> = {
  sm: { px: 16, py: 10, font: 14, radius: 14 },
  md: { px: 22, py: 14, font: 15, radius: 18 },
  lg: { px: 26, py: 18, font: 17, radius: 22 },
};

type Props = {
  children: ReactNode;
  tone?: PillowTone;
  size?: PillowSize;
  onClick?: (e?: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
};

export function Pillow({
  children,
  tone = "coral",
  size = "md",
  onClick,
  style,
  fullWidth,
  disabled,
  type = "button",
}: Props) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const t = tones[tone];
  const s = sizes[size];

  const shadow = pressed
    ? `inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 6px -2px rgba(${t.shadow}, 0.4), inset 0 -1px 0 rgba(0,0,0,0.15)`
    : hovered
      ? `inset 0 1.4px 0 rgba(255,255,255,0.5), 0 8px 14px -4px rgba(${t.shadow}, 0.45), 0 2px 0 rgba(0,0,0,0.12), inset 0 -2px 0 rgba(0,0,0,0.15), 0 0 0 4px rgba(${t.shadow}, 0.18), 0 0 30px 0 rgba(${t.shadow}, 0.35)`
      : `inset 0 1.4px 0 rgba(255,255,255,0.5), 0 8px 14px -4px rgba(${t.shadow}, 0.45), 0 2px 0 rgba(0,0,0,0.12), inset 0 -2px 0 rgba(0,0,0,0.15)`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: hovered && !pressed ? t.hoverBg : t.bg,
        color: t.fg,
        border: "none",
        padding: `${s.py}px ${s.px}px`,
        fontSize: s.font,
        fontFamily: "Geist, system-ui, sans-serif",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        borderRadius: s.radius,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? "100%" : "auto",
        transform: pressed ? "translateY(2px)" : "translateY(0)",
        boxShadow: shadow,
        transition: "transform 140ms cubic-bezier(.22,1.4,.4,1), box-shadow 200ms ease, background 200ms ease",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
