/**
 * Site changes shoppers can see, by the date they went live. The Analytics tab
 * in /review compares the week before each date with the days after it.
 *
 * Filled from `git log` (user-facing changes only, one plain line each). Add a
 * line here when a shopper-facing change ships; dates are YYYY-MM-DD.
 */

export type SiteChange = { date: string; title: string };

export const CHANGES: SiteChange[] = [
  { date: "2026-10-03", title: "The new GiftPicker site goes live, with a new quiz, results page, and gift pages" },
  { date: "2026-10-03", title: "New job occasion added" },
  { date: "2026-10-03", title: "Child added as a recipient" },
  { date: "2026-10-03", title: "Budget slider gets an optional floor, and quick picks become price ranges" },
  { date: "2026-10-03", title: "Gift pages show related gifts" },
  { date: "2026-10-03", title: "Testimonials on the homepage" },
  { date: "2026-10-03", title: "Ranking favors gifts that match more of the picked interests" },
  { date: "2026-10-03", title: "Prices round to whole dollars" },
  { date: "2026-10-03", title: "Load more scrolls to the first new card" },

  { date: "2026-10-04", title: "Sympathy occasion added" },
  { date: "2026-10-04", title: "Only reviewed gifts show on the site" },
  { date: "2026-10-04", title: "Shared result links open the sender's picks" },

  { date: "2026-10-07", title: "Homepage gift boxes stack in a centered frame on phones" },

  { date: "2026-10-13", title: "Quiz hides interests that don't fit babies and little ones" },

  { date: "2026-10-16", title: "Treat myself asks about you and results say \"for you\"" },
  { date: "2026-10-16", title: "Product Hunt badge on the homepage" },

  { date: "2026-10-17", title: "Gifts sold on Amazon get a single Buy on Amazon button" },
  { date: "2026-10-17", title: "Near-identical gifts from different brands share one result card" },
  { date: "2026-10-17", title: "Load more keeps the page still, and new cards fade in" },
  { date: "2026-10-17", title: "Quiz shows every interest at once" },
  { date: "2026-10-17", title: "Books & Reading interest added" },
  { date: "2026-10-17", title: "Buy buttons in gift details stay on one row on desktop" },
  { date: "2026-10-17", title: "Gardening and Sports gifts score in full on their other interests until those quiz options launch" },
  { date: "2026-10-17", title: "Reporting a gift with a twin shows the other maker's gift in its place" },
];
