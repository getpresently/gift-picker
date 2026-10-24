/**
 * Credits on /thanks: the people and lists that led us to gifts in the
 * catalog, with the gifts each one inspired. The React page
 * (src/components/Thanks.tsx) and the worker's crawler copy
 * (workers-site/index.js) both read this file, so keep it free of
 * browser-only code.
 *
 * A gift is listed only while it is live on the site, and a source with no
 * live gifts is left out, so rejecting or retiring a gift needs no edit here.
 * Each gift carries its own short label for the credit line. Credit only what the source actually recommends
 * (check the page before adding), and add a source whenever a batch of gifts
 * comes from someone else's list. A source that inspired only one generic
 * gift (an iPad) is not credited unless its list has other good ideas
 * (Dalia, 10/24). House style: no em-dashes, the Oxford comma.
 * Links in a note use the blog's [label](url) form (parseInline in posts.ts).
 */

export type ThanksSource = {
  /** Who made the list, as they sign it. */
  by: string;
  /** One plain sentence about the list, linking it as [label](url). */
  note: string;
  /** The gifts it led us to, by sheet ID. */
  gifts: { id: string; label: string }[];
};

/** The page's opening paragraph. */
export const THANKS_INTRO =
  "Every gift on GiftPicker is picked by hand, and some of our favorites started on someone else's list. These are the people whose recommendations led us to them, and the gifts each one inspired.";

/** Shown under the page title; update it when a source is added. */
export const THANKS_UPDATED = "2026-10-19";

export const THANKS: ThanksSource[] = [
  {
    by: "Lukas Murdock",
    note: "[His gift page](https://lukasmurdock.com/gifts/) lists favorite products, shops, and other people's gift guides, and it led us to every other list on this page.",
    gifts: [
      { id: "r1099", label: "BALMUDA The Toaster Pro" },
      { id: "r1100", label: "Pendleton Grand Canyon National Park throw" },
      { id: "r1101", label: "Nintendo hanafuda cards" },
      { id: "r1106", label: "Math Games with Bad Drawings" },
      { id: "r1107", label: "The Silver Spoon cookbook" },
      { id: "r1108", label: "Parks, from Standards Manual" },
      { id: "r1114", label: "Poor Charlie's Almanack" },
      { id: "r1115", label: "Edward Tufte's five books, signed" },
      { id: "r1113", label: "BenQ ScreenBar Halo 2" },
    ],
  },
  {
    by: "SparkToro",
    note: "The Best Damn Food & Drink Gift Guide, from [2024](https://sparktoro.com/blog/the-best-damn-food-drink-gift-guide-2024/) and [2022](https://sparktoro.com/blog/the-best-damn-food-drink-gift-guide-2022/), written by Rand Fishkin, Amanda Natividad, Andrew Bohrer, and other contributors.",
    gifts: [
      { id: "r1120", label: "Zabar's Hanukkah gift basket" },
      { id: "r1121", label: "Zabar's babka and rugelach crate" },
      { id: "r1122", label: "Zabar's bagels and Nova brunch crate" },
      { id: "r1123", label: "Zabar's shiva and sympathy box" },
      { id: "r1110", label: "OTOTO Baby Nessie tea infuser" },
      { id: "r1116", label: "100 Cookies by Sarah Kieffer" },
      { id: "r1117", label: "Kayla's Cake French macarons" },
    ],
  },
  {
    by: "Brett and Kate McKay",
    note: "[Top 10 Toilet Books](https://www.artofmanliness.com/living/reading/top-10-toilet-books/), on The Art of Manliness.",
    gifts: [{ id: "r1105", label: "What If? by Randall Munroe" }],
  },
  {
    by: "Anthony Hobday",
    note: "His [list of short design books](https://web.archive.org/web/20260304000632/https://www.anthonyhobday.com/blog/20230101.html) recommends Dieter Rams's Less but Better, which led us to the complete catalogue of Rams's work.",
    gifts: [{ id: "r1103", label: "Dieter Rams: The Complete Works" }],
  },
];

/** The sources and gifts to show, given the live gift IDs (null, when the catalog can't load, shows every gift). */
export function liveThanks(live: Set<string> | null): ThanksSource[] {
  return THANKS.map((s) => ({ ...s, gifts: live ? s.gifts.filter((g) => live.has(g.id)) : s.gifts })).filter((s) => s.gifts.length > 0);
}
