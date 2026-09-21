import { useState } from "react";
import type { Option } from "../../data/questions";

type Props = {
  option: Option;
  selected: boolean;
  onClick: () => void;
  big?: boolean;
  disabled?: boolean;
};

export function ChoiceTile({ option, selected, onClick, big, disabled }: Props) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => !disabled && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      disabled={disabled}
      style={{
        background: selected
          ? "linear-gradient(160deg, #FF8C71 0%, #E64B45 100%)"
          : hovered
            ? "linear-gradient(160deg, #FFFFFC 0%, #FBEFDD 100%)"
            : "linear-gradient(160deg, #FFFCF5 0%, #F5E7D2 100%)",
        color: selected ? "#FFF8EE" : "#231410",
        border: "none",
        padding: big ? "20px 18px" : "16px 18px",
        borderRadius: 20,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontFamily: "Geist, sans-serif",
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transform: pressed ? "translateY(2px) scale(0.99)" : "translateY(0)",
        boxShadow: selected
          ? "inset 0 1.4px 0 rgba(255,255,255,0.5), 0 10px 22px -6px rgba(180,40,35,0.5), 0 2px 0 rgba(0,0,0,0.12), inset 0 -2px 0 rgba(0,0,0,0.15)"
          : hovered
            ? "inset 0 1.2px 0 rgba(255,255,255,0.7), inset 0 -2px 0 rgba(90,40,30,0.06), 0 10px 22px -10px rgba(80,30,30,0.18), 0 4px 0 rgba(90,40,30,0.08), 0 0 0 3px rgba(230,75,69,0.12), 0 0 24px 0 rgba(230,75,69,0.22)"
            : "inset 0 1.2px 0 rgba(255,255,255,0.7), inset 0 -2px 0 rgba(90,40,30,0.06), 0 10px 22px -10px rgba(80,30,30,0.18), 0 4px 0 rgba(90,40,30,0.08)",
        transition: "all 200ms cubic-bezier(.22,1.4,.4,1)",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {option.e && <span style={{ fontSize: big ? 22 : 18, lineHeight: 1 }}>{option.e}</span>}
      <span style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span>{option.l}</span>
        {option.hint && (
          <span style={{ fontSize: 12, fontWeight: 400, opacity: selected ? 0.85 : 0.55, marginTop: 1 }}>
            {option.hint}
          </span>
        )}
      </span>
      {selected && (
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="#FFF8EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
