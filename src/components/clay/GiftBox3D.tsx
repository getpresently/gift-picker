import { useId } from "react";

export type BoxColor = "coral" | "plum" | "butter" | "rose" | "sage" | "cream" | "indigo" | "teal";

const colors: Record<BoxColor, { top: string; side: string; dark: string }> = {
  coral:  { top: "#FF9D81", side: "#E0524C", dark: "#A82E2A" },
  plum:   { top: "#7E3F71", side: "#4A2440", dark: "#2A1226" },
  butter: { top: "#FFD074", side: "#E0A744", dark: "#A06820" },
  rose:   { top: "#FFC9B9", side: "#F2A088", dark: "#B86A52" },
  sage:   { top: "#C8D6A6", side: "#9DB378", dark: "#5F7544" },
  cream:  { top: "#FBF1E1", side: "#E8D7B8", dark: "#A8916A" },
  indigo: { top: "#8B7BFF", side: "#5B3DFF", dark: "#3B1FBF" },
  teal:   { top: "#7DDCFF", side: "#3FA5D9", dark: "#1C5E80" },
};

type Props = {
  size?: number;
  color?: BoxColor;
  rotate?: number;
  ribbonColor?: string;
};

export function GiftBox3D({ size = 200, color = "coral", rotate = -8, ribbonColor = "#FFE9A8" }: Props) {
  const uid = useId().replace(/:/g, "");
  const idTop = `box-top-${uid}`;
  const idSide = `box-side-${uid}`;
  const idRib = `box-rib-${uid}`;
  const idShadow = `box-shadow-${uid}`;
  const c = colors[color];
  return (
    <div style={{ width: size, height: size, position: "relative", transform: `rotate(${rotate}deg)` }}>
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <defs>
          <linearGradient id={idTop} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.top} />
            <stop offset="1" stopColor={c.side} />
          </linearGradient>
          <linearGradient id={idSide} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.side} />
            <stop offset="1" stopColor={c.dark} />
          </linearGradient>
          <linearGradient id={idRib} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={ribbonColor} />
            <stop offset="1" stopColor={ribbonColor} stopOpacity="0.78" />
          </linearGradient>
          <radialGradient id={idShadow} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(0,0,0,0.32)" />
            <stop offset="1" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="180" rx="70" ry="10" fill={`url(#${idShadow})`} />

        <path d="M30 82 L100 62 L170 82 L170 172 L30 172 Z" fill={`url(#${idSide})`} />
        <path d="M30 82 L100 62 L170 82 L100 102 Z" fill={`url(#${idTop})`} />
        <path d="M30 82 L100 62 L100 66 L34 84 Z" fill="rgba(255,255,255,0.4)" />

        <rect x="92" y="82" width="16" height="90" fill={`url(#${idRib})`} />
        <path d="M92 82 L100 84 L108 82 L100 102 Z" fill={ribbonColor} />
        <path d="M100 84 L108 82 L100 102 Z" fill="rgba(0,0,0,0.08)" />

        <path
          d="M 96 70 L 84 92 L 80 102 L 88 100 L 94 86 L 100 74 Z"
          fill={ribbonColor}
          opacity="0.82"
          stroke="rgba(80,40,20,0.12)"
          strokeWidth="0.4"
        />
        <path
          d="M 104 70 L 116 92 L 120 102 L 112 100 L 106 86 L 100 74 Z"
          fill={ribbonColor}
          opacity="0.82"
          stroke="rgba(80,40,20,0.12)"
          strokeWidth="0.4"
        />

        <path
          d="M 100 64 C 76 46, 54 50, 56 62 C 58 70, 78 70, 100 66 Z"
          fill={ribbonColor}
          stroke="rgba(80,40,20,0.16)"
          strokeWidth="0.6"
        />
        <path d="M 100 64 C 90 64, 82 63, 80 60 C 86 64, 94 66, 100 66 Z" fill="rgba(80,40,20,0.22)" />

        <path
          d="M 100 64 C 124 46, 146 50, 144 62 C 142 70, 122 70, 100 66 Z"
          fill={ribbonColor}
          stroke="rgba(80,40,20,0.16)"
          strokeWidth="0.6"
        />
        <path d="M 100 64 C 110 64, 118 63, 120 60 C 114 64, 106 66, 100 66 Z" fill="rgba(80,40,20,0.22)" />

        <rect x="92" y="58" width="16" height="14" rx="3" fill="#FFD074" stroke="rgba(80,40,20,0.22)" strokeWidth="0.6" />
        <rect x="93.5" y="59.5" width="13" height="3" rx="1.5" fill="rgba(255,255,255,0.45)" />
        <rect x="93.5" y="68" width="13" height="2.5" rx="1" fill="rgba(80,40,20,0.18)" />
      </svg>
    </div>
  );
}
