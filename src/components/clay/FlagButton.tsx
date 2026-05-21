import type { MouseEvent } from "react";

type Props = {
  active: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
};

export function FlagButton({ active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Report this gift"
      style={{
        position: "absolute",
        top: 56, // sits below the save heart (top:12, h:36 → next slot at 56)
        right: 12,
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: active ? "rgba(230,75,69,0.92)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(6px)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -2px rgba(80,30,30,0.25)",
        zIndex: 2,
        transition: "background 160ms ease",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
        <path
          d="M3 1.5V12.5"
          stroke={active ? "#FFF8EE" : "#231410"}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M3 2.2 L10.5 2.2 L9 4.6 L10.5 7 L3 7 Z"
          fill={active ? "#FFF8EE" : "#231410"}
          stroke={active ? "#FFF8EE" : "#231410"}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
