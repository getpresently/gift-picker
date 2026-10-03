import type { Answers } from "./questions";
import { buildSimilarity, productType } from "./similarity";

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
  /** True when DB PriceMax === "open", display as "$X+". */
  priceOpen: boolean;
  /** True when Price === "Your choice" (gift card style, matches any budget). */
  isYourChoice: boolean;
  billingPeriod: BillingPeriod;
  /** Pre-formatted display string ("$58–$295", "$16/mo", "Your choice", etc.). */
  priceLabel: string;
  image: string;
  link: string;
  /** Optional secondary purchase link, surfaces a "Buy on Amazon" CTA when set. */
  amazonLink: string;
  ages: string[];
  types: string[];
  interests: string[];
  /**
   * The one interest that says what the gift is (sheet column "Primary
   * interest"). Matching it earns full interest credit; matching only one of
   * the other tags earns SECONDARY_INTEREST_WEIGHT. "" until assigned.
   */
  primaryInterest: string;
  relations: string[];
  occasions: string[];
  status: string;
  /** "" means the gift suits anyone; only clearly gendered products are tagged. */
  gender: "" | "men" | "women";
};

/** A gift with its computed match score attached (0–100). */
export type RankedGift = Gift & { matchScore: number };

/* ------------------------------------------------------------------ *
 * Quiz-answer code -> the label strings expected in the sheet column.
 * Each code maps to a list of candidate strings; a gift matches if ANY
 * candidate is found (case- & punctuation-insensitive) in its column.
 * ------------------------------------------------------------------ */

