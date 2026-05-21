import type { Answers } from "./questions";

/**
 * Clean, code-side Gift model.
 *
 * The underlying Google Sheet uses different naming (Gift, PhotoAddress, etc.).
 * The adapter in src/data/giftsApi.ts maps those into these clean field names;
 * the rest of the codebase only sees this shape.
 */
export type BillingPeriod = "one-time" | "monthly" | "weekly";

export type Gift = {
  id: string;
  name: string;
  brand: string;
  description: string;
  /** Lower-bound numeric price (0 when isYourChoice). */
  price: number;
  /** Upper-bound numeric price when the DB has a range; null otherwise. */
  priceMax: number | null;
  /** True when DB PriceMax === "open" — display as "$X+". */
  priceOpen: boolean;
  /** True when Price === "Your choice" (gift card style — matches any budget). */
  isYourChoice: boolean;
  billingPeriod: BillingPeriod;
  /** Pre-formatted display string ("$58–$295", "$16/mo", "Your choice", etc.). */
  priceLabel: string;
  image: string;
  link: string;
  /** Optional secondary purchase link — surfaces a "Buy on Amazon" CTA when set. */
  amazonLink: string;
  ages: string[];
  types: string[];
  interests: string[];
  relations: string[];
  occasions: string[];
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

/**
 * Ages a recipient *cannot* plausibly be. Used to hard-exclude gifts whose
 * age tag is incompatible with the chosen recipient — e.g. a "Chess for
 * Kids" tagged Age="Child" should not appear when shopping for a
 * grandparent, even if interests overlap. Activated only when the user
 * didn't pick an age explicitly (in which case the explicit choice rules).
 */
export const RECIPIENT_EXCLUDED_AGES: Record<string, string[]> = {
  partner: ["Baby / New Parent", "Child"],
  parent: ["Baby / New Parent", "Child"],
  grandparent: ["Baby / New Parent", "Child", "Teen", "Young Adult", "Adult"],
  coworker: ["Baby / New Parent", "Child"],
  mentor: ["Baby / New Parent", "Child"],
  self: ["Baby / New Parent", "Child"],
  friend: [],
  sibling: [],
};

export const OCCASION_LABELS: Record<string, string> = {
  bday: "Birthday",
  anni: "Anniversary",
  holi: "Holiday",
  wed: "Wedding",
  jb: "Just Because",
  baby: "New Baby",
  housewarm: "Housewarming",
  appreciate: "Appreciation",
  thank: "Thank You",
};

/* ------------------------------------------------------------------ *
 * Budget tiers — used only for scoring (gift catalog stores numeric Price now).
 * The user's slider value AND the gift's annualized lower-bound price both
 * map into one of these four tiers; tier-distance determines the score.
 * ------------------------------------------------------------------ */

/** Map a numeric dollar amount to its tier index (0 = Under $50 … 3 = Over $250). */
export function budgetTierIndex(amount: number): number {
  if (amount < 50) return 0;
  if (amount < 100) return 1;
  if (amount < 250) return 2;
  return 3;
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
 * Score components — totals to ~95 pts, plus an Occasion adjustment of
 * up to ±15 applied last. Score is clamped to [0, 100].
 *
 *   Relation 25  ·  Age 10  ·  Budget 10  ·  Interests 40  ·  Vibe 10
 *
 * Interests is intentionally the dominant signal: a user picking
 * "Fitness" should see fitness gifts — not just any gift that fits
 * their recipient + age bracket.
 * ------------------------------------------------------------------ */

function scoreRelation(gift: Gift, answers: Answers): number {
  if (!answers.recipient) return 0;
  if (answers.recipient === "self") {
    // "Treat myself" — matches any gift that has any Relation tag at all
    return gift.relations.length > 0 ? 25 : 0;
  }
  const wanted = RECIPIENT_LABELS[answers.recipient] ?? [];
  if (!wanted.length) return 0;
  return matchCount(gift.relations, wanted) > 0 ? 25 : 0;
}

function scoreAge(gift: Gift, answers: Answers): number {
  const wanted = new Set<string>();
  if (answers.age) {
    for (const lbl of AGE_LABELS[answers.age]) wanted.add(lbl);
  }
  // "New baby" occasion also implies baby-relevant Age tag is a match
  if (answers.occasion === "baby") {
    wanted.add("Baby / New Parent");
  }
  if (!wanted.size) return 0;
  return matchCount(gift.ages, [...wanted]) > 0 ? 10 : 0;
}

function scoreBudget(gift: Gift, answers: Answers): number {
  if (typeof answers.budget !== "number") return 0;
  // Gift Card "Your choice" matches any budget tier — full points.
  if (gift.isYourChoice) return 15;
  if (gift.price <= 0) return 0;

  // Use the gift's listed price as-is — a $49/mo subscription is a $49/mo
  // commitment from the user's POV and should bucket alongside one-shot
  // $49 gifts, not get annualized.
  const userIdx = budgetTierIndex(answers.budget);
  const giftIdx = budgetTierIndex(gift.price);
  const d = Math.abs(userIdx - giftIdx);
  if (d === 0) return 10;
  if (d === 1) return 5;
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
  // Pro-rate to 40 pts max — interests are the dominant signal.
  return Math.round((hits / userPicks.length) * 40);
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

/**
 * Multiplier on the user's stated budget at which we hard-exclude a gift.
 * $120 budget × 2 = $240 cap. Tuned to keep adjacent-tier gifts visible
 * while dropping clear over-budget outliers (e.g. a $400 gift for a $120
 * user). Applies to raw price — subscription amounts are evaluated at
 * their displayed periodic rate, not annualized.
 */
const BUDGET_CAP_MULTIPLIER = 2;

/**
 * Total 0–100 score for one gift. Returns -1 when the gift is excluded
 * outright; the caller drops those before ranking.
 *
 * Hard exclusions:
 *   - status !== "Live"
 *   - Wildly over budget (price > budget × BUDGET_CAP_MULTIPLIER)
 *   - Age mismatch when both sides specify (user picked an age AND gift
 *     has explicit age tags that don't overlap) — prevents e.g. shopping
 *     for a grandparent and being shown a child-tagged gift
 *
 * Weighted score (higher is better):
 *   - Relation match     25 (binary)
 *   - Age bracket match  10 (binary; "New baby" occasion implies baby tag)
 *   - Budget tier        10 same · 5 adjacent · 0 otherwise (raw price,
 *                          no subscription annualization — $49/mo is a
 *                          $49 commitment from the user's POV)
 *   - Interests          0–40 (pro-rated by hits/picks; dominant signal)
 *   - Vibe / Type        0–10 (pro-rated)
 *   - Occasion adjust    ±0 / ±5 / ±10 / ±15 (applied last, per occasion
 *                        bonus/penalty table; total clamped to [0, 100])
 */
export function scoreGift(gift: Gift, answers: Answers): number {
  // Hard filter: only Live gifts get scored
  if (gift.status && gift.status.trim() !== "Live") return -1;

  // Hard filter: way over budget. Skip for "Your choice" gift cards.
  if (
    typeof answers.budget === "number" &&
    !gift.isYourChoice &&
    gift.price > 0 &&
    gift.price > answers.budget * BUDGET_CAP_MULTIPLIER
  ) {
    return -1;
  }

  // Hard filter: age tags both specified, no overlap.
  if (gift.ages.length > 0) {
    if (answers.age) {
      // Explicit user age choice — gift must match one of the allowed labels.
      const wantedAges = new Set<string>(AGE_LABELS[answers.age]);
      if (answers.occasion === "baby") wantedAges.add("Baby / New Parent");
      if (matchCount(gift.ages, [...wantedAges]) === 0) return -1;
    } else if (answers.recipient && RECIPIENT_EXCLUDED_AGES[answers.recipient]?.length) {
      // No explicit age but the recipient implies one (e.g. grandparent =
      // Senior; partner != kid). Exclude when every gift age tag is on
      // the recipient's denied list.
      const denied = RECIPIENT_EXCLUDED_AGES[answers.recipient];
      const allDenied = gift.ages.every((ageTag) =>
        denied.some((d) => {
          const na = normalize(ageTag);
          const nd = normalize(d);
          return na === nd || na.includes(nd) || nd.includes(na);
        }),
      );
      if (allDenied) return -1;
    }
  }

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
 * Hard minimum match score. Below this we drop the gift rather than show
 * a mediocre suggestion — interests are 40 pts of the 100-pt total, so
 * anything below 60 likely failed to match the user's interest at all.
 * If fewer than 3 gifts clear this floor we relax to 45 (still a
 * "decent" match) before falling back to the EmptyState component.
 */
const MIN_MATCH_SCORE = 60;
const MIN_MATCH_SCORE_FALLBACK = 45;

/**
 * Rank gifts. Returns up to `take` (default 20) sorted by score desc with
 * tiebreakers, all of which must clear MIN_MATCH_SCORE (or the fallback
 * if the catalog returns too few). When nothing clears the fallback, an
 * empty array is returned — the UI shows its empty state.
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

  const above60 = scored.filter((s) => s.score >= MIN_MATCH_SCORE);
  if (above60.length >= 3) return finalize(above60);
  // Slightly relax when the catalog is sparse for this combination.
  const aboveFallback = scored.filter((s) => s.score >= MIN_MATCH_SCORE_FALLBACK);
  return finalize(aboveFallback);
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
