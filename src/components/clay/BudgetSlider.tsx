type Props = {
  value: number;
  onChange: (v: number) => void;
  /** Optional floor. At `min` it means "no lower bound". */
  minValue?: number;
  onMinChange?: (v: number) => void;
  min: number;
  max: number;
  step: number;
};

// Two native range inputs share one track. Their tracks ignore the pointer and
// only the (invisible) thumbs catch it, so each handle drags on its own and
// both stay keyboard-accessible. The visible thumbs are the divs below.
const RANGE_CSS = `
.gp-range { -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; margin: 0; }
.gp-range::-webkit-slider-runnable-track { background: transparent; height: 28px; }
.gp-range::-moz-range-track { background: transparent; height: 28px; }
.gp-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; pointer-events: auto; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; background: transparent; border: none; }
.gp-range::-moz-range-thumb { pointer-events: auto; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; background: transparent; border: none; }
`;

function Thumb({ pct }: { pct: number }) {
  return (
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
  );
}

const PRESETS = [25, 50, 100, 200];

export function BudgetSlider({ value, onChange, minValue, onMinChange, min, max, step }: Props) {
  const toPct = (v: number) => ((v - min) / (max - min)) * 100;
  const pct = toPct(value);
  const ranged = typeof minValue === "number" && !!onMinChange;
  const floor = ranged ? Math.min(minValue, value - step) : min;
  const floorPct = toPct(floor);
  const hasFloor = ranged && floor > min;
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
          {hasFloor ? `$${floor}\u2013$${value}` : `$${value}`}
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
            left: `${floorPct}%`,
            width: `${pct - floorPct}%`,
            height: 8,
            borderRadius: 4,
            background: "linear-gradient(90deg, #FFD074 0%, #FF8C71 50%, #C4477E 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px -1px rgba(180,40,35,0.4)",
          }}
        />
        {ranged && <style>{RANGE_CSS}</style>}
        {ranged && (
          <input
            type="range"
            className="gp-range"
            aria-label="Minimum budget"
            min={min}
            max={max}
            step={step}
            value={floor}
            onChange={(e) => onMinChange!(Math.min(Number(e.target.value), value - step))}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0 }}
          />
        )}
        <input
          type="range"
          className={ranged ? "gp-range" : undefined}
          aria-label={ranged ? "Maximum budget" : "Budget"}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Math.max(Number(e.target.value), ranged ? floor + step : min))}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: ranged ? undefined : "pointer" }}
        />
        {ranged && <Thumb pct={floorPct} />}
        <Thumb pct={pct} />
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
            onClick={() => {
              onChange(v);
              if (ranged && floor >= v) onMinChange!(min);
            }}
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
