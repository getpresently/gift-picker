import type { CSSProperties } from "react";

type Variant = "landing" | "quiz" | "results";

const blobs: Record<Variant, CSSProperties[]> = {
  landing: [
    { top: "-10%", left: "-15%", width: 520, height: 520,
      background: "radial-gradient(circle, rgba(255,150,120,0.7), rgba(255,150,120,0) 65%)", filter: "blur(30px)" },
    { top: "15%", right: "-20%", width: 560, height: 560,
      background: "radial-gradient(circle, rgba(196,71,126,0.55), rgba(196,71,126,0) 70%)", filter: "blur(40px)" },
    { bottom: "-15%", left: "5%", width: 500, height: 500,
      background: "radial-gradient(circle, rgba(255,200,100,0.55), rgba(255,200,100,0) 65%)", filter: "blur(40px)" },
    { top: "45%", right: "25%", width: 360, height: 360,
      background: "radial-gradient(circle, rgba(140,180,220,0.35), rgba(140,180,220,0) 65%)", filter: "blur(50px)" },
  ],
  quiz: [
    { top: "-20%", left: "40%", width: 640, height: 640,
      background: "radial-gradient(circle, rgba(255,180,150,0.55), rgba(255,180,150,0) 65%)", filter: "blur(50px)" },
    { bottom: "-30%", left: "-20%", width: 540, height: 540,
      background: "radial-gradient(circle, rgba(180,140,210,0.5), rgba(180,140,210,0) 65%)", filter: "blur(50px)" },
    { bottom: "-10%", right: "-15%", width: 480, height: 480,
      background: "radial-gradient(circle, rgba(255,200,110,0.4), rgba(255,200,110,0) 65%)", filter: "blur(50px)" },
  ],
  results: [
    { top: "5%", right: "-20%", width: 620, height: 620,
      background: "radial-gradient(circle, rgba(255,140,100,0.65), rgba(255,140,100,0) 65%)", filter: "blur(40px)" },
    { top: "30%", left: "-20%", width: 620, height: 620,
      background: "radial-gradient(circle, rgba(196,71,126,0.5), rgba(196,71,126,0) 65%)", filter: "blur(50px)" },
    { bottom: "10%", right: "30%", width: 360, height: 360,
      background: "radial-gradient(circle, rgba(140,180,220,0.3), rgba(140,180,220,0) 65%)", filter: "blur(50px)" },
  ],
};

export function AmbientGlow({ variant = "landing" }: { variant?: Variant }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {blobs[variant].map((s, i) => (
        <div key={i} style={{ position: "absolute", borderRadius: "50%", ...s }} />
      ))}
    </div>
  );
}
