import type { Gift } from "./gifts";

/**
 * "Same kind of item, different brand" matcher, computed entirely client
 * side over the live catalog (about 560 rows today, so an O(n squared)
 * pass is cheap). TF-IDF cosine similarity over Gift name (weight 0.7)
 * and Description (weight 0.3), plus a product-type match, a small
 * shared-Interests bonus, and a mild cross-price penalty.
 */

const FIELD_WEIGHT_NAME = 0.7;
const FIELD_WEIGHT_DESC = 0.3;
const INTEREST_BONUS_CAP = 0.1;
const PRICE_RATIO_LIMIT = 3;
const PRICE_PENALTY = 0.15;

/**
 * Calibrated against the live catalog (562 Live rows, 9/21/26 snapshot):
 * scores 0.40 and up are consistently real duplicates (yoga mats, ice
 * cream makers, film cameras, wireless earbuds, cheese boards); below
 * that, false positives creep in fast (e.g. "Kitchen Appliances" vs
 * "Kitchen Linens Bundle" just for sharing "kitchen"). 0.40 flags about
 * a third of the live catalog, a workable review queue.
 */
export const DEFAULT_THRESHOLD = 0.4;

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can", "did",
  "do", "does", "for", "from", "had", "has", "have", "he", "her", "his", "how",
  "if", "in", "into", "is", "it", "its", "just", "may", "me", "more", "most",
  "my", "no", "not", "of", "on", "or", "our", "over", "own", "she", "so",
  "some", "such", "than", "that", "the", "their", "them", "then", "there",
  "these", "they", "this", "those", "to", "up", "us", "very", "was", "we",
  "were", "what", "when", "which", "who", "will", "with", "you", "your",
  "yours", "all", "any", "both", "each", "few", "into", "out", "per", "via",
]);

/** Gift-catalog filler that doesn't describe what the item actually is. */
const GENERIC = new Set([
  "set", "kit", "pack", "bundle", "gift", "gifts", "edition", "collection",
  "classic", "original", "premium", "deluxe", "mini", "new", "style",
  "exclusive", "limited", "special", "essential", "essentials", "ultimate",
  "pro", "plus", "perfect", "great", "ideal", "amazing", "best", "includes",
  "featuring", "designed", "made", "comes", "enjoy", "give", "gives", "makes",
  "perfectly", "beautiful", "high", "quality", "durable", "stylish", "unique",
  "personalized", "custom", "handmade", "top", "favorite", "favorites",
  "oz", "fl", "ml", "qt", "lb", "inch", "in", "piece", "count", "gen", "generation",
]);

/**
 * What kind of object a gift is. Word overlap alone misses "Rambler Tumbler"
 * vs "Kids Water Bottle" and wrongly pairs a spray "bottle" with drinkware, so
 * two gifts of the same kind get a strong boost and a typed gift is nudged
 * away from untyped candidates. Checked against the name first, then the
 * start of the description.
 */
