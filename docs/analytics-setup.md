# Analytics tab in /review

The Analytics tab (`/review?tab=analytics`) shows how visitors move through the site: visit, quiz, results, gift opens, and store clicks (Amazon or brand). On top: up to four takeaways, and each KPI tile's change against the previous period of the same length. Further down: site changes and their results (the 7 days before each change against up to 7 finished days after it), sources and devices by store clicks per 100 visits, who people shop for, the most picked interests, how many results people get, gifts that are opened but rarely clicked, what gets shared, and what gets opened (see below). It reads the Google Analytics 4 data the site collects through `track()` in `src/data/analytics.ts`.

How it works: the page calls the worker's `/api/analytics?days=7|30|90` with the review password in an `x-review-secret` header. The worker checks the password with the Apps Script (the review "ping") and remembers only a SHA-256 hash of an accepted password for 10 minutes. Wrong passwords are counted per IP in KV; after 10 in 15 minutes the endpoint answers 429 without asking the Apps Script. Errors are distinct: 401 `wrong_password`, 429 `locked`, 503 `auth_unavailable` (the Apps Script did not answer). The worker then signs in to Google as a service account, finds the GA4 property for `G-4TNQSM74DH`, runs the reports, and caches the result in KV for 10 minutes (`analytics:v4:<days>`; the 90-day daily series behind the change comparisons is cached once as `analytics:v2:daily`). Code: `workers-site/analytics.js`, the math in `src/data/insights.ts` (checked by `node scripts/check-insights.mjs`), and the page in `src/components/ReviewAnalytics.tsx`.

## Site changes

`src/data/changes.ts` lists shopper-facing changes by date, one plain line each. Add a line when such a change ships; the dashboard marks the date on the day-by-day chart and compares the week before with the days after. The change day and today are left out of the comparison.

## What gets shared

Three events feed this section:

- `gift_share` fires on Share these picks (results) with `method` (`shared` through the share sheet, `copied`, or `failed`), the search's `recipient`, `occasion` (the answer code; a typed occasion reports as `other` and its text never goes to GA), `age`, `interests_count`, `budget_band` (`under 50`, `50 to 99`, `100 to 249`, `250 plus`), and `results_count`.
- `gift_link_copy` fires on Copy link in the gift details and on the gift page, with `gift_id`, `gift_name`, `brand`, `price`, and `source` (`modal` or `gift_page`). The copied link ends in `?ref=share`; the canonical URL stays `/gift/:id`.
- `share_open` fires when a shared link is opened: `share_type` `results` (a /results link with answers, plus the search's recipient, occasion, age, interests_count, and budget_band) or `gift` (a `?ref=share` gift link, plus gift_id, gift_name, and brand). The page then drops the share params from the address bar, so a reload doesn't count again.

The tiles count results shares (all `gift_share` events less the failed ones), gift links copied, and shared links opened, each with its change against the previous period. Results and gift opens are split by `share_type`, and opens per share is opens divided by results shares plus gift links copied (it can pass 1, since one share sheet post can reach many people). Shares by recipient and by occasion divide results shares by finished quizzes (`quiz_complete`) for the same answer, as shares per 100 quizzes, shown only with 10 or more quizzes. Most copied gifts lists `gift_link_copy` by gift name, with copies per 100 opens on results once a gift has 3 opens. The takeaway names the recipient shared most often when it has 10+ quizzes and 5+ shares, at least 10 shares are counted in all, and its rate is at least 1.5 times the average.

## What gets opened

- `gift_impression` fires once per gift per ranking when its card on results (the top pick or a grid card) has been at least half on screen for half a second, with `gift_id`, `gift_name`, `brand`, and `position` (1 is the top pick). Scrolling past quickly doesn't count, re-renders and Load more don't count a card twice, and new answers start the count over. A tap on a card that hasn't counted yet sends its impression first, so a gift is never tapped more often than seen.
- `gift_open` already sends `source`: `top_pick` or `grid` for a tap on a results card, `modal_nav` for browsing with the arrows in the details.

Most opened gifts adds detail opens from a results card (`gift_open` with source `top_pick` or `grid`) to gift page views (page views on `/gift/:id`, named through the live catalog the worker keeps in KV; pages of gifts that are no longer live are left out), with store clicks and link copies for context, top 12 by the total. Until `source` is registered, detail opens count every `gift_open` and the column says it includes arrow browsing. Seen but rarely tapped lists gifts seen at least 20 times whose taps per 100 seen are below the rate across all seen gifts, most seen first; it needs `source`.

## One-time setup (Dalia)

1. In Google Cloud Console (console.cloud.google.com), pick or create a project, then enable the **Google Analytics Data API** and the **Google Analytics Admin API**.
2. IAM and Admin, Service accounts: create one (for example `giftpicker-dashboard`). Open it, Keys, Add key, JSON. A key file downloads.
3. In Google Analytics, Admin, Property access management: add the service account's email (it ends in `iam.gserviceaccount.com`) as a **Viewer**.
4. In Google Analytics, Admin, Custom definitions: create event-scoped custom dimensions with these exact parameter names: `destination`, `gift_name`, `step_index`, `question_id`, `recipient`, `interest`, `results_band`, `occasion`, `method`, `share_type`, `source`. They report from the day they are created, so each card that needs one fills in from then on. (`recipient` and `occasion` come from `quiz_complete` and `gift_share`, `interest` from `quiz_interest`, which fires once per picked interest, `results_band` from `results_view`, which fires once per ranking shown with the values `none`, `under 8`, `8 to 19`, and `20 plus`, `method` from `gift_share`, `share_type` from `share_open`, and `source` from `gift_open`, `gift_buy_click`, and `gift_link_copy`.) `budget_band` is optional: no card reads it, but registering it lets GA explorations break shares down by budget.
5. In a terminal: `cd ~/Sites/gift-picker && npx wrangler secret put GA_SERVICE_ACCOUNT`, then paste the whole JSON key file contents and press Enter. Then delete the downloaded key file.

Optional: set `GA_PROPERTY_ID` (the numeric property ID) as a worker variable to skip the property lookup.

## Local preview

`npm run dev`, then open `/review?tab=analytics&mock` to see the dashboard with sample data, or `&mock=missing` for the cards still waiting on custom dimensions (dev builds only; production never ships the sample data).
