import type { CSSProperties } from "react";
import { GiftBox3D } from "./GiftBox3D";

/**
 * Small decorative snippets for the homepage "How it works" cards: the
 * interests question, three matched gifts with their scores, and the moment
 * the gift is opened. They borrow the quiz's tile styling but are not
 * interactive (aria-hidden, spans only). Gift photos are the self-hosted
 * showcase thumbnails in public/showcase.
 */

const INK = "#231410";
const MUTED = "rgba(35,20,16,0.55)";
const SANS = "Geist, sans-serif";
const SERIF = '"Instrument Serif", serif';

const panel: CSSProperties = {
  height: 158,
  borderRadius: 18,
  background: "rgba(35,20,16,0.04)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 10,
  marginBottom: 20,
  fontFamily: SANS,
  overflow: "hidden",
};

const label: CSSProperties = { fontSize: 12, color: MUTED, letterSpacing: "-0.005em" };

function Tile({ emoji, text, selected = false }: { emoji: string; text: string; selected?: boolean }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 10px",
        borderRadius: 12,
        fontSize: 12.5,
        fontWeight: 500,
        whiteSpace: "nowrap",
        overflow: "hidden",
        color: selected ? "#FFF8EE" : INK,
        background: selected ? "linear-gradient(160deg, #FF8C71 0%, #E64B45 100%)" : "linear-gradient(160deg, #FFFCF5 0%, #F5E7D2 100%)",
        boxShadow: selected
          ? "inset 0 1.4px 0 rgba(255,255,255,0.5), 0 6px 12px -4px rgba(180,40,35,0.35)"
          : "inset 0 1.2px 0 rgba(255,255,255,0.7), 0 4px 10px -6px rgba(80,30,30,0.18)",
      }}
    >
      <span aria-hidden="true">{emoji}</span>
      {text}
    </span>
  );
}

/** Step 1: the interests question, two full rows of tiles with two picked. */
export function QuizStepVisual() {
  return (
    <div aria-hidden="true" style={panel}>
      <div style={label}>What are they into?</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <Tile emoji="🍳" text="Cooking" selected />
        <Tile emoji="✈️" text="Travel" />
        <Tile emoji="🎧" text="Music" />
        <Tile emoji="🐾" text="Pets" />
        <Tile emoji="⚽" text="Sports" />
        <Tile emoji="🎮" text="Gaming" selected />
      </div>
    </div>
  );
}

function MatchThumb({ id, score }: { id: string; score: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, minWidth: 0 }}>
      <img
        src={`/showcase/${id}.webp`}
        alt=""
        width={72}
        height={72}
        loading="lazy"
        style={{ width: 72, height: 72, borderRadius: 14, objectFit: "cover", background: "#fff", boxShadow: "0 8px 16px -10px rgba(80,30,30,0.35)" }}
      />
      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: "#B4362F", background: "rgba(230,75,69,0.12)", whiteSpace: "nowrap" }}>
        {score}% match
      </span>
    </div>
  );
}

/** Step 2: three catalog gifts for those interests (a toaster, a controller, a pasta class), each with a match score. */
export function MatchStepVisual() {
  return (
    <div aria-hidden="true" style={panel}>
      <div style={label}>Top picks for Maya</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <MatchThumb id="r565" score={98} />
        <MatchThumb id="r462" score={95} />
        <MatchThumb id="r702" score={92} />
      </div>
    </div>
  );
}

/** Step 3: the moment they open it, a wrapped box and their reaction. */
export function GiveStepVisual() {
  return (
    <div aria-hidden="true" style={{ ...panel, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <div style={{ flexShrink: 0, width: 96, display: "flex", justifyContent: "center" }}>
        <GiftBox3D size={92} color="coral" rotate={-6} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            background: "#FFFCF5",
            borderRadius: "16px 16px 16px 4px",
            padding: "10px 13px",
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 17,
            lineHeight: 1.25,
            color: INK,
            boxShadow: "0 8px 18px -12px rgba(80,30,30,0.35)",
          }}
        >
          Wait, how did you know?!
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 6, paddingLeft: 4 }}>Maya, opening it</div>
      </div>
    </div>
  );
}
