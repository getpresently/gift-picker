type Props = {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
};

const PRESETS = [25, 50, 100, 200];

export function BudgetSlider({ value, onChange, min, max, step }: Props) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 20 }}>
        <span
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 72,
            color: "#231410",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          ${value}
        </span>
        {value >= max && (
          <span style={{ fontFamily: "Geist, sans-serif", fontSize: 16, color: "rgba(35,20,16,0.5)" }}>+</span>
        )}
      </div>
      <div style={{ position: "relative", height: 28, marginBottom: 8 }}>
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 0,
            right: 0,
            height: 8,
            borderRadius: 4,
            background: "rgba(35,20,16,0.08)",
            boxShadow: "inset 0 1.5px 2px rgba(35,20,16,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 0,
            width: `${pct}%`,
            height: 8,
            borderRadius: 4,
            background: "linear-gradient(90deg, #FFD074 0%, #FF8C71 50%, #C4477E 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px -1px rgba(180,40,35,0.4)",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `calc(${pct}% - 14px)`,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(180deg, #FFFCF5 0%, #F5E7D2 100%)",
            boxShadow:
              "inset 0 1.4px 0 rgba(255,255,255,0.7), 0 6px 12px -2px rgba(80,30,30,0.3), 0 2px 0 rgba(0,0,0,0.1)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 8,
              borderRadius: "50%",
              background: "linear-gradient(180deg, #FF8C71, #E64B45)",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "Geist, sans-serif",
          fontSize: 12,
          color: "rgba(35,20,16,0.5)",
        }}
      >
        <span>${min}</span>
        <span>${max}+</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {PRESETS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background:
                value === v
                  ? "linear-gradient(160deg, #FF8C71, #E64B45)"
                  : "rgba(255,255,255,0.7)",
              color: value === v ? "#FFF8EE" : "#5A3F36",
              border: "1px solid rgba(35,20,16,0.08)",
              cursor: "pointer",
              fontFamily: "Geist, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              boxShadow:
                value === v
                  ? "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 10px -2px rgba(180,40,35,0.4)"
                  : "inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            ${v}
          </button>
        ))}
      </div>
    </div>
  );
}
