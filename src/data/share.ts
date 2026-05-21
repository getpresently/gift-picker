import type { Answers } from "./questions";
import { saveAnswers } from "./questions";

/**
 * Share-link encoding. We pack the quiz answers into short URL params
 * (r/a/o/i/v/b) so a recipient lands on /results and sees the same picks
 * — assuming the gift database hasn't shifted underneath them.
 *
 * URL shape: /results?r=partner&a=adult&o=bday&i=cooking,home,food&v=sentimental&b=150
 */

export function encodeAnswers(answers: Answers): string {
  const params = new URLSearchParams();
  if (answers.recipient) params.set("r", answers.recipient);
  if (answers.age) params.set("a", answers.age);
  if (answers.occasion) params.set("o", answers.occasion);
  if (answers.interests?.length) params.set("i", answers.interests.join(","));
  if (answers.vibe?.length) params.set("v", answers.vibe.join(","));
  if (typeof answers.budget === "number") params.set("b", String(answers.budget));
  return params.toString();
}

export function decodeAnswers(search: string): Answers | null {
  const params = new URLSearchParams(search);
  const out: Answers = {};
  const r = params.get("r"); if (r) out.recipient = r;
  const a = params.get("a"); if (a) out.age = a;
  const o = params.get("o"); if (o) out.occasion = o;
  const i = params.get("i"); if (i) out.interests = i.split(",").filter(Boolean);
  const v = params.get("v"); if (v) out.vibe = v.split(",").filter(Boolean);
  const b = params.get("b");
  if (b !== null && b !== "") {
    const n = Number(b);
    if (Number.isFinite(n)) out.budget = n;
  }
  return Object.keys(out).length ? out : null;
}

export function buildShareUrl(answers: Answers): string {
  const qs = encodeAnswers(answers);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/results${qs ? `?${qs}` : ""}`;
}

/**
 * If sessionStorage is empty and the current URL has share params, hydrate
 * the answers from those params and persist them. Returns the hydrated
 * answers (or null if there was nothing to hydrate).
 */
export function hydrateAnswersFromShareUrl(): Answers | null {
  if (typeof window === "undefined") return null;
  const fromUrl = decodeAnswers(window.location.search);
  if (!fromUrl) return null;
  saveAnswers(fromUrl);
  return fromUrl;
}

/**
 * Try to share via the native share sheet (mobile); fall back to clipboard.
 * Returns true if anything succeeded.
 */
export async function shareOrCopy(url: string, title = "My GiftPicker picks"): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({ title, url });
      return "shared";
    } catch {
      // user cancelled or share not allowed — try clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
