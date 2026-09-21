import { useState } from "react";
import type { Option } from "../../data/questions";

type Props = {
  option: Option;
  selected: boolean;
  atMax: boolean;
  onClick: () => void;
};

export function ChipChoice({ option, selected, atMax, onClick }: Props) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const disabled = atMax;

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
        padding: "12px 14px",
        borderRadius: 14,
        background: selected
          ? "linear-gradient(160deg, #FF8C71 0%, #E64B45 100%)"
          : hovered
            ? "linear-gradient(160deg, #FFFFFC 0%, #FBEFDD 100%)"
            : "linear-gradient(160deg, #FFFCF5 0%, #F5E7D2 100%)",
        color: selected ? "#FFF8EE" : "#231410",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontFamily: "Geist, sans-serif",
        fontSize: 14,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 8,
        textAlign: "left",
        letterSpacing: "-0.005em",
        transform: pressed ? "translateY(1px) scale(0.99)" : "translateY(0)",
        boxShadow: selected
          ? "inset 0 1.4px 0 rgba(255,255,255,0.5), 0 8px 16px -4px rgba(180,40,35,0.4), 0 2px 0 rgba(0,0,0,0.12)"
          : hovered
            ? "inset 0 1.2px 0 rgba(255,255,255,0.7), 0 6px 14px -6px rgba(80,30,30,0.15), 0 2px 0 rgba(90,40,30,0.08), 0 0 0 3px rgba(230,75,69,0.12), 0 0 18px 0 rgba(230,75,69,0.22)"
            : "inset 0 1.2px 0 rgba(255,255,255,0.7), 0 6px 14px -6px rgba(80,30,30,0.15), 0 2px 0 rgba(90,40,30,0.08)",
        transition: "all 200ms cubic-bezier(.22,1.4,.4,1)",
        WebkitTapHighlightColor: "transparent",
        outline: "none",
      }}
    >
      {option.e && <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{option.e}</span>}
      <span style={{ lineHeight: 1.2 }}>{option.l}</span>
    </button>
  );
}
