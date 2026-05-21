import { useState } from "react";
import type { Tint } from "./ClaySurface";
import { ClaySurface } from "./ClaySurface";
import { GiftBox3D } from "./GiftBox3D";
import type { BoxColor } from "./GiftBox3D";
import { Pillow } from "./Pillow";
import type { Gift } from "../../data/gifts";

type CommonProps = {
  gift: Gift;
  tone: Tint;
  saved: boolean;
  onToggleSave: (id: string) => void;
  isMobile: boolean;
};

type Props =
  | (CommonProps & { hero: true; badge?: string })
  | (CommonProps & { hero?: false });

const openExternal = (url: string) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

const TONE_IMAGE_GRADIENT: Record<Tint, string> = {
  cream:  "linear-gradient(160deg, #FBF1E1, #E8D7B8)",
  rose:   "linear-gradient(160deg, #FFE7DB, #FFC9B9)",
  butter: "linear-gradient(160deg, #FFE9A8, #F7C76A)",
  plum:   "linear-gradient(160deg, #7E3F71, #3A1A36)",
  sage:   "linear-gradient(160deg, #DDE7C8, #B7C99A)",
  coral:  "linear-gradient(160deg, #FFB69A, #E0524C)",
  ink:    "linear-gradient(160deg, #2E1A14, #1A0E0B)",
};

/** Pick a complementary GiftBox color for a given card tone. */
function pickBoxColor(tone: Tint): BoxColor {
  if (tone === "plum") return "butter";
  if (tone === "coral") return "butter";
  if (tone === "butter") return "coral";
  if (tone === "rose") return "plum";
  if (tone === "sage") return "coral";
  if (tone === "cream") return "coral";
  return "coral";
}

function HeartButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={saved ? "Unsave" : "Save"}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -2px rgba(80,30,30,0.25)",
        zIndex: 2,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill={saved ? "#E64B45" : "none"}
        stroke={saved ? "#E64B45" : "#231410"}
        strokeWidth={1.6}
      >
        <path
          d="M8 14s-5-3.2-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 3.8-5 7-5 7z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function GiftCard(props: Props) {
  const { gift, tone, saved, onToggleSave, isMobile } = props;
  const hero = "hero" in props && props.hero === true;
  const badge = hero ? (props as { badge?: string }).badge : undefined;
  const [hovered, setHovered] = useState(false);

  const imgGradient = TONE_IMAGE_GRADIENT[hero ? "plum" : tone];
  const boxColor = pickBoxColor(hero ? "plum" : tone);
  const imgRatio = hero ? (isMobile ? "4/3" : "3/2") : "1/1";
  const boxSize = hero ? (isMobile ? 160 : 220) : 110;
  // Outer card is plum on hero (special treatment) and cream on every secondary
  // card — the per-gift `tone` only colors the inner image-area gradient, so
  // text stays readable on a light surface. (Matches the prototype.)
  const labelColor = hero ? "rgba(255,248,238,0.65)" : "rgba(35,20,16,0.55)";
  const headingColor = hero ? "#FFF8EE" : "#231410";

  return (
    <ClaySurface
      tint={hero ? "plum" : "cream"}
      style={{
        position: "relative",
        padding: hero ? (isMobile ? 22 : 28) : 16,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 200ms cubic-bezier(.22,1.4,.4,1), box-shadow 200ms ease",
        display: "flex",
        flexDirection: "column",
        gap: hero ? 18 : 12,
      }}
    >
      {/* hovered hook */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />

      {/* Top-pick badge (hero only) */}
      {hero && badge && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: 22,
            padding: "5px 12px",
            borderRadius: 999,
            background: "linear-gradient(180deg, #FF8C71, #E64B45)",
            color: "#FFF8EE",
            fontFamily: "Geist, sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            boxShadow:
              "0 6px 14px -4px rgba(180,40,35,0.5), inset 0 1px 0 rgba(255,255,255,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            zIndex: 3,
          }}
        >
          <span>✦</span> {badge}
        </div>
      )}

      {/* Image area */}
      <div
        style={{
          position: "relative",
          aspectRatio: imgRatio,
          borderRadius: hero ? 20 : 16,
          background: imgGradient,
          overflow: "hidden",
          boxShadow:
            "inset 0 0 0 1px rgba(0,0,0,0.04), inset 0 -20px 30px -10px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {gift.image ? (
          <img
            src={gift.image}
            alt={gift.name}
            style={{
              maxWidth: "75%",
              maxHeight: "75%",
              objectFit: "contain",
              filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.25))",
            }}
          />
        ) : (
          <GiftBox3D size={boxSize} color={boxColor} rotate={hero ? -6 : 6} />
        )}
        <HeartButton saved={saved} onClick={() => onToggleSave(gift.id)} />
      </div>

      {/* Meta */}
      <div>
        <div
          style={{
            fontFamily: "Geist, sans-serif",
            fontSize: 12,
            color: labelColor,
            letterSpacing: "0.02em",
          }}
        >
          {gift.brand}
        </div>
        <div
          style={{
            fontFamily: hero ? '"Instrument Serif", serif' : "Geist, sans-serif",
            fontSize: hero ? (isMobile ? 28 : 36) : 16,
            fontWeight: hero ? 400 : 600,
            letterSpacing: hero ? "-0.02em" : "-0.01em",
            color: headingColor,
            marginTop: 2,
            lineHeight: hero ? 1.05 : 1.25,
          }}
        >
          {gift.name}
        </div>

        {hero && gift.description && (
          <p
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: 15,
              color: "rgba(255,248,238,0.78)",
              lineHeight: 1.55,
              marginTop: 12,
              maxWidth: 460,
            }}
          >
            {gift.description}
          </p>
        )}
      </div>

      {/* Price + CTA row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: hero ? (isMobile ? 36 : 48) : 22,
            color: headingColor,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {gift.price > 0 ? `$${gift.price}` : "—"}
        </div>
        <Pillow
          tone={hero ? "coral" : "ink"}
          size={hero ? "md" : "sm"}
          onClick={() => openExternal(gift.link)}
        >
          {hero ? "View gift →" : "View →"}
        </Pillow>
      </div>
    </ClaySurface>
  );
}
