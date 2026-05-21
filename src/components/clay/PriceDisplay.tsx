import type { Gift } from "../../data/gifts";

type Variant = "card" | "hero" | "modal";

type Props = {
  gift: Gift;
  variant?: Variant;
  /** Use light text colors (for dark hero/modal surfaces). */
  invert?: boolean;
};

const SERIF_SIZE: Record<Variant, number> = {
  card: 20,
  modal: 36,
  hero: 44,
};

const SUFFIX_SIZE: Record<Variant, number> = {
  card: 13,
  modal: 15,
  hero: 16,
};

const ALT_PLAN_SIZE: Record<Variant, number> = {
  card: 12,
  modal: 13,
  hero: 14,
};

export function PriceDisplay({ gift, variant = "card", invert = false }: Props) {
  const headingColor = invert ? "#FFF8EE" : "#231410";
  const dimColor = invert ? "rgba(255,248,238,0.65)" : "rgba(35,20,16,0.55)";

  // Subscription path — primary $X /mo + optional alternate plan
  if (gift.subscription) {
    const monthly = gift.subscription.monthly;
    const plans = gift.subscription.plans ?? [];
    // Prefer the 6-month plan if present, otherwise the longest plan available
    const altPlan =
      plans.find((p) => p.months === 6) ??
      (plans.length ? plans.reduce((longest, p) => (p.months > longest.months ? p : longest), plans[0]) : null);

    return (
      <div style={{ display: "inline-flex", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <span
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: SERIF_SIZE[variant],
            letterSpacing: "-0.02em",
            color: headingColor,
            lineHeight: 1,
          }}
        >
          ${formatMoney(monthly)}
        </span>
        <span
          style={{
            fontFamily: "Geist, sans-serif",
            fontSize: SUFFIX_SIZE[variant],
            color: dimColor,
            lineHeight: 1,
          }}
        >
          /mo
        </span>
        {variant !== "card" && altPlan && (
          <span
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: ALT_PLAN_SIZE[variant],
              color: dimColor,
              lineHeight: 1,
              marginLeft: 4,
            }}
          >
            or ${formatMoney(altPlan.total)} / {altPlan.months} mo
          </span>
        )}
      </div>
    );
  }

  // One-shot path — uses priceLabel so we preserve ranges ("$58–$295") and "+" suffixes
  return (
    <span
      style={{
        fontFamily: '"Instrument Serif", serif',
        fontSize: SERIF_SIZE[variant],
        letterSpacing: "-0.02em",
        color: headingColor,
        lineHeight: 1,
      }}
    >
      {gift.priceLabel || "—"}
    </span>
  );
}

function formatMoney(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}
