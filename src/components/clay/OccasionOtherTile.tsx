import { useEffect, useRef, useState } from "react";
import type { Option } from "../../data/questions";

/**
 * Drop-in replacement for `<ChoiceTile>` on the Occasion question's "Other"
 * option. Behaves like ChoiceTile in its unselected state; when selected,
 * the label "Other" morphs into an inline text input so the user types
 * their occasion directly inside the tile (no separate field below).
 *
 * The styling mirrors ChoiceTile's selected coral state so the transition
 * reads as a single tile state change, not a layout shift.
 */

type Props = {
  option: Option;
  selected: boolean;
  value: string;
  onSelect: () => void;
  onChange: (v: string) => void;
  onSubmit: () => void;
  big?: boolean;
  placeholder?: string;
};

export function OccasionOtherTile({
  option,
  selected,
  value,
  onSelect,
  onChange,
  onSubmit,
  big,
  placeholder = "Type Occasion",
}: Props) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input every time the tile transitions into the selected
  // state, including re-selection after picking another tile and coming
  // back to Other.
  useEffect(() => {
    if (selected && inputRef.current) {
      inputRef.current.focus();
      // Place caret at the end so existing text isn't auto-selected.
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [selected]);

  const baseStyle: React.CSSProperties = {
    background: selected
      ? "linear-gradient(160deg, #FF8C71 0%, #E64B45 100%)"
      : hovered
        ? "linear-gradient(160deg, #FFFFFC 0%, #FBEFDD 100%)"
        : "linear-gradient(160deg, #FFFCF5 0%, #F5E7D2 100%)",
    color: selected ? "#FFF8EE" : "#231410",
    border: "none",
    padding: big ? "20px 18px" : "16px 18px",
    borderRadius: 20,
    cursor: "pointer",
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
    WebkitTapHighlightColor: "transparent" as never,
    width: "100%",
    boxSizing: "border-box",
  };

  const emoji = option.e && (
    <span style={{ fontSize: big ? 22 : 18, lineHeight: 1 }}>{option.e}</span>
  );
  const check = selected && (
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
        flexShrink: 0,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6L5 9L10 3" stroke="#FFF8EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );

  // Unselected: behave exactly like a ChoiceTile button. Selecting flips
  // us into the input-editing variant below.
  if (!selected) {
    return (
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        style={baseStyle}
      >
        {emoji}
        <span style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span>{option.l}</span>
        </span>
      </button>
    );
  }

  // Selected: render as a div (so the inner <input> owns focus) styled
  // identically to a selected ChoiceTile, with the label replaced by an
  // editable underlined input.
  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={baseStyle}
      role="group"
      aria-label={`${option.l}: type your occasion`}
    >
      {emoji}
      <div style={{ flex: 1, minWidth: 0 }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={placeholder}
          maxLength={60}
          className="gp-other-input"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#FFF8EE",
            fontFamily: "Geist, sans-serif",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            padding: "2px 0 4px",
            borderBottom: "1.5px solid rgba(255,248,238,0.55)",
            caretColor: "#FFF8EE",
          }}
        />
      </div>
      {check}
    </div>
  );
}
