import { useId } from "react";

export type BoxColor = "coral" | "plum" | "butter" | "rose" | "sage" | "cream" | "indigo" | "teal";

const colors: Record<BoxColor, { top: string; side: string; dark: string }> = {
  coral:  { top: "#FF9D81", side: "#E0524C", dark: "#A82E2A" },
  plum:   { top: "#9A5A8C", side: "#6E3563", dark: "#3D1B37" },
  butter: { top: "#FFD98C", side: "#F0B552", dark: "#B97A26" },
  rose:   { top: "#FFD4C6", side: "#F2A088", dark: "#B86A52" },
  sage:   { top: "#D3DFB3", side: "#9DB378", dark: "#5F7544" },
  cream:  { top: "#FFF7EA", side: "#E8D7B8", dark: "#A8916A" },
  indigo: { top: "#A095FF", side: "#6B52FF", dark: "#3B1FBF" },
  teal:   { top: "#9BE4FF", side: "#3FA5D9", dark: "#1C5E80" },
};

type Props = {
  size?: number;
  color?: BoxColor;
  rotate?: number;
  ribbonColor?: string;
};

type Pt = [number, number];

// Box seen corner-on, in a 200x200 viewBox. Top face is the rhombus L-B-R-F;
// the two visible sides hang down from the front edges L-F and F-R.
const L: Pt = [34, 84];
const B: Pt = [100, 58];
const R: Pt = [166, 84];
const F: Pt = [100, 110];
const H = 68;          // side height
const LID = 14;        // lid depth (seam sits this far below the top edges)
const RIB = 0.075;     // half the ribbon width, as a fraction of a top edge

const down = (p: Pt, dy: number): Pt => [p[0], p[1] + dy];
// Point on the top face: s runs L to F, t runs L to B.
const top = (s: number, t: number): Pt => [
  L[0] + s * (F[0] - L[0]) + t * (B[0] - L[0]),
  L[1] + s * (F[1] - L[1]) + t * (B[1] - L[1]),
];
const poly = (...pts: Pt[]) => pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");