const PRODUCT_TYPES: [string, RegExp][] = [
  ["drinkware", /\b(tumblers?|water bottles?|insulated (steel |stainless )?bottles?|bottle with straw|travel mugs?|smart mugs?|heated mugs?|mug 3|thermos|rambler|freesip)\b/],
  ["planter", /\b(planters?|plant pots?)\b/],
  ["coffee-maker", /\b(coffee maker|espresso|keurig|nespresso|vertuo|cold brew|french press|pour[- ]over)\b/],
  ["kettle", /\bkettle\b/],
  ["headphones", /\b(headphones?|earbuds?|earphones?|headset)\b/],
  ["speaker", /\b(speakers?|soundbar|sound bar|partybox)\b/],
  ["instant-camera", /\b(instant camera|instant film camera|instax mini|polaroid|film camera|camp snap)\b/],
  ["photo-printer", /\b(photo printer|smartphone printer)\b/],
  ["wearable", /\b(smartwatch|apple watch|watch se|fitness tracker|whoop|smart ring|oura|forerunner)\b/],
  ["massage", /\b(massage gun|theragun|massager|percussive)\b/],
  ["yoga-mat", /\byoga mat\b/],
  ["blanket", /\b(blanket|cozychic throw|knit throw)\b/],
  ["candle", /\bcandles?\b(?! holder)/],
  ["diffuser", /\bdiffuser\b/],
  ["jigsaw", /\b(jigsaw|\d+ piece puzzle)\b/],
  ["e-reader", /\b(kindle|e-reader|ereader|e-ink)\b/],
  ["controller", /\b(controller|gamepad)\b/],
  ["keyboard", /\bkeyboard\b/],
  ["sheets", /\bsheet set\b/],
  ["slippers", /\bslippers?\b/],
  ["sneakers", /\b(sneakers?|running shoe|air force 1)\b/],
  ["hoodie", /\bhoodie\b/],
  ["digital-frame", /\bdigital (photo |picture )?frame\b/],
  ["sleep-clock", /\b(sunrise alarm|sound machine|alarm clock)\b/],
  ["indoor-garden", /\b(indoor garden|smart garden|hydroponic)\b/],
  ["dutch-oven", /\b(dutch oven|round oven|cocotte)\b/],
  ["ice-cream-maker", /\b(ice cream maker|creami)\b/],
  ["coffee-subscription", /\b(coffee (subscription|club|of the month))\b/],
  ["cheese", /\b(cheese|charcuterie)\b/],
  ["chocolate", /\b(chocolates?|truffles|bonbons)\b/],
  ["vr-headset", /\b(quest 3|vr headset|mixed reality headset)\b/],
  ["online-class", /\b(masterclass|udemy|online class)\b/],
  ["sunglasses", /\b(sunglasses|wayfarer)\b/],
  ["wallet", /\b(wallet|card holder)\b/],
];
const TYPE_MATCH_BONUS = 0.35;
const TYPE_MISMATCH_PENALTY = 0.1;

export function productType(name: string, description: string): string | null {
  const n = stripAccents(name.toLowerCase());
  for (const [type, re] of PRODUCT_TYPES) if (re.test(n)) return type;
  const d = stripAccents(description.toLowerCase()).slice(0, 140);
  for (const [type, re] of PRODUCT_TYPES) if (re.test(d)) return type;
  return null;
}

/** Canonicalize near-synonym tokens (applied AFTER stemming below). */
const SYNONYMS = new Map<string, string>([
  ["earphone", "earbud"],
  ["headphone", "earbud"],
  ["headset", "earbud"],
  ["tumbler", "bottle"],
  ["flask", "bottle"],
  ["journal", "notebook"],
  ["planner", "notebook"],
  ["jigsaw", "puzzle"],
  ["sneaker", "shoe"],
  ["throw", "blanket"],
]);

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function rawTokens(s: string): string[] {
  return stripAccents(s.toLowerCase())
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Light stemming: plural s/es/ies only, nothing fancier. */
function stem(tok: string): string {
  if (tok.length > 4 && tok.endsWith("ies")) return `${tok.slice(0, -3)}y`;
  if (tok.length > 4 && tok.endsWith("es")) return tok.slice(0, -2);
  if (tok.length > 3 && tok.endsWith("s") && !tok.endsWith("ss")) return tok.slice(0, -1);
  return tok;
}

function tokenizeField(text: string, brand: string): string[] {
  const brandTokens = new Set(rawTokens(brand).map(stem));
  return rawTokens(text)
    .filter((t) => t.length > 1)
    .filter((t) => !/\d/.test(t))
    .filter((t) => !STOPWORDS.has(t) && !GENERIC.has(t))
    .map(stem)
    .filter((t) => !brandTokens.has(t))
    .map((t) => SYNONYMS.get(t) ?? t);
}

type TermFreq = Map<string, number>;

function termFreq(tokens: string[]): TermFreq {
  const tf: TermFreq = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

function docFreq(docs: TermFreq[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const tok of doc.keys()) df.set(tok, (df.get(tok) ?? 0) + 1);
  }
  return df;
}

/** L2-normalized TF-IDF vector, smoothed idf so unseen/rare terms don't blow up. */
function tfidfVector(tf: TermFreq, df: Map<string, number>, n: number): TermFreq {
  const vec: TermFreq = new Map();
  let normSq = 0;
  for (const [tok, count] of tf) {
    const idf = Math.log((n + 1) / ((df.get(tok) ?? 0) + 1)) + 1;
    const w = count * idf;
    if (w > 0) {
      vec.set(tok, w);
      normSq += w * w;
    }
  }
  if (normSq > 0) {
    const norm = Math.sqrt(normSq);
    for (const [tok, w] of vec) vec.set(tok, w / norm);
  }
  return vec;
}

function cosine(a: TermFreq, b: TermFreq): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [tok, w] of small) {
    const wb = large.get(tok);
    if (wb) dot += w * wb;
  }
  return dot;
}

