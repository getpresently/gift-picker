import { useEffect, useState } from "react";
import type { Gift } from "./gifts";

/**
 * Live gift database (Google Sheet, exposed via nocodeapi).
 * The sheet currently uses column names: row_id, Gift, Brand, Description,
 * Age, Type, Interests, Relation, Occasions (or Occasion), Price (bucket),
 * PriceActual ("$80" or "$16/mo"), PriceDisplay, PhotoAddress, Link, Status.
 * We adapt those to the clean Gift shape used everywhere in code.
 */
const GIFTS_URL =
  "https://v1.nocodeapi.com/qlangstaff/google_sheets/WmiYFvgDSyDXhouR?tabId=Gifts";

type RawRow = Record<string, string | number | undefined>;

function splitCsv(raw: string | number | undefined): string[] {
  if (raw === undefined || raw === null) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Format a number for display: drop trailing .00 on whole-dollar values. */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Parse a price cell. Handles a few real shapes in the sheet:
 *   "$80"         → $80, one-time
 *   "$16/mo"      → $16/mo, monthly
 *   "$58-295"     → $58–$295 range
 *   "$123.38 +"   → $123+, "starts from" pricing
 *
 * Returns the LOW numeric value (used for budget-bucket fallback derivation)
 * plus a human-readable label preserving range / + / /mo semantics.
 */
function parsePriceCell(raw: string | number | undefined): {
  price: number;
  isMonthly: boolean;
  priceLabel: string;
} {
  if (raw === undefined || raw === null) {
    return { price: 0, isMonthly: false, priceLabel: "" };
  }
  const str = String(raw).trim();
  const isMonthly = /\/mo\b/i.test(str) || /\bmonth(ly)?\b/i.test(str);
  const isStartingAt = /\+\s*$/.test(str);

  const matches = str.match(/\d+(?:\.\d+)?/g) ?? [];
  const nums = matches.map(parseFloat).filter((n) => Number.isFinite(n));
  if (!nums.length) {
    return { price: 0, isMonthly, priceLabel: "" };
  }
  const low = nums[0];
  const high = nums.length > 1 ? nums[nums.length - 1] : null;

  let priceLabel: string;
  if (isMonthly) {
    priceLabel = `$${fmt(low)}/mo`;
  } else if (high !== null && high > low) {
    priceLabel = `$${fmt(low)}–$${fmt(high)}`;
  } else if (isStartingAt) {
    priceLabel = `$${fmt(low)}+`;
  } else {
    priceLabel = `$${fmt(low)}`;
  }

  return { price: low, isMonthly, priceLabel };
}

function adaptRow(row: RawRow): Gift {
  const { price, isMonthly, priceLabel } = parsePriceCell(row.PriceActual);
  // Support either column name — Dalia added it as "Occasions" but the
  // spec mapping is "Occasion"; try both.
  const occasionsRaw = (row.Occasions ?? row.Occasion) as string | undefined;
  return {
    id: String(row.row_id ?? row.rowId ?? row.id ?? ""),
    name: String(row.Gift ?? ""),
    brand: String(row.Brand ?? ""),
    description: String(row.Description ?? ""),
    price,
    priceLabel,
    isMonthly,
    image: String(row.PhotoAddress ?? ""),
    link: String(row.Link ?? ""),
    ages: splitCsv(row.Age as string | undefined),
    types: splitCsv(row.Type as string | undefined),
    interests: splitCsv(row.Interests as string | undefined),
    relations: splitCsv(row.Relation as string | undefined),
    occasions: splitCsv(occasionsRaw),
    priceBuckets: splitCsv(row.Price as string | undefined),
    status: String(row.Status ?? ""),
  };
}

type Result = { data: Gift[]; loading: boolean; error: string | null };

export function useGifts(): Result {
  const [state, setState] = useState<Result>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    fetch(GIFTS_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Gift API responded ${r.status}`);
        return r.json();
      })
      .then((payload: { data?: RawRow[] }) => {
        if (cancelled) return;
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setState({ data: rows.map(adaptRow), loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ data: [], loading: false, error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
