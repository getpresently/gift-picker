# SEO keyword plan: gift finder, gift quiz, and pick a gift

Written 17 October 2026 on branch `seo-keywords`. Nothing here is deployed.

## Where things stand

Search Console, last 3 months (web search): 132 clicks, 4,470 impressions, 3% CTR, average position about 30.

- The home page earns 131 of the 132 clicks and 4,447 of the impressions. `/home` (39 impressions), `/quiz`, `/brands`, `/privacy`, and `/terms` share the rest.
- **No `/gift/:id` page earned a single impression**, even though about 840 of them are in the sitemap.
- No query names a person, an occasion, an interest, or a price. Every query is a tool search (finder, quiz, picker, chooser, generator) or the brand.

## Keyword families and what the searcher wants

| Family | Examples (impressions, avg position) | Intent | Where we stand |
|---|---|---|---|
| Finder and quiz | gift finder (978, 35.7), gift finder quiz (405, 44.5), gift quiz (181, 42.2), present finder quiz (115, 32.5), find the perfect gift quiz (96, 66.1) | Wants a working tool right now, free, no sign-up | Page 4 to 7. The biggest opportunity. |
| Generator and matcher | gift generator (52, 72.5), gift idea generator based on interests (12, 65.2), gift matcher (19, 13.1), gift identifier (38, 20.6) | Same tool intent, different word | Mostly page 4 to 8 |
| Pick and choose | pick a gift (172, 8.9), pick a present (67, 7.0), choose the gift (16, 6.1), gift chooser (23, 6.3), gift selector (42, 5.6) | Half tool, half close to our name | Bottom of page 1. Small wording changes can move these. |
| Brand | gift picker (145, 2.4), gift pick (131, 5.1), giftpick (41, 4.0), present picker (30, 2.9) | Looking for us | Fine. Keep "GiftPicker" in every title. |

The home page is the page that should rank for all of these. It is the tool, and it already holds almost all of the site's search visibility, so the work goes into the home page instead of new pages that would compete with it.

## What ranks for gift finder, gift finder quiz, and gift quiz

