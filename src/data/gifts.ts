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
  priceLabel: string; // formatted, e.g. "$16", "$16/mo", "$58–$295", "$123+"
  isMonthly: boolean;
  /** Populated when the gift is a recurring subscription. */
  subscription?: {
    monthly: number;
    /** Future field: alternate billing plans (e.g. 6mo, 12mo) — not in DB today. */
    plans?: { months: number; total: number }[];
  };
  image: string;
  link: string;
  ages: string[];
  types: string[];
  interests: string[];
  relations: string[];
  occasions: string[];
  priceBuckets: string[]; // canonical: one of the BUDGET_BUCKETS strings
  status: string;
};

/** A gift with its computed match score attached (0–100). */
export type RankedGift = Gift & { matchScore: number };

/* ------------------------------------------------------------------ *
 * Quiz-answer code -> the label strings expected in the sheet column.
 * Each code maps to a list of candidate strings; a gift matches if ANY
 * candidate is found (case- & punctuation-insensitive) in its column.
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
  gaming: ["Gaming"],
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
  luxurious: ["Luxurious"],
  adventurous: ["Adventurous"],
};

export const RECIPIENT_LABELS: Record<string, string[]> = {
  partner: ["Significant Other"],
  parent: ["Family"],
  grandparent: ["Family"],
  friend: ["Friend"],
  sibling: ["Family"],
  coworker: ["Colleague"],
  mentor: ["Mentor/Teacher", "Teacher/Mentor", "Teacher"],
  self: [], // matches any relation (handled specially in score)
};

export const OCCASION_LABELS: Record<string, string> = {
  bday: "Birthday",
  anni: "Anniversary",
  holi: "Holiday",
  wed: "Wedding",
  jb: "Just because",
  baby: "New parent",
};

/* ------------------------------------------------------------------ *
 * Budget buckets — canonical strings (matching the sheet's Price column)
 * ordered low → high. User's numeric budget maps into one of these.
 * ------------------------------------------------------------------ */

export const BUDGET_BUCKETS = [
  "Under $50",
  "$50-$100",
  "$100-$250",
  "Over $250",
] as const;

export type BudgetBucket = (typeof BUDGET_BUCKETS)[number];

/** Map a numeric budget value to its bucket index (0 = Under $50 ... 3 = Over $250). */
export function budgetBucketIndex(amount: number): number {
  if (amount < 50) return 0;
  if (amount < 100) return 1;
  if (amount < 250) return 2;
  return 3;
}

/** Map a sheet bucket string to its index. Accepts variants like "$50-100" (no second $). */
export function bucketStringIndex(raw: string): number | null {
  const n = normalize(raw);
  if (n.includes("under") && n.includes("50")) return 0;
  if (n.includes("over") && n.includes("250")) return 3;
  if (n.includes("50") && n.includes("100")) return 1;
  if (n.includes("100") && n.includes("250")) return 2;
  return null;
}

/* ------------------------------------------------------------------ *
 * Tolerant string matching: lowercase + strip everything non-alphanumeric.
 * ------------------------------------------------------------------ */

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tolerantIncludes(haystack: string[], candidate: string): boolean {
  if (!candidate || !haystack.length) return false;
  const nc = normalize(candidate);
  if (!nc) return false;
  return haystack.some((h) => {
    const nh = normalize(h);
    return nh === nc || nh.includes(nc) || nc.includes(nh);
  });
}

function matchCount(haystack: string[], candidates: string[]): number {
  let hits = 0;
  for (const c of candidates) {
    if (tolerantIncludes(haystack, c)) hits++;
  }
  return hits;
}

/* ------------------------------------------------------------------ *
 * Score components per spec — total budget = 100 pts.
 *   Relation 30  ·  Age 20  ·  Budget 15  ·  Interests 15  ·  Vibe 10
 *   Occasion ±10/±15 adjustment (applied last, score floored at 0)
 * ------------------------------------------------------------------ */

function scoreRelation(gift: Gift, answers: Answers): number {
  if (!answers.recipient) return 0;
  if (answers.recipient === "self") {
    // "Treat myself" — matches any gift that has any Relation tag at all
    return gift.relations.length > 0 ? 30 : 0;
  }
  const wanted = RECIPIENT_LABELS[answers.recipient] ?? [];
  if (!wanted.length) return 0;
  return matchCount(gift.relations, wanted) > 0 ? 30 : 0;
}

function scoreAge(gift: Gift, answers: Answers): number {
  const wanted = new Set<string>();
  if (answers.age) {
    for (const lbl of AGE_LABELS[answers.age]) wanted.add(lbl);
  }
  // "New parent" occasion also implies baby-relevant Age tag is a match
  if (answers.occasion === "baby") {
    wanted.add("Baby / New Parent");
  }
  if (!wanted.size) return 0;
  return matchCount(gift.ages, [...wanted]) > 0 ? 20 : 0;
}

