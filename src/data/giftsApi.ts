import { useEffect, useState } from "react";
import type { BillingPeriod, Gift } from "./gifts";

/**
 * Live gift database. Served by the same Google Apps Script web app
 * that receives feedback + requests (single endpoint for everything).
 *
 * Sheet shape (post the May-2026 schema change):
 *   row_id, Gift, Brand, Age, Relation, Type, Interests, Occasion,
 *   Price (numeric string lower bound), PriceMax (numeric / "$1,240" / "open" / ""),
 *   BillingPeriod ("one-time" | "monthly" | "weekly"), Description,
 *   PhotoAddress, Link, AmazonAltLink, Status, Feedback.
 *
 * The adapter maps that into the clean Gift shape used everywhere in code.
 */
export const API_ENDPOINT =
  (import.meta.env.VITE_GIFTS_ENDPOINT as string | undefined)?.trim() ||
  "https://script.google.com/macros/s/AKfycbwPuaXtXuurdqNg94_mGoOR1YHXqKrJyZrkxkt09oFbGGZtS_KdH44vhJNn4qLzeJqhuQ/exec";
const GIFTS_URL = `${API_ENDPOINT}?tab=Gifts`;
// Edge copy of the live rows, served by the Cloudflare worker from KV. The Apps
// Script can take several seconds, so it is only the fallback.
const EDGE_GIFTS_URL = "/api/gifts";

type RawRow = Record<string, string | number | undefined>;

function splitCsv(raw: string | number | undefined): string[] {
  if (raw === undefined || raw === null) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Format a number for display: drop trailing zeros, add thousands separator. */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Parse "$1,240" / "103" / "$80.50" → number; returns null for empty / "open" / unparseable. */
function parseMoney(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const str = String(raw).trim();
  if (!str) return null;
  if (str.toLowerCase() === "open") return null;
  const cleaned = str.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeBillingPeriod(raw: string | number | undefined): BillingPeriod {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "monthly") return "monthly";
  if (v === "weekly") return "weekly";
  return "one-time";
}

/** Build the display label per the schema-handoff spec. */
function buildPriceLabel(
  price: number,
  priceMax: number | null,
  priceOpen: boolean,
  billing: BillingPeriod,
  isYourChoice: boolean,
): string {
  if (isYourChoice) return "Your choice";
  if (price <= 0 && !priceMax && !priceOpen) return "";
  let base: string;
  if (priceOpen) base = `$${fmt(price)}+`;
  else if (priceMax !== null && priceMax > price) base = `$${fmt(price)}–$${fmt(priceMax)}`;
  else base = `$${fmt(price)}`;
  if (billing === "monthly") return `${base}/mo`;
  if (billing === "weekly") return `${base}/wk`;
  return base;
}

function normalizeGender(raw: string | number | undefined): "" | "men" | "women" {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "men" || v === "male" || v === "him") return "men";
  if (v === "women" || v === "female" || v === "her") return "women";
  return "";
}

export function adaptRow(row: RawRow): Gift {
  const priceRaw = row.Price;
  const isYourChoice = String(priceRaw ?? "").trim().toLowerCase() === "your choice";
  const price = isYourChoice ? 0 : parseMoney(priceRaw) ?? 0;
  const priceMaxRaw = String(row.PriceMax ?? "").trim();
  const priceOpen = priceMaxRaw.toLowerCase() === "open";
  const priceMax = priceOpen ? null : parseMoney(priceMaxRaw);
  const billingPeriod = normalizeBillingPeriod(row.BillingPeriod);
  const priceLabel = buildPriceLabel(price, priceMax, priceOpen, billingPeriod, isYourChoice);

  return {
    id: String(row.row_id ?? row.rowId ?? row.id ?? ""),
    name: String(row.Gift ?? ""),
    brand: String(row.Brand ?? ""),
    description: String(row.Description ?? ""),
    price,
    priceMax,
    priceOpen,
    isYourChoice,
    billingPeriod,
    priceLabel,
    image: String(row.PhotoAddress ?? ""),
    link: String(row.Link ?? ""),
    amazonLink: String(row.AmazonAltLink ?? "").trim(),
    ages: splitCsv(row.Age as string | undefined),
    types: splitCsv(row.Type as string | undefined),
    interests: splitCsv(row.Interests as string | undefined),
    primaryInterest: String(row["Primary interest"] ?? "").trim(),
    relations: splitCsv(row.Relation as string | undefined),
    occasions: splitCsv(row.Occasion as string | undefined),
    status: String(row.Status ?? ""),
    gender: normalizeGender(row.Gender),
  };
}

type Result = { data: Gift[]; loading: boolean; error: string | null };

async function fetchRows(): Promise<RawRow[]> {
  try {
    const r = await fetch(EDGE_GIFTS_URL);
    if (r.ok && (r.headers.get("content-type") ?? "").includes("application/json")) {
      const payload = (await r.json()) as { data?: RawRow[] };
      if (Array.isArray(payload?.data) && payload.data.length) return payload.data;
    }
  } catch {
    // fall through to the origin
  }
  const r = await fetch(GIFTS_URL);
  if (!r.ok) throw new Error(`Gift API responded ${r.status}`);
  const payload = (await r.json()) as { data?: RawRow[] };
  return Array.isArray(payload?.data) ? payload.data : [];
}

export function useGifts(): Result {
  const [state, setState] = useState<Result>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    fetchRows()
      .then((rows) => {
        if (!cancelled) setState({ data: rows.map(adaptRow), loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ data: [], loading: false, error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
