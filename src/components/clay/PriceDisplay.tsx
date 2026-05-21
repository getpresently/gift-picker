import type { BillingPeriod, Gift } from "../../data/gifts";

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

/** Format a number for display with thousands separators; drop trailing zeros. */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Amount portion: "Your choice", "$58–$295", "$123+", or "$80". */
function amountText(gift: Gift): string {
  if (gift.isYourChoice) return "Your choice";
  if (gift.price <= 0) return "—";
  if (gift.priceOpen) return `$${fmt(gift.price)}+`;
  if (gift.priceMax !== null && gift.priceMax > gift.price) {
    return `$${fmt(gift.price)}–$${fmt(gift.priceMax)}`;
  }
  return `$${fmt(gift.price)}`;
}

/** Period suffix shown next to the amount. */
function periodSuffix(billing: BillingPeriod): string | null {
  if (billing === "monthly") return "/mo";
  if (billing === "weekly") return "/wk";
  return null;
}

export function PriceDisplay({ gift, variant = "card", invert = false }: Props) {
  const headingColor = invert ? "#FFF8EE" : "#231410";
  const dimColor = invert ? "rgba(255,248,238,0.65)" : "rgba(35,20,16,0.55)";
  const amount = amountText(gift);
  const suffix = periodSuffix(gift.billingPeriod);

  return (
    <div style={{ display: "inline-flex", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
      <span
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: SERIF_SIZE[variant],
          letterSpacing: "-0.02em",
          color: headingColor,
          lineHeight: 1,
        }}
      >
        {amount}
      </span>
      {suffix && (
        <span
          style={{
            fontFamily: "Geist, sans-serif",
            fontSize: SUFFIX_SIZE[variant],
            color: dimColor,
            lineHeight: 1,
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