Checked 17 October through web search and by fetching the top pages (a US web index, not Google's live results, so treat the order as indicative):

- **Tool pages with the keyword at the front of the title.** "Gift Finder Quiz - Find Their Perfect Gift" (wtfdotheywant.com), "Gift Quiz: What Should I Get Them?" (giftinspo.app), "Giftruly: Gift Finder & Gift Ideas for Anyone", "Free AI Gift Finder" (giftfinderai.co), "Gift Quiz: Find the Right Gift in 60 Seconds" (sleeknova.com), Etsy Gift Mode, and Gretchen Rubin's Gift-Giving Quiz.
- **Structure of the strongest pages:** the tool or its first question above the fold, then "how it works", an FAQ, and links into gift guides. Giftruly (about 1,370 words), SleekNova (about 1,630), and The Gift Tool (about 1,140) all follow it.
- **Thin pages still rank** when they're old or well linked: wtfdotheywant sends about 10 words of server HTML. Links and age matter here as much as copy, which is why the off-page list below matters.

## Gaps on giftpicker.io before this branch

1. **Title** "GiftPicker by Presently" contained none of the target words. Google weighs the title more than anything else on the page.
2. **Meta description** said "free 30-second quiz" and never "gift finder".
3. **Visible home page copy**, which is what Google indexes after it runs the JavaScript, never said "gift finder", "gift quiz", or "present". The H1 is the slogan.
4. **The gift pages are orphaned.** Nothing links to them except the sitemap: the "More gifts like this" cards on each gift page were click handlers, not links, so Google found about 840 pages with no internal links pointing at them. That is the most likely reason they earn nothing. Their crawler HTML is fine (own title, canonical, Product JSON-LD, prerendered body), and a Googlebot-style render of `/gift/r979` on the live site shows the full gift with the right title and canonical.
5. **Duplicate addresses:** `www.giftpicker.io` answered 200 instead of redirecting, `/home` served the home page (and still gets impressions), and the workers.dev copy of the site was indexable.
6. **Structured data:** WebApplication was there; no WebSite name for Google's site-name display.

## What this branch changes

- **Title:** "Free Gift Finder Quiz: Pick a Gift in a Minute · GiftPicker". It leads with the main query, carries "pick a gift", and keeps the brand.
- **Meta description:** "GiftPicker is a free gift finder quiz. Answer a few questions about the person and pick a present matched to their interests, the occasion, and your budget." It carries "gift finder quiz", "pick a present", and "interests".
- **Open Graph and Twitter descriptions** and the image alt text drop "30-second" for "gift finder quiz".
- **Structured data:** WebApplication gains `alternateName`, `isAccessibleForFree`, and `browserRequirements`; a WebSite block names the site "GiftPicker" with "Gift Picker" as an alternate name.
- **Crawler text** (the no-JavaScript fallback that Bing and AI crawlers read): an H1 that names the gift finder quiz and a paragraph and step list that use the query words.
- **One visible sentence:** the hero line under "Stop guessing. Start gifting." now names the free gift finder quiz. Everything else on the home page is unchanged, including the "three steps" section.
- **Gift pages:** the "More gifts like this" card names are now real links to `/gift/:id`, so Google can follow from one gift page to the next. A plain click still behaves as before.
- **Redirects and noindex:** `www.giftpicker.io` and `/home` redirect permanently to the home page; the workers.dev copy sends `X-Robots-Tag: noindex`.
- **llms.txt** says "free gift finder quiz" and lists all current interests.

## Parked: guide pages and a quiz explainer

A first version of this work added `/gift-finder-quiz` (an explainer with an FAQ) and 29 catalog-driven guide pages at `/gifts/:slug`. Dalia decided against them for now: the home page should own the gift finder terms, and the guides read as templated. They are kept on branch `seo-guides-parked`, one commit on top of this branch, with the copy review notes in `docs/seo-guides-parked.md`.

What they would add if revived later: links from the home page into the gift pages (the one link path this branch still lacks), and pages for person, occasion, and budget searches that the site doesn't rank for today. Revisit after this branch has been live for six to eight weeks, once Search Console shows whether the gift pages start getting indexed through the related links alone.

## Off-page: what Dalia can do

- **Product Hunt relaunch (19 November):** put "gift finder quiz" in the description, since the product page links to the site with that context.
- **Directories and comparison pages for gift finder tools:** AlternativeTo (list GiftPicker as an alternative to Etsy Gift Mode, Giftruly, and WTF Do They Want), SaaSHub, Indie Hackers, Uneed, Microlaunch, and Peerlist. Ask to be added to "best free gift finder tools" roundups (giftlist.com has one). Skip AI-only directories, since GiftPicker isn't an AI tool.
- **Holiday pitch to gift-guide writers and newsletters** (Cool Mom Picks covered Etsy Gift Mode).
- **Own properties:** link the Presently site and the new blog posts to the home page with "gift finder quiz" as the link text.
- **Reddit:** follow `docs/relaunch-strategy.md` (r/Gifts and r/SideProject).
- **Bing Webmaster Tools:** import the site from Search Console and submit the sitemap.

## How to measure it in Search Console

1. After the deploy, use **URL Inspection** on `https://giftpicker.io/` and click Request indexing, so the new title is picked up sooner.
2. Inspect two gift pages, for example `/gift/r979` and `/gift/r977`. If the status is "Discovered, currently not indexed" or "Crawled, currently not indexed", that confirms the orphan diagnosis; request indexing for both.
3. Open **Sitemaps** and check that `sitemap.xml` shows Success with about 840 discovered URLs. Resubmit it if the last read is old.
4. **Indexing > Pages:** watch the indexed count for `/gift/` URLs over the next 2 to 6 weeks.
5. **Performance > Search results, Compare mode,** 28 days after the deploy against the 28 days before, with these query filters (Query > Custom (regex)):
   - Tool: `(gift|present)s? ?(finder|quiz|generator|matcher|suggester|selector|chooser|helper|advisor|assistant|identifier)|gift(ing)? (idea|tool|quiz)`
   - Pick and choose: `^(pick|choose) (a |the )?(gift|present)|^(pick|choose) gift|^gift (pick|choose)$`
   - Brand: `gift ?pick(er|ed)?|present picker|presently`
   Track average position, impressions, and CTR for each. Baseline: gift finder 35.7, gift finder quiz 44.5, gift quiz 42.2, present finder quiz 32.5, pick a gift 8.9, pick a present 7.0.
6. **Pages tab** with a Page filter "contains /gift/" to see whether gift pages start earning impressions.

Expect the title change to show within 2 to 4 weeks of the next crawl. Ranking moves on terms like "gift finder" depend more on links than on copy, so the off-page list decides how far the home page climbs.
