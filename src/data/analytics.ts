/**
 * Thin wrapper around GA4's gtag.js. All custom event tracking goes
 * through `track()` so it no-ops cleanly when gtag is missing (ad
 * blocker, dev with no network, SSR, etc.) and we never throw if the
 * analytics layer hiccups.
 *
 * Event names use snake_case per GA4 convention. Param values are
 * limited to JSON primitives — GA4 ignores nested objects.
 *
 * See index.html for the tag install. Pageview tracking is manual
 * (`send_page_view: false` on the config call) so SPA route changes
 * fire consistently regardless of the GA4 admin's Enhanced Measurement
 * settings — see `pageview()` below + the effect in App.tsx.
 */

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
    // Analytics failure must never bubble up — silently swallow.
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
