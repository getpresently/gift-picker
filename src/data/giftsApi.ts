import { useEffect, useState } from "react";
import type { Gift } from "./gifts";

/**
 * Live gift database (Google Sheet, exposed via nocodeapi).
 * The sheet currently uses column names: row_id, Gift, Brand, Description,
 * Age, Type, Interests, Price, PriceActual, PhotoAddress, Link, Status.
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

function parsePrice(raw: string | number | undefined): number {
  if (typeof raw === "number") return raw;
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function adaptRow(row: RawRow): Gift {
  return {
    id: String(row.row_id ?? row.rowId ?? row.id ?? ""),
    name: String(row.Gift ?? ""),
    brand: String(row.Brand ?? ""),
    description: String(row.Description ?? ""),
    price: parsePrice(row.PriceActual),
    image: String(row.PhotoAddress ?? ""),
    link: String(row.Link ?? ""),
    ages: splitCsv(row.Age as string | undefined),
    types: splitCsv(row.Type as string | undefined),
    interests: splitCsv(row.Interests as string | undefined),
    relations: splitCsv(row.Relation as string | undefined),
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
