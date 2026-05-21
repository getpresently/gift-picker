import type { Answers } from "./questions";

/**
 * Clean, code-side Gift model.
 *
 * The underlying Google Sheet uses messy column names (Gift, PriceActual,
 * PhotoAddress, etc.). The adapter in src/data/giftsApi.ts maps those into
 * these clean field names; the rest of the codebase only sees this shape.
 */
export type Gift = {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  image: string;
  link: string;
  ages: string[];
  types: string[];
  interests: string[];
  relations: string[];
  priceBuckets: string[];
  status: string;
};

/* ------------------------------------------------------------------ *
 * Quiz-answer code -> the label strings expected in the sheet column.
 * Each code maps to a list of candidate strings; a gift matches if ANY
 * candidate is found (case- & punctuation-insensitive) in its column.
 *
 * If a candidate list is empty, that quiz choice doesn't yet exist in
 * the DB — those answers won't filter anything in / boost anything.
 * ------------------------------------------------------------------ */

export const AGE_LABELS: Record<NonNullable<Answers["age"]>, string[]> = {
  kid: ["Baby / New Parent", "Child"],
  teen: ["Teen"],
  twenty: ["Young Adult"],
  adult: ["Adult"],
  senior: ["Senior"],
};

export const INTEREST_LABELS: Record<string, string[]> = {
  best: ["Best Sellers", "Best Seller"],
  apparel: ["Apparel & Accessories"],
  cooking: ["Cooking"],
  creative: ["Creativity"],
  exp: ["Experiences"],
  fitness: ["Fitness"],
  food: ["Food & Drinks", "Food & Beverage"],
  gaming: [], // no DB rows tagged "Gaming" yet
  wellness: ["Health & Wellness"],
  home: ["Home & Decor", "Decor"],
  learn: ["Learning"],
  music: ["Music"],
  outdoors: ["Nature & Outdoors"],
  organize: ["Organization"],
  personal: ["Personalization"],
  pets: ["Pets"],
  rest: ["Rest & Relaxation"],
  seasonal: ["Seasonal Gifts"],
  selfcare: ["Self-Care & Beauty"],
  sustain: ["Sustainability"],
  tech: ["Tech & Electronics", "Tech"],
  toys: ["Toys & Games"],
  travel: ["Travel"],
};

export const VIBE_LABELS: Record<string, string[]> = {
  fun: ["Fun"],
  practical: ["Practical"],
  sentimental: ["Sentimental"],
  luxurious: [], // no DB rows tagged "Luxurious" yet
  adventurous: [], // no DB rows tagged "Adventurous" yet
};

export const RECIPIENT_LABELS: Record<string, string[]> = {
  partner: ["Significant Other"],
  parent: ["Family"],
  grandparent: ["Family"],
  friend: ["Friend"],
  sibling: ["Family"],
  coworker: ["Colleague"],
  mentor: ["Mentor/Teacher", "Teacher/Mentor", "Teacher"],
  self: [], // no filter
};

/* ------------------------------------------------------------------ *
 * Tolerant string matching: lowercase + strip everything non-alphanumeric.
 * Catches case variants and most light typos ("Self-care" vs "Self-Care",
 * "Best Seller" vs "Best Sellers"). Does NOT catch deeper misspellings
 * like "Signigicant Other" — those are flagged for DB cleanup separately.
 * ------------------------------------------------------------------ */

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchCount(haystack: string[], candidates: string[]): number {
  if (!candidates.length || !haystack.length) return 0;
  const hay = haystack.map(normalize);
  let hits = 0;
  for (const c of candidates) {
    const nc = normalize(c);
    if (!nc) continue;
    if (hay.some((h) => h === nc || h.includes(nc) || nc.includes(h))) hits++;
  }
  return hits;
}

/**
 * Score one gift against the quiz answers.
 *
 * Mandatory (return -1 if any fail):
 *   - status === "Live"
 *   - price <= budget (if both known)
 *   - age bracket overlaps (if user picked an age)
 *
 * Weighted score (higher is better):
 *   - interest overlap     × 5
 *   - recipient -> Relation × 3
 *   - vibe -> Type         × 2
 */
export function scoreGift(gift: Gift, answers: Answers): number {
  if (gift.status && gift.status.trim() !== "Live") return -1;

  if (
    typeof answers.budget === "number" &&
    Number.isFinite(gift.price) &&
    gift.price > 0 &&
    gift.price > answers.budget
  ) {
    return -1;
  }

  if (answers.age) {
    const wanted = AGE_LABELS[answers.age];
    if (gift.ages.length > 0 && matchCount(gift.ages, wanted) === 0) return -1;
  }

  let score = 0;

  if (answers.interests?.length) {
    const labels = answers.interests.flatMap((v) => INTEREST_LABELS[v] ?? []);
    score += matchCount(gift.interests, labels) * 5;
  }

  if (answers.recipient && RECIPIENT_LABELS[answers.recipient]?.length) {
    score += matchCount(gift.relations, RECIPIENT_LABELS[answers.recipient]) * 3;
  }

  if (answers.vibe?.length) {
    const labels = answers.vibe.flatMap((v) => VIBE_LABELS[v] ?? []);
    score += matchCount(gift.types, labels) * 2;
  }

  return score;
}

/** Rank gifts by score; drop sub-zero (mandatory-failed) ones. Returns top N. */
export function rankGifts(gifts: Gift[], answers: Answers, take = 6): Gift[] {
  return gifts
    .map<[Gift, number]>((g) => [g, scoreGift(g, answers)])
    .filter(([, s]) => s >= 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([g]) => g);
}

/** Rotating tint palette for the 5 secondary cards (hero is always plum). */
export const SECONDARY_TONES = ["butter", "rose", "sage", "cream", "plum"] as const;
