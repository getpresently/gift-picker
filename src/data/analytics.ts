/**
 * Thin wrapper around GA4's gtag.js. All custom event tracking goes
 * through `track()` so it no-ops cleanly when gtag is missing (ad
 * blocker, dev with no network, SSR, etc.) and we never throw if the
 * analytics layer hiccups.
 *
 * Event names use snake_case per GA4 convention. Param values are
 * limited to JSON primitives, GA4 ignores nested objects.
 *
 * See index.html for the tag install. Pageview tracking is manual
 * (`send_page_view: false` on the config call) so SPA route changes
 * fire consistently regardless of the GA4 admin's Enhanced Measurement
 * settings, see `pageview()` below + the effect in App.tsx.
 */

import type { Answers } from "./questions";

type GtagCommand = "event" | "config" | "set" | "js";
type GtagFn = (command: GtagCommand, target: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

export type TrackParams = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, params?: TrackParams): void {
  if (typeof window === "undefined") return;
  const gtag = window.gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("event", event, params ?? {});
  } catch {
    // Analytics failure must never bubble up, silently swallow.
  }
}

/**
 * Manual page_view event. Fire on every route change including the
 * initial mount; the config call in index.html sets
 * `send_page_view: false` so this is the single source of truth.
 */
export function pageview(path: string, title?: string): void {
  track("page_view", {
    page_path: path,
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    page_title: title ?? (typeof document !== "undefined" ? document.title : undefined),
  });
}

/** Buckets for the results_view event's results_band parameter (few values, so GA can report them). */
export const RESULTS_BANDS = ["none", "under 8", "8 to 19", "20 plus"] as const;
export type ResultsBand = (typeof RESULTS_BANDS)[number];

export function resultsBand(count: number): ResultsBand {
  if (count <= 0) return "none";
  if (count < 8) return "under 8";
  if (count < 20) return "8 to 19";
  return "20 plus";
}

/** Buckets for the budget_band parameter on share events (few values, so GA can report them). */
export const BUDGET_BANDS = ["under 50", "50 to 99", "100 to 249", "250 plus"] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number];

export function budgetBand(budget: number | undefined): BudgetBand | undefined {
  if (typeof budget !== "number" || !Number.isFinite(budget)) return undefined;
  if (budget < 50) return "under 50";
  if (budget < 100) return "50 to 99";
  if (budget < 250) return "100 to 249";
  return "250 plus";
}

/**
 * The shape of a search, for share events: answer codes, counts, and the
 * budget band. A typed "Other" occasion reports as "other"; free text never
 * goes to GA.
 */
export function searchShape(a: Answers): TrackParams {
  return {
    recipient: a.recipient,
    occasion: a.occasion,
    age: a.age,
    interests_count: a.interests?.length ?? 0,
    budget_band: budgetBand(a.budget),
  };
}