function scoreBudget(gift: Gift, answers: Answers): number {
  if (typeof answers.budget !== "number") return 0;
  const userIdx = budgetBucketIndex(answers.budget);
  // Try to find ANY bucket-shaped value in the gift's Price column
  let bestDistance: number | null = null;
  for (const raw of gift.priceBuckets) {
    const idx = bucketStringIndex(raw);
    if (idx === null) continue;
    const d = Math.abs(userIdx - idx);
    if (bestDistance === null || d < bestDistance) bestDistance = d;
  }
  if (bestDistance === null) return 0;
  if (bestDistance === 0) return 15;
  if (bestDistance === 1) return 8;
  return 0;
}

function scoreInterests(gift: Gift, answers: Answers): number {
  const userPicks = answers.interests ?? [];
  if (!userPicks.length) return 0;
  // Count: how many of the user's N picks have at least one matching label in the gift
  let hits = 0;
  for (const v of userPicks) {
    const labels = INTEREST_LABELS[v] ?? [];
    if (matchCount(gift.interests, labels) > 0) hits++;
  }
  if (!hits) return 0;
  // Pro-rate to 15 pts max; round to nearest integer.
  return Math.round((hits / userPicks.length) * 15);
}

function scoreVibe(gift: Gift, answers: Answers): number {
  const userPicks = answers.vibe ?? [];
  if (!userPicks.length) return 0;
  let hits = 0;
  for (const v of userPicks) {
    const labels = VIBE_LABELS[v] ?? [];
    if (matchCount(gift.types, labels) > 0) hits++;
  }
  if (!hits) return 0;
  return Math.round((hits / userPicks.length) * 10);
}

/**
 * Occasion adjustment — only applied when the gift is tagged for the user's
 * occasion in the Occasions column. Each occasion has its own bonus/penalty
 * rules per the spec (see Question 2's README). Returns positive (bonus) or
 * negative (penalty) integer points.
 */
function scoreOccasionAdjustment(gift: Gift, answers: Answers): number {
  const occCode = answers.occasion;
  if (!occCode) return 0;
  const occLabel = OCCASION_LABELS[occCode];
  if (!occLabel) return 0;
  // If the gift isn't tagged for this occasion (column empty or doesn't include
  // the user's pick), skip occasion scoring for this gift entirely.
  if (!gift.occasions.length) return 0;
  if (!tolerantIncludes(gift.occasions, occLabel)) return 0;

  switch (occLabel) {
    case "Birthday": {
      // +10 if interests match well (any overlap with user's selected interests)
      const wanted = (answers.interests ?? []).flatMap((v) => INTEREST_LABELS[v] ?? []);
      return matchCount(gift.interests, wanted) > 0 ? 10 : 0;
    }
    case "Anniversary": {
      // +10 if gift.types includes Sentimental or Luxurious
      // −10 if gift.types contains ONLY Practical/Fun (nothing else)
      const hasSentLux = gift.types.some(
        (t) => tolerantIncludes([t], "Sentimental") || tolerantIncludes([t], "Luxurious"),
      );
      if (hasSentLux) return 10;
      const onlyPracFun =
        gift.types.length > 0 &&
        gift.types.every((t) => tolerantIncludes([t], "Practical") || tolerantIncludes([t], "Fun"));
      return onlyPracFun ? -10 : 0;
    }
    case "Holiday": {
      // +10 if gift.relations matches the user's recipient
      if (!answers.recipient) return 0;
      if (answers.recipient === "self") return gift.relations.length > 0 ? 10 : 0;
      const wanted = RECIPIENT_LABELS[answers.recipient] ?? [];
      return matchCount(gift.relations, wanted) > 0 ? 10 : 0;
    }
    case "Wedding": {
      // +10 if gift.interests has Home & Decor / Experiences / Personalization
      // −15 if gift.interests has Gaming / Tech & Electronics / Fitness
      const positive = ["Home & Decor", "Experiences", "Personalization"];
      const negative = ["Gaming", "Tech & Electronics", "Fitness"];
      let adj = 0;
      if (positive.some((p) => tolerantIncludes(gift.interests, p))) adj += 10;
      if (negative.some((p) => tolerantIncludes(gift.interests, p))) adj -= 15;
      return adj;
    }
    case "Just because": {
      // +10 if gift.types includes Fun; −5 if gift.types includes Luxurious
      let adj = 0;
      if (tolerantIncludes(gift.types, "Fun")) adj += 10;
      if (tolerantIncludes(gift.types, "Luxurious")) adj -= 5;
      return adj;
    }
    case "New parent": {
      // +10 if gift.ages includes Baby / New Parent
      // −10 if gift has NO baby-relevant age tags
      const babyRelevant = ["Baby / New Parent", "Child"];
      const hasBaby = babyRelevant.some((b) => tolerantIncludes(gift.ages, b));
      return hasBaby ? 10 : -10;
    }
  }
  return 0;
}