// Sheet vocabulary (Baby / Child / Teenager / Young Adult / Adult /
// Senior). Quiz now splits Baby and Child as separate tiers.
export const AGE_LABELS: Record<NonNullable<Answers["age"]>, string[]> = {
  baby:   ["Baby"],
  kid:    ["Child"],
  teen:   ["Teenager"],
  twenty: ["Young Adult"],
  adult:  ["Adult"],
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

// Sheet vocabulary: Fun / Practical / Sentimental / Luxurious.
// (Adventurous was retired and merged into Fun upstream.)
export const VIBE_LABELS: Record<string, string[]> = {
  fun:         ["Fun"],
  practical:   ["Practical"],
  sentimental: ["Sentimental"],
  luxurious:   ["Luxurious"],
};

// Sheet vocabulary: Partner / Parent / Grandparent / Sibling / Friend /
// Coworker / Mentor (sheet column literally reads "Mentor/Teacher", that
// string was not remapped in the 2026-05-24 migration).
export const RECIPIENT_LABELS: Record<string, string[]> = {
  partner:     ["Partner"],
  parent:      ["Parent"],
  grandparent: ["Grandparent"],
  friend:      ["Friend"],
  sibling:     ["Sibling"],
  coworker:    ["Coworker"],
  mentor:      ["Mentor/Teacher"],
  self:        [], // matches any relation (handled specially in score)
  // "Child" covers any kid in the shopper's life (their own, a niece or
  // nephew, a grandkid) at any age. Kids' gifts are tagged Friend and
  // Sibling by convention, so it matches those; the age answer does the rest.
  child:       ["Friend", "Sibling"],
};

/**
 * Ages a recipient *cannot* plausibly be. Used to hard-exclude gifts whose
 * age tag is incompatible with the chosen recipient, e.g. a "Chess for
 * Kids" tagged Age="Child" should not appear when shopping for a
 * grandparent, even if interests overlap. Activated only when the user
 * didn't pick an age explicitly (in which case the explicit choice rules).
 */
export const RECIPIENT_EXCLUDED_AGES: Record<string, string[]> = {
  // Your partner can be any age except a literal kid.
  partner: ["Baby", "Child"],
  // Your parent is at least an adult.
  parent: ["Baby", "Child", "Teenager", "Young Adult"],
  // Grandparents are seniors, the age question is skipped in the UI.
  grandparent: ["Baby", "Child", "Teenager", "Young Adult", "Adult"],
  // Coworkers and mentor-figures are at least young adults.
  coworker: ["Baby", "Child", "Teenager"],
  mentor: ["Baby", "Child", "Teenager"],
  // The user filling out the quiz isn't shopping for a literal child for
  // themselves. (They could be a teen, though, so don't exclude that.)
  self: ["Baby", "Child"],
  // Friends and siblings can be any age; a kid in your life is 17 or younger.
  friend: [],
  sibling: [],
  child: ["Young Adult", "Adult", "Senior"],
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
  newjob: "New Job",
};

/* ------------------------------------------------------------------ *
 * Budget tiers, used only for scoring (gift catalog stores numeric Price now).
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
 * Score components, totals to ~95 pts, plus an Occasion adjustment of
 * +10 to −15 applied last. Score is clamped to [0, 100].
 *
 *   Relation 25  ·  Age 10  ·  Budget 10  ·  Interests 40  ·  Vibe 10
 *
 * Interests is intentionally the dominant signal: a user picking
 * "Fitness" should see fitness gifts, not just any gift that fits
 * their recipient + age bracket. The occasion bonus is scaled by interest
 * coverage (see scoreOccasionAdjustment) so it can't undo that: a gift
 * matching more of the picked interests ranks higher unless it lacks the
 * recipient or age tag, runs over budget, takes an occasion penalty, or
 * misses both the vibe and the occasion tag.
 * ------------------------------------------------------------------ */

/** Credit for a pick that matches one of the gift's secondary interest tags. */
const SECONDARY_INTEREST_WEIGHT = 0.5;

/**
 * Weighted count of the user's picked interests the gift matches. A pick
 * that matches the gift's primary interest counts 1; a pick that matches
 * only a secondary tag counts SECONDARY_INTEREST_WEIGHT, so a beanie tagged
 * Self-Care & Beauty no longer ranks like a real self-care gift. "Best
 * Sellers" is a popularity flag rather than a category, so it counts in
 * full, and gifts with no primary assigned yet count every tag in full.
 */
function interestMatchCount(gift: Gift, answers: Answers): number {
  const picks = answers.interests ?? [];
  const primary = gift.primaryInterest ? [gift.primaryInterest] : [];
  let hits = 0;
  for (const v of picks) {
    const labels = INTEREST_LABELS[v] ?? [];
    if (primary.length && matchCount(primary, labels) > 0) hits += 1;
    else if (matchCount(gift.interests, labels) > 0) hits += !primary.length || v === "best" ? 1 : SECONDARY_INTEREST_WEIGHT;
  }
  return hits;
}

/** A gift tagged only Self is something people buy for themselves. */
const isSelfOnly = (gift: Gift) =>
  gift.relations.length > 0 && gift.relations.every((r) => tolerantIncludes([r], "Self"));

function scoreRelation(gift: Gift, answers: Answers): number {
  if (!answers.recipient) return 0;
  if (answers.recipient === "self") {
    // "Treat myself", matches any gift that has any Relation tag at all
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
  // "New baby" occasion also implies a baby-relevant Age tag is a match
  // (e.g. shopping a New Baby gift for a friend should surface gifts
  // tagged Age=Baby even though the friend isn't tagged Baby).
  if (answers.occasion === "baby") {
    wanted.add("Baby");
  }
  if (!wanted.size) return 0;
  return matchCount(gift.ages, [...wanted]) > 0 ? 10 : 0;
}

function scoreBudget(gift: Gift, answers: Answers): number {
  if (typeof answers.budget !== "number") return 0;
  // Gift Card "Your choice" fits any budget, full points.
  if (gift.isYourChoice) return 10;
  if (gift.price <= 0) return 0;

  // Both ends of the budget are fuzzy by 10%; the hard limits live in
  // scoreGift. Within the fuzz on either side (a little over the ceiling,
  // or topping out a little under the floor) → partial 5 pts.
  if (gift.price > answers.budget) return 5;
  if (
    typeof answers.budgetMin === "number" &&
    !gift.priceOpen &&
    Math.max(gift.price, gift.priceMax ?? 0) < answers.budgetMin
  ) {
    return 5;
  }
  // Inside the range, points follow how much of the budget the gift uses
  // (a range counts its top, capped at the budget): a third or more → 10,
  // a sixth to a third → 7, less → 4. Enough to reorder close calls, never
  // enough to outrank a gift that matches more of the shopper's interests.
  if (gift.priceOpen) return 10;
  const share = Math.min(Math.max(gift.price, gift.priceMax ?? 0), answers.budget) / answers.budget;
  if (share >= 1 / 3) return 10;
  if (share >= 1 / 6) return 7;
  return 4;
}

/** Interest coverage (hits / picks) pro-rated to 40 pts max, the dominant signal. */
function scoreInterests(coverage: number): number {
  return Math.round(coverage * 40);
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
 * Occasion adjustment, only applied when the gift is tagged for the user's
 * occasion in the Occasions column. Occasions with their own rule (per the
 * spec, see Question 2's README) earn a bonus and/or a penalty from it;
 * every other occasion (Birthday, Housewarming, Appreciation, Thank You,
 * and any label added to OCCASION_LABELS later) earns a flat +10 for the
 * explicit tag match, so the curator's occasion tags always count.
 *
 * The bonus is multiplied by `coverage`, the share of the user's picked
 * interests the gift matches: a gift matching 1 of 3 interests gets a third
 * of it, one matching none gets nothing. Occasion fit then refines the
 * order among gifts that suit what the recipient is into, without lifting
 * a weaker interest match over a stronger one or pulling unrelated gifts
 * into the results. Penalties apply in full, since they mark gifts the
 * spec calls a poor fit for the occasion. Returns integer points.
 *
 * When the user picked the free-text "Other" occasion (occasion === "other"),
 * OCCASION_LABELS doesn't have a match → this returns 0 and the algorithm
 * silently bypasses all occasion-based scoring. That's intentional: a typed
 * occasion like "Bar Mitzvah" can't be mapped to the sheet's Occasions column.
 */
const BROAD_OCCASIONS = ["Birthday", "Holiday", "Just Because"];

function scoreOccasionAdjustment(gift: Gift, answers: Answers, coverage: number): number {
  const occLabel = answers.occasion ? OCCASION_LABELS[answers.occasion] : undefined;
  if (!occLabel) return 0;
  // If the gift isn't tagged for this occasion (column empty or doesn't include
  // the user's pick), skip occasion scoring for this gift entirely. Birthday,
  // Holiday, and Just Because suit nearly any gift, so a gift tagged for any
  // of the three counts for all of them; a missing tag on a general gift (a
  // personalized cutting board without "Birthday") no longer costs points.
  const broad = BROAD_OCCASIONS.includes(occLabel) && BROAD_OCCASIONS.some((o) => tolerantIncludes(gift.occasions, o));
  if (!broad && !tolerantIncludes(gift.occasions, occLabel)) return 0;
  const { bonus, penalty } = occasionRule(gift, answers, occLabel);
  return Math.round(bonus * coverage) - penalty;
}

/** Per-occasion bonus (before coverage scaling) and penalty, both as positive points. */
function occasionRule(gift: Gift, answers: Answers, occLabel: string): { bonus: number; penalty: number } {
  switch (occLabel) {
    case "Anniversary": {
      // +10 if gift.types includes Sentimental or Luxurious
      // −10 if gift.types contains ONLY Practical/Fun (nothing else)
      const hasSentLux = gift.types.some(
        (t) => tolerantIncludes([t], "Sentimental") || tolerantIncludes([t], "Luxurious"),
      );
      if (hasSentLux) return { bonus: 10, penalty: 0 };
      const onlyPracFun =
        gift.types.length > 0 &&
        gift.types.every((t) => tolerantIncludes([t], "Practical") || tolerantIncludes([t], "Fun"));
      return { bonus: 0, penalty: onlyPracFun ? 10 : 0 };
    }
    case "Holiday": {
      // +10 if gift.relations matches the user's recipient
      let fits = false;
      if (answers.recipient === "self") fits = gift.relations.length > 0;
      else if (answers.recipient) fits = matchCount(gift.relations, RECIPIENT_LABELS[answers.recipient] ?? []) > 0;
      return { bonus: fits ? 10 : 0, penalty: 0 };
    }
    case "Wedding": {
      // +10 if gift.interests has Home & Decor / Experiences / Personalization
      // −15 if gift.interests has Gaming / Tech & Electronics / Fitness
      const positive = ["Home & Decor", "Experiences", "Personalization"];
      const negative = ["Gaming", "Tech & Electronics", "Fitness"];
      return {
        bonus: positive.some((p) => tolerantIncludes(gift.interests, p)) ? 10 : 0,
        penalty: negative.some((p) => tolerantIncludes(gift.interests, p)) ? 15 : 0,
      };
    }
    case "Just Because": {
      // +10 if gift.types includes Fun; −5 if gift.types includes Luxurious
      return {
        bonus: tolerantIncludes(gift.types, "Fun") ? 10 : 0,
        penalty: tolerantIncludes(gift.types, "Luxurious") ? 5 : 0,
      };
    }
    case "New Baby": {
      // +10 for the explicit tag. No penalty for gifts without a baby age
      // tag: those are curated for the new parents themselves (a hospital
      // bag, a meal delivery), which is exactly what the tag is for.
      return { bonus: 10, penalty: 0 };
    }
    default:
      // Birthday, Housewarming, Appreciation, Thank You, and any newer occasion:
      // the explicit tag match itself is the signal. For Birthday this is the
      // old "+10 when interests match", now proportional to how well they match.
      return { bonus: 10, penalty: 0 };
  }
}

/**
 * Multiplier on the user's stated budget at which we hard-exclude a gift.
 * 1.10× = "strict budget with a 10% fuzz", $120 budget allows up to $132.
 * Applies to raw price; subscription amounts are evaluated at their
 * displayed periodic rate (a $49/mo gift counts as $49 vs the budget).
 */
const BUDGET_CAP_MULTIPLIER = 1.1;

/**
 * Total 0–100 score for one gift. Returns -1 when the gift is excluded
 * outright; the caller drops those before ranking.
 *
 * Hard exclusions:
 *   - status !== "Live"
 *   - Over budget by more than 10% (price > budget × 1.10)
 *   - Age mismatch when both sides specify (user picked an age AND gift
 *     has explicit age tags that don't overlap) OR the recipient implies
 *     an age the gift doesn't cover (e.g. grandparent → no Child gifts)
 *
 * Weighted score (higher is better):
 *   - Relation match     25 (binary)
 *   - Age bracket match  10 (binary; "New baby" occasion implies baby tag)
 *   - Budget             10 at-or-under · 5 within +10% · 0 otherwise
 *                          (raw price; $49/mo is treated like one-shot $49)
 *   - Interests          0–40 (pro-rated by hits/picks; dominant signal)
 *   - Vibe / Type        0–10 (pro-rated)
 *   - Occasion adjust    bonus up to +10 scaled by interest coverage, minus
 *                        a penalty of 0 / 5 / 10 / 15 (applied last, per
 *                        occasion table; total clamped to [0, 100])
 */
export function scoreGift(gift: Gift, answers: Answers): number {
  // Hard filter: only Live gifts get scored
  if (gift.status && gift.status.trim() !== "Live") return -1;
  // Optional "For him / For her" refinement: hide gifts made for the other gender.
  if (answers.gender === "him" && gift.gender === "women") return -1;
  if (answers.gender === "her" && gift.gender === "men") return -1;

  // Hard filter: way over budget. Skip for "Your choice" gift cards.
  if (
    typeof answers.budget === "number" &&
    !gift.isYourChoice &&
    gift.price > 0 &&
    gift.price > answers.budget * BUDGET_CAP_MULTIPLIER
  ) {
    return -1;
  }

  // Hard filter: under the budget floor. A gift qualifies when its price, or
  // the top of its range, reaches the floor (with the same 10% fuzz, applied
  // downward). Gift cards and open-ended prices always qualify.
  if (
    typeof answers.budgetMin === "number" &&
    !gift.isYourChoice &&
    !gift.priceOpen &&
    gift.price > 0 &&
    Math.max(gift.price, gift.priceMax ?? 0) < answers.budgetMin / BUDGET_CAP_MULTIPLIER
  ) {
    return -1;
  }

  // Hard filter: a gift tagged only Self is for treating yourself, never
  // for someone else.
  if (answers.recipient && answers.recipient !== "self" && isSelfOnly(gift)) return -1;

  // Hard filter: age tags both specified, no overlap.
  if (gift.ages.length > 0) {
    if (answers.age) {
      // Explicit user age choice, gift must match one of the allowed labels.
      const wantedAges = new Set<string>(AGE_LABELS[answers.age]);
      if (answers.occasion === "baby") wantedAges.add("Baby");
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

  const picks = answers.interests?.length ?? 0;
  const coverage = picks ? interestMatchCount(gift, answers) / picks : 0;

  const base =
    scoreRelation(gift, answers) +
    scoreAge(gift, answers) +
    scoreBudget(gift, answers) +
    scoreInterests(coverage) +
    scoreVibe(gift, answers);

  // With no interests picked (possible from the Refine panel) there is
  // nothing to scale the occasion bonus by, so it applies in full.
  const occAdj = scoreOccasionAdjustment(gift, answers, picks ? coverage : 1);
  const total = base + occAdj;
  return Math.max(0, Math.min(100, total));
}

/* ------------------------------------------------------------------ *
 * Tiebreakers for equal scores: 1) more interest matches, 2) Best
 * Sellers, 3) price closest to the budget
 * ------------------------------------------------------------------ */

function isBestSeller(gift: Gift): boolean {
  return tolerantIncludes(gift.interests, "Best Sellers") || tolerantIncludes(gift.interests, "Best Seller");
}

/**
 * How close the gift's price sits to the user's budget, from 0 to 1. Used
 * only as the last tiebreaker, so among equally scored gifts one priced
 * near the budget comes before a much cheaper one, without changing any
 * displayed score or which gifts qualify.
 *   - At or under budget: price / budget ($30 on a $120 budget = 0.25).
 *     Ranged prices use the top of the range up to the budget, so an $85
 *     to $175 range on a $120 budget, an open "$X+" price, or a "Your
 *     choice" gift card all count as 1.
 *   - Over budget (within the 10% cap): budget / price, just under 1.
 *   - Unknown price (0) or no budget: 0.
 */
function budgetFit(gift: Gift, answers: Answers): number {
  const budget = answers.budget;
  if (typeof budget !== "number" || budget <= 0) return 0;
  if (gift.isYourChoice) return 1;
  if (gift.price <= 0) return 0;
  if (gift.price > budget) return budget / gift.price;
  if (gift.priceOpen) return 1;
  const top = gift.priceMax !== null && gift.priceMax > gift.price ? Math.min(gift.priceMax, budget) : gift.price;
  return top / budget;
}

/**
 * Match-score thresholds.
 *
 * Behavior:
 *   - If more than 5 gifts clear MATCH_STRICT (≥60), we show ONLY those.
 *     Plenty of strong matches available, no need to dilute with weaker ones.
 *   - Otherwise we widen to MATCH_LOOSE (≥55), still a meaningful score
 *     but more permissive. May still return 0 results if nothing scores
 *     that high; the UI shows its empty state in that case.
 *   - Anything below MATCH_LOOSE is never shown.
 */
const MATCH_STRICT = 60;
const MATCH_LOOSE = 55;

/**
 * Kinds that bunch up in results without being duplicates: two cookbooks
 * share few title words, so the similarity score alone misses them. Used
 * only to space out results; the /review close matches are unchanged.
 * Checked against the name; cookbooks are also caught by their description
 * ("Snoop Dogg and E-40 share more than 65 recipes...").
 */
const COOKBOOK_DESCRIPTION = /\bcookbook\b|\b\d+ (\w+ )?recipes\b/;
const SPACING_KINDS: [string, RegExp][] = [
  ["cookbook", /\bcookbooks?\b|\brecipes?\b.*\bbook\b/],
  ["gift-card", /\bgift card\b/],
  ["vinyl", /\b(vinyl|lp|record player|turntable)\b/],
  ["playing-cards", /\bplaying cards\b/],
  ["game", /\b(board game|card game|game of|game)\b/],
  ["journal", /\b(journal|planner|notebook|diary)\b/],
  ["tea", /\btea\b/],
  ["book", /\b(book(?! nook)|paperback|hardcover|novel)\b/],
  ["subscription", /\b(subscription|of the month|monthly box)\b/],
];

/** What kind of product a gift is, for spacing out results; null when unknown. */
export function giftKind(gift: Gift): string | null {
  const name = gift.name.toLowerCase();
  for (const [kind, re] of SPACING_KINDS) if (re.test(name)) return kind;
  const description = (gift.description ?? "").toLowerCase().slice(0, 160);
  if (COOKBOOK_DESCRIPTION.test(description)) return "cookbook";
  return productType(gift.name, gift.description ?? "");
}

/**
 * Similarity (see similarity.ts) at which two results are too alike to sit
 * next to each other. Lower than the /review duplicate threshold (0.4):
 * here a false alarm only swaps two near-equal results.
 */
export const NEAR_DUPLICATE = 0.3;

const similarityByCatalog = new WeakMap<Gift[], (a: string, b: string) => number>();

/** True when two gifts are the same kind of thing or near-duplicates. */
export function tooAlike(catalog: Gift[], a: Gift, b: Gift): boolean {
  const kind = giftKind(a);
  if (kind && kind === giftKind(b)) return true;
  let similarity = similarityByCatalog.get(catalog);
  if (!similarity) {
    similarity = buildSimilarity(catalog);
    similarityByCatalog.set(catalog, similarity);
  }
  return similarity(a.id, b.id) >= NEAR_DUPLICATE;
}

/**
 * Reorders an already-ranked list so equal-scoring results don't bunch up:
 * no two of the same kind (or near-duplicates) back to back, and no same
 * brand back to back. Gifts only trade places with gifts of the same score,
 * so the match % shown on the cards never goes up as you scroll, and the
 * top pick never changes.
 */
function spreadOut<T extends { gift: Gift; score: number }>(list: T[], catalog: Gift[]): T[] {
  const pool = list.slice();
  const out: T[] = [];
  const clashes = (x: T) => {
    const prev = out[out.length - 1];
    return (!!x.gift.brand && x.gift.brand === prev.gift.brand) || tooAlike(catalog, x.gift, prev.gift);
  };
  while (pool.length) {
    let pick = 0;
    if (out.length && clashes(pool[0])) {
      for (let i = 1; i < pool.length && pool[i].score === pool[0].score; i++) {
        if (!clashes(pool[i])) {
          pick = i;
          break;
        }
      }
    }
    out.push(pool.splice(pick, 1)[0]);
  }
  return out;
}

/**
 * Rank gifts. Returns every gift that clears the threshold band sorted
 * by score desc with tiebreakers. No upper cap, the Results page
 * paginates the list 8 at a time via its "Load more" control, so the
 * full set of qualified matches is available to the user. Returned
 * gifts carry their 0–100 `matchScore` for display in the UI.
 */
export function rankGifts(gifts: Gift[], answers: Answers): RankedGift[] {
  type Scored = { gift: Gift; score: number; interestHits: number; bestSeller: boolean; budgetFit: number };
  const scored: Scored[] = gifts
    .map((g) => ({
      gift: g,
      score: scoreGift(g, answers),
      interestHits: interestMatchCount(g, answers),
      bestSeller: isBestSeller(g),
      budgetFit: budgetFit(g, answers),
    }))
    .filter((s) => s.score >= 0);

  const compare = (a: Scored, b: Scored) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.interestHits !== a.interestHits) return b.interestHits - a.interestHits;
    if (a.bestSeller !== b.bestSeller) return a.bestSeller ? -1 : 1;
    return b.budgetFit - a.budgetFit;
  };

  const finalize = (list: Scored[]): RankedGift[] =>
    spreadOut(list.sort(compare), gifts).map((s) => ({ ...s.gift, matchScore: s.score }));

  const above60 = scored.filter((s) => s.score >= MATCH_STRICT);
  if (above60.length > 5) return finalize(above60);
  const above55 = scored.filter((s) => s.score >= MATCH_LOOSE);
  return finalize(above55);
}

/** Rotating tint palette for secondary cards (hero is always plum). */
export const SECONDARY_TONES = ["butter", "rose", "sage", "cream", "plum"] as const;

/**
 * Build the "Why we picked this" bullets shown in the product modal.
 * Each line is derived from real answer/gift data, no placeholder copy.
 */
export function buildMatchReasons(gift: Gift, answers: Answers): string[] {
  const lc = (s: string) => s.toLowerCase();
  const bullets: string[] = [];

  if (typeof answers.budget === "number") {
    bullets.push(
      typeof answers.budgetMin === "number"
        ? `Lands inside your $${answers.budgetMin} to $${answers.budget} budget`
        : `Lands inside your $${answers.budget} budget`,
    );
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