export function GiftBox3D({ size = 200, color = "coral", rotate = -8, ribbonColor = "#FFE9A8" }: Props) {
  const uid = useId().replace(/:/g, "");
  const id = (k: string) => `gb-${k}-${uid}`;
  const c = colors[color];

  // Ribbon bands. The one parallel to L-F crosses the lid and drops down the
  // right face; the one parallel to L-B crosses the lid and drops down the left
  // face. Both meet at the lid's center, where the bow sits.
  const lo = 0.5 - RIB;
  const hi = 0.5 + RIB;
  const ribTopA = poly(top(0, lo), top(1, lo), top(1, hi), top(0, hi));
  const ribTopB = poly(top(lo, 0), top(hi, 0), top(hi, 1), top(lo, 1));
  const ribRight = poly(top(1, lo), top(1, hi), down(top(1, hi), H), down(top(1, lo), H));
  const ribLeft = poly(top(lo, 0), top(hi, 0), down(top(hi, 0), H), down(top(lo, 0), H));
  const C = top(0.5, 0.5);
  const [cx, cy] = C;

  return (
    <div style={{ width: size, height: size, position: "relative", transform: `rotate(${rotate}deg)` }}>
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
        <defs>
          <radialGradient id={id("shadow")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(40,15,10,0.30)" />
            <stop offset="1" stopColor="rgba(40,15,10,0)" />
          </radialGradient>
          <linearGradient id={id("fade")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(40,15,10,0)" />
            <stop offset="1" stopColor="rgba(40,15,10,0.16)" />
          </linearGradient>
          <linearGradient id={id("sheen")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.30)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id={id("loop")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={ribbonColor} />
            <stop offset="1" stopColor={ribbonColor} stopOpacity="0.86" />
          </linearGradient>
        </defs>

        {/* floor shadow */}
        <ellipse cx="100" cy={F[1] + H - 4} rx="82" ry="14" fill={`url(#${id("shadow")})`} />

        {/* body: light from the upper left. Top lightest, left mid, right in shade. */}
        <polygon points={poly(L, F, down(F, H), down(L, H))} fill={c.side} />
        <polygon points={poly(L, F, down(F, H), down(L, H))} fill={`url(#${id("fade")})`} />
        <polygon points={poly(F, R, down(R, H), down(F, H))} fill={c.side} />
        <polygon points={poly(F, R, down(R, H), down(F, H))} fill="rgba(40,15,10,0.26)" />
        <polygon points={poly(F, R, down(R, H), down(F, H))} fill={`url(#${id("fade")})`} />
        <polygon points={poly(L, B, R, F)} fill={c.top} />
        <polygon points={poly(L, B, R, F)} fill={`url(#${id("sheen")})`} />

        {/* lid band: slightly brighter than the body, with a soft seam shadow below */}
        <polygon points={poly(L, F, down(F, LID), down(L, LID))} fill="rgba(255,255,255,0.12)" />
        <polygon points={poly(F, R, down(R, LID), down(F, LID))} fill="rgba(255,255,255,0.06)" />
        <polygon points={poly(down(L, LID), down(F, LID), down(F, LID + 4), down(L, LID + 4))} fill="rgba(40,15,10,0.12)" />
        <polygon points={poly(down(F, LID), down(R, LID), down(R, LID + 4), down(F, LID + 4))} fill="rgba(40,15,10,0.14)" />
        <polyline points={poly(down(L, LID), down(F, LID), down(R, LID))} fill="none" stroke="rgba(40,15,10,0.22)" strokeWidth="0.9" />

        {/* ribbons: across the lid and down the middle of each visible side */}
        <polygon points={ribLeft} fill={ribbonColor} />
        <polygon points={ribRight} fill={ribbonColor} />
        <polygon points={ribRight} fill="rgba(40,15,10,0.24)" />
        <polygon points={ribLeft} fill={`url(#${id("fade")})`} />
        <polygon points={ribTopA} fill={ribbonColor} />
        <polygon points={ribTopB} fill={ribbonColor} />
        <polygon points={ribTopB} fill="rgba(255,255,255,0.18)" />
        <polygon points={ribLeft} fill="none" stroke="rgba(40,15,10,0.12)" strokeWidth="0.5" />
        <polygon points={ribRight} fill="none" stroke="rgba(40,15,10,0.14)" strokeWidth="0.5" />

        {/* edge light: crisp lid edges and front corner */}
        <polyline points={poly(L, F, R)} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.1" strokeLinejoin="round" />
        <polyline points={poly(L, B, R)} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" strokeLinejoin="round" />
        <line x1={F[0]} y1={F[1]} x2={F[0]} y2={F[1] + H} stroke="rgba(255,255,255,0.18)" strokeWidth="0.9" />

        {/* bow, centered where the ribbons cross */}
        <g transform={`translate(${cx - 100} ${cy - 66})`}>
          {/* tails draped toward the front */}
          <path d="M 97 69 L 85 90 L 81 100 L 88 96 L 92 99 L 101 72 Z" fill={ribbonColor} />
          <path d="M 97 69 L 85 90 L 81 100 L 88 96 L 92 99 L 101 72 Z" fill="rgba(40,15,10,0.10)" />
          <path d="M 103 69 L 115 90 L 119 100 L 112 96 L 108 99 L 99 72 Z" fill={ribbonColor} />
          <path d="M 103 69 L 115 90 L 119 100 L 112 96 L 108 99 L 99 72 Z" fill="rgba(40,15,10,0.18)" />
          {/* loops */}
          <path d="M 100 66 C 80 40, 50 42, 53 58 C 55 70, 78 72, 100 68 Z" fill={`url(#${id("loop")})`} stroke="rgba(40,15,10,0.16)" strokeWidth="0.6" />
          <path d="M 100 66 C 88 63, 76 61, 70 58 C 76 64, 90 67, 100 68 Z" fill="rgba(40,15,10,0.18)" />
          <path d="M 100 66 C 120 40, 150 42, 147 58 C 145 70, 122 72, 100 68 Z" fill={`url(#${id("loop")})`} stroke="rgba(40,15,10,0.16)" strokeWidth="0.6" />
          <path d="M 100 66 C 112 63, 124 61, 130 58 C 124 64, 110 67, 100 68 Z" fill="rgba(40,15,10,0.22)" />
          <path d="M 59 53 C 63 48, 70 46, 77 49" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 123 49 C 130 46, 137 48, 141 53" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" />
          {/* knot */}
          <rect x="93" y="60" width="14" height="13" rx="3.5" fill={ribbonColor} stroke="rgba(40,15,10,0.22)" strokeWidth="0.6" />
          <rect x="94.5" y="61.5" width="11" height="3" rx="1.5" fill="rgba(255,255,255,0.45)" />
          <rect x="94.5" y="69" width="11" height="2.5" rx="1.2" fill="rgba(40,15,10,0.16)" />
        </g>
      </svg>
    </div>
  );
}