function sharedInterestBonus(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase().trim()).filter(Boolean));
  const setB = new Set(b.map((s) => s.toLowerCase().trim()).filter(Boolean));
  if (!setA.size || !setB.size) return 0;
  let shared = 0;
  for (const x of setA) if (setB.has(x)) shared++;
  const union = new Set([...setA, ...setB]).size;
  if (!union) return 0;
  return (shared / union) * INTEREST_BONUS_CAP;
}

function isLiveStatus(status: string): boolean {
  return status.trim() === "Live";
}

export type SimilarMatch = { rowId: string; score: number };
export type SimilarityResult = { count: number; top: SimilarMatch[] };

type MatchableGift = Pick<Gift, "id" | "name" | "brand" | "description" | "price" | "interests" | "status">;

/**
 * Build a similarity index over `gifts` and return a lookup function.
 * Only Live gifts are considered as candidate matches (and as the corpus
 * for term rarity), but any row id, live or not, can be queried, so the
 * review screen can look up matches while browsing any filter.
 */
export function buildMatcher(
  gifts: MatchableGift[],
  threshold: number = DEFAULT_THRESHOLD,
): (rowId: string) => SimilarityResult {
  const liveIndexes: number[] = [];
  gifts.forEach((g, i) => {
    if (isLiveStatus(g.status)) liveIndexes.push(i);
  });

  const nameTfs = gifts.map((g) => termFreq(tokenizeField(g.name, g.brand)));
  const descTfs = gifts.map((g) => termFreq(tokenizeField(g.description, g.brand)));
  const nameDf = docFreq(liveIndexes.map((i) => nameTfs[i]));
  const descDf = docFreq(liveIndexes.map((i) => descTfs[i]));
  const n = liveIndexes.length;
  const nameVecs = gifts.map((_, i) => tfidfVector(nameTfs[i], nameDf, n));
  const descVecs = gifts.map((_, i) => tfidfVector(descTfs[i], descDf, n));

  const types = gifts.map((g) => productType(g.name, g.description));

  const indexById = new Map<string, number>();
  gifts.forEach((g, i) => indexById.set(g.id, i));

  const cache = new Map<string, SimilarityResult>();

  return (rowId: string): SimilarityResult => {
    const cached = cache.get(rowId);
    if (cached) return cached;

    const i = indexById.get(rowId);
    if (i === undefined) return { count: 0, top: [] };

    const a = gifts[i];
    const scored: SimilarMatch[] = [];
    for (const j of liveIndexes) {
      if (j === i) continue;
      const b = gifts[j];
      let score = FIELD_WEIGHT_NAME * cosine(nameVecs[i], nameVecs[j]) + FIELD_WEIGHT_DESC * cosine(descVecs[i], descVecs[j]);
      score += sharedInterestBonus(a.interests, b.interests);
      if (types[i] && types[i] === types[j]) score += TYPE_MATCH_BONUS;
      else if (types[i] && types[j] !== types[i]) score -= TYPE_MISMATCH_PENALTY;
      if (a.price > 0 && b.price > 0) {
        const ratio = Math.max(a.price, b.price) / Math.min(a.price, b.price);
        if (ratio > PRICE_RATIO_LIMIT) score -= PRICE_PENALTY;
      }
      score = Math.max(0, Math.min(1, score));
      if (score > 0) scored.push({ rowId: b.id, score });
    }
    scored.sort((x, y) => y.score - x.score);
    const top = scored.slice(0, 5);
    const count = scored.filter((s) => s.score >= threshold).length;
    const result = { count, top };
    cache.set(rowId, result);
    return result;
  };
}
