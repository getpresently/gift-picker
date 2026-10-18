/**
 * Gifts for the homepage carousel, in display order. They are the photo
 * tiles from the Product Hunt gallery's "Every gift is hand-picked" mosaic
 * (~/Sites/giftpicker-producthunt/mosaic_ids.txt), chosen as fun,
 * photogenic picks with no flowers. The worker's /api/showcase serves the
 * ones still live on the site, so a retired gift simply drops out.
 */
export const SHOWCASE_IDS: string[] = [
  "r19", "r446", "r593", "r626", "r532", "r273", "r371", "r469", "r680", "r709",
  "r530", "r187", "r85", "r261", "r577", "r565", "r567", "r660", "r441", "r454",
  "r708", "r526", "r318", "r682", "r311", "r62", "r148", "r702", "r714", "r726",
  "r606", "r585", "r129", "r365", "r324", "r462", "r115", "r213", "r258", "r658",
  "r513", "r720", "r442", "r536", "r164", "r63", "r716", "r426", "r35", "r158",
  "r687", "r269", "r598", "r28",
];

/** One carousel tile, as /api/showcase returns it. */
export type ShowcaseGift = { id: string; name: string; brand: string; image: string };
