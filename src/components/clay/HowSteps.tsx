import type { CSSProperties } from "react";
import { ClaySurface } from "./ClaySurface";

export type HowStep = { n: string; title: string; body: string };

const INK = "#231410";
const MUTED = "rgba(35,20,16,0.65)";

const title: CSSProperties = {
  fontFamily: "Geist, sans-serif",
  fontSize: 18,
  fontWeight: 600,
  color: INK,
  letterSpacing: "-0.01em",
};
const body: CSSProperties = {
  fontFamily: "Geist, sans-serif",
  fontSize: 14,
  color: MUTED,
  marginTop: 6,
  lineHeight: 1.5,
};

/** The homepage "How it works" steps: matching cream cards with soft coral number circles. */
export function HowSteps({ steps, isMobile }: { steps: HowStep[]; isMobile: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
      {steps.map((s, i) => (
        <ClaySurface key={s.n} tint="cream" style={{ padding: 24, display: isMobile ? "flex" : "block", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(230,75,69,0.12)",
              color: "#B4362F",
              display: "grid",
              placeItems: "center",
              fontFamily: '"Instrument Serif", serif',
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            {i + 1}
          </div>
          <div style={{ marginTop: isMobile ? 2 : 18 }}>
            <div style={title}>{s.title}</div>
            <div style={body}>{s.body}</div>
          </div>
        </ClaySurface>
      ))}
    </div>
  );
}