/** Total 0–100 score for one gift. */
export function scoreGift(gift: Gift, answers: Answers): number {
  // Hard filter: only Live gifts get scored
  if (gift.status && gift.status.trim() !== "Live") return -1;

  const base =
    scoreRelation(gift, answers) +
    scoreAge(gift, answers) +
    scoreBudget(gift, answers) +
    scoreInterests(gift, answers) +
    scoreVibe(gift, answers);

  const occAdj = scoreOccasionAdjustment(gift, answers);
  const total = base + occAdj;
  return Math.max(0, Math.min(100, total));
}

/* ------------------------------------------------------------------ *
 * Tiebreakers: 1) more interest matches first, 2) Best Sellers boost
 * ------------------------------------------------------------------ */

function interestMatchCount(gift: Gift, answers: Answers): number {
  const picks = answers.interests ?? [];
  let hits = 0;
  for (const v of picks) {
    const labels = INTEREST_LABELS[v] ?? [];
    if (matchCount(gift.interests, labels) > 0) hits++;
  }
  return hits;
}

function isBestSeller(gift: Gift): boolean {
  return tolerantIncludes(gift.interests, "Best Sellers") || tolerantIncludes(gift.interests, "Best Seller");
}

/**
 * Rank gifts. Returns up to `take` (default 20) sorted by score desc with
 * tiebreakers. Threshold floor: prefer scores ≥40; if fewer than 5 clear that,
 * relax to ≥20; if still none, return everything ≥0.
 *
 * Each returned gift carries its 0–100 `matchScore` for display in the UI.
 */
export function rankGifts(gifts: Gift[], answers: Answers, take = 20): RankedGift[] {
  type Scored = { gift: Gift; score: number; interestHits: number; bestSeller: boolean };
  const scored: Scored[] = gifts
    .map((g) => ({
      gift: g,
      score: scoreGift(g, answers),
      interestHits: interestMatchCount(g, answers),
      bestSeller: isBestSeller(g),
    }))
    .filter((s) => s.score >= 0);

  const compare = (a: Scored, b: Scored) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.interestHits !== a.interestHits) return b.interestHits - a.interestHits;
    if (a.bestSeller !== b.bestSeller) return a.bestSeller ? -1 : 1;
    return 0;
  };

  const finalize = (list: Scored[]): RankedGift[] =>
    list
      .sort(compare)
      .slice(0, take)
      .map((s) => ({ ...s.gift, matchScore: s.score }));

  // Try strict threshold first; relax if too few clear it.
  const thresholds = [40, 20, 0];
  for (const t of thresholds) {
    const passing = scored.filter((s) => s.score >= t);
    if (passing.length >= 5 || t === 0) return finalize(passing);
  }
  return finalize(scored);
}

/** Rotating tint palette for secondary cards (hero is always plum). */
export const SECONDARY_TONES = ["butter", "rose", "sage", "cream", "plum"] as const;

/**
 * Build the "Why we picked this" bullets shown in the product modal.
 * Each line is derived from real answer/gift data — no placeholder copy.
 */
export function buildMatchReasons(gift: Gift, answers: Answers): string[] {
  const lc = (s: string) => s.toLowerCase();
  const bullets: string[] = [];

  if (typeof answers.budget === "number") {
    bullets.push(`Lands inside your $${answers.budget} budget`);
  }
  if (gift.brand) {
    bullets.push(`From ${gift.brand}`);
  }

  const matchedVibes = (answers.vibe ?? [])
    .flatMap((v) => VIBE_LABELS[v] ?? [])
    .filter((label) => gift.types.some((t) => lc(t).includes(lc(label)) || lc(label).includes(lc(t))));
  if (matchedVibes.length) {
    bullets.push(`A ${matchedVibes.join(", ").toLowerCase()} fit`);
  }

  const matchedInterests = (answers.interests ?? [])
    .flatMap((v) => INTEREST_LABELS[v] ?? [])
    .filter((label) => gift.interests.some((i) => lc(i).includes(lc(label)) || lc(label).includes(lc(i))));
  if (matchedInterests.length) {
    bullets.push(matchedInterests.slice(0, 2).join(" · "));
  }

  return bullets.slice(0, 4);
}
