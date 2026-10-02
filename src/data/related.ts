import type { Gift } from "./gifts";
import { productType } from "./similarity";

const norm = (s: string) => s.trim().toLowerCase();
const overlap = (a: string[], b: string[]) => {
  const bs = new Set(b.map(norm));
  return a.filter((v) => bs.has(norm(v))).length;
};

/**
 * Gifts to suggest under a gift page. Same audience only (a shared age tag,
 * nothing made for the other gender), ranked by shared interests first, then
 * shared vibes and relations, with a nudge toward a similar price. Gifts of
 * the same product type are pushed down so the row offers alternatives
 * rather than near-copies of the gift on the page, and each brand appears
 * at most once.
 */
export function relatedGifts(gift: Gift, all: Gift[], count = 4): Gift[] {
  const interests = gift.interests.filter((i) => !/^best sellers?$/i.test(i.trim()));
  const type = productType(gift.name, gift.description);
  return all
    .filter((g) => g.id !== gift.id && (!g.status || g.status.trim() === "Live"))
    .filter((g) => !gift.ages.length || !g.ages.length || overlap(gift.ages, g.ages) > 0)
    .filter((g) => !(gift.gender && g.gender && gift.gender !== g.gender))
    .map((g) => {
      const sharedInterests = overlap(interests, g.interests);
      let score = sharedInterests * 3 + overlap(gift.types, g.types) + overlap(gift.relations, g.relations) * 0.5;
      if (gift.price > 0 && g.price > 0) {
        const ratio = Math.max(gift.price, g.price) / Math.min(gift.price, g.price);
        if (ratio <= 2) score += 2;
        else if (ratio <= 4) score += 1;
      }
      if (type && productType(g.name, g.description) === type) score -= 4;
      if (norm(g.brand) === norm(gift.brand)) score -= 1;
      return { g, score, sharedInterests };
    })
    .filter((x) => x.sharedInterests > 0)
    .sort((a, b) => b.score - a.score)
    // One gift per brand, so the row never shows two near-identical picks.
    .filter((x, i, list) => list.findIndex((y) => norm(y.g.brand) === norm(x.g.brand)) === i)
    .slice(0, count)
    .map((x) => x.g);
}
