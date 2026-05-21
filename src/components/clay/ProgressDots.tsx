type Props = { total: number; step: number };

export function ProgressDots({ total, step }: Props) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? 28 : 8,
            height: 8,
            borderRadius: 4,
            background:
              i <= step
                ? "linear-gradient(180deg, #FF8C71, #E64B45)"
                : "rgba(35,20,16,0.12)",
            boxShadow:
              i <= step
                ? "inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 6px -2px rgba(180,40,35,0.4)"
                : "none",
            transition: "all 240ms cubic-bezier(.22,1.4,.4,1)",
          }}
        />
      ))}
    </div>
  );
}
