import { API_ENDPOINT } from "./giftsApi";
import { withRetry } from "./reviewApi";

export type Placement = "editorial" | "sponsored";

export type BrandSubmission = {
  placement: Placement;
  brand: string;
  contactName: string;
  email: string;
  website: string;
  product: string;
  productUrl: string;
  price: string;
  giftFor: string;
  notes: string;
};

export type BrandResult = { ok: true } | { ok: false; error: "endpoint_missing" | "invalid" | "network" };

export const BRAND_EMAIL = "hello@giftpicker.io";

/**
 * Brand submissions land in the "Brands" tab via the Apps Script. Unlike the
 * fire-and-forget feedback posts, this reads the reply: a brand that pays us
 * attention should never see a success message for a row that wasn't written.
 * A string body keeps it a CORS "simple request" (no preflight).
 */
export async function submitBrand(s: BrandSubmission): Promise<BrandResult> {
  let json: unknown;
  try {
    const body = JSON.stringify({ type: "brand", at: new Date().toISOString(), ...s });
    json = await withRetry(() => fetch(API_ENDPOINT, { method: "POST", body }).then((res) => res.json()), 3);
  } catch {
    return { ok: false, error: "network" };
  }
  const obj = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  if (obj.ok === true) return { ok: true };
  if (typeof obj.error === "string" && obj.error.startsWith("Unknown type")) return { ok: false, error: "endpoint_missing" };
  if (obj.error === "invalid") return { ok: false, error: "invalid" };
  return { ok: false, error: "network" };
}

/** Pre-filled email with everything they typed, for when the form can't send. */
export function brandMailto(s: BrandSubmission): string {
  const lines = [
    `Placement: ${s.placement === "sponsored" ? "Sponsored placement" : "Editorial review"}`,
    `Brand: ${s.brand}`,
    `Contact: ${s.contactName} <${s.email}>`,
    s.website && `Website: ${s.website}`,
    `Product: ${s.product}`,
    `Link: ${s.productUrl}`,
    `Price: ${s.price}`,
    s.giftFor && `Great gift for: ${s.giftFor}`,
    s.notes && `Notes: ${s.notes}`,
  ].filter(Boolean);
  const subject = `Gift submission: ${s.product || s.brand}`;
  return `mailto:${BRAND_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}
