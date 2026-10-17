# Analytics tab in /review

The Analytics tab (`/review?tab=analytics`) shows how visitors move through the site: visit, quiz, results, gift opens, and store clicks (Amazon or brand). On top: up to three takeaways, and each KPI tile's change against the previous period of the same length. Further down: site changes and their results (the 7 days before each change against up to 7 finished days after it), sources and devices by store clicks per 100 visits, who people shop for, the most picked interests, how many results people get, and gifts that are opened but rarely clicked. It reads the Google Analytics 4 data the site collects through `track()` in `src/data/analytics.ts`.

How it works: the page calls the worker's `/api/analytics?days=7|30|90` with the review password in an `x-review-secret` header. The worker checks the password with the Apps Script (the review "ping") and remembers only a SHA-256 hash of an accepted password for 10 minutes. Wrong passwords are counted per IP in KV; after 10 in 15 minutes the endpoint answers 429 without asking the Apps Script. Errors are distinct: 401 `wrong_password`, 429 `locked`, 503 `auth_unavailable` (the Apps Script did not answer). The worker then signs in to Google as a service account, finds the GA4 property for `G-4TNQSM74DH`, runs the reports, and caches the result in KV for 10 minutes (`analytics:v2:<days>`; the 90-day daily series behind the change comparisons is cached once as `analytics:v2:daily`). Code: `workers-site/analytics.js`, the math in `src/data/insights.ts` (checked by `node scripts/check-insights.mjs`), and the page in `src/components/ReviewAnalytics.tsx`.

## Site changes

`src/data/changes.ts` lists shopper-facing changes by date, one plain line each. Add a line when such a change ships; the dashboard marks the date on the day-by-day chart and compares the week before with the days after. The change day and today are left out of the comparison.

## One-time setup (Dalia)

1. In Google Cloud Console (console.cloud.google.com), pick or create a project, then enable the **Google Analytics Data API** and the **Google Analytics Admin API**.
2. IAM and Admin, Service accounts: create one (for example `giftpicker-dashboard`). Open it, Keys, Add key, JSON. A key file downloads.
3. In Google Analytics, Admin, Property access management: add the service account's email (it ends in `iam.gserviceaccount.com`) as a **Viewer**.
4. In Google Analytics, Admin, Custom definitions: create event-scoped custom dimensions with these exact parameter names: `destination`, `gift_name`, `step_index`, `question_id`, `recipient`, `interest`, `results_band`. They report from the day they are created, so each card that needs one fills in from then on. (`recipient` comes from `quiz_complete`, `interest` from `quiz_interest`, which fires once per picked interest, and `results_band` from `results_view`, which fires once per ranking shown with the values `none`, `under 8`, `8 to 19`, and `20 plus`.)
5. In a terminal: `cd ~/Sites/gift-picker && npx wrangler secret put GA_SERVICE_ACCOUNT`, then paste the whole JSON key file contents and press Enter. Then delete the downloaded key file.

Optional: set `GA_PROPERTY_ID` (the numeric property ID) as a worker variable to skip the property lookup.

## Local preview

`npm run dev`, then open `/review?tab=analytics&mock` to see the dashboard with sample data, or `&mock=missing` for the cards still waiting on custom dimensions (dev builds only; production never ships the sample data).
