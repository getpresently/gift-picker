# Analytics tab in /review

The Analytics tab (`/review?tab=analytics`) shows how visitors move through the site: visit, quiz, results, gift opens, and store clicks (Amazon or brand). It reads the Google Analytics 4 data the site already collects through `track()` in `src/data/analytics.ts`; it adds no tracking of its own.

How it works: the page calls the worker's `/api/analytics?days=7|30|90` with the review password in an `x-review-secret` header. The worker checks the password with the Apps Script (the review "ping") and remembers only a SHA-256 hash of an accepted password for 12 hours. It then signs in to Google as a service account, finds the GA4 property for `G-4TNQSM74DH`, runs the reports, and caches the result in KV for 10 minutes. Code: `workers-site/analytics.js` and `src/components/ReviewAnalytics.tsx`.

## One-time setup (Dalia)

1. In Google Cloud Console (console.cloud.google.com), pick or create a project, then enable the **Google Analytics Data API** and the **Google Analytics Admin API**.
2. IAM and Admin, Service accounts: create one (for example `giftpicker-dashboard`). Open it, Keys, Add key, JSON. A key file downloads.
3. In Google Analytics, Admin, Property access management: add the service account's email (it ends in `iam.gserviceaccount.com`) as a **Viewer**.
4. In Google Analytics, Admin, Custom definitions: create event-scoped custom dimensions with these exact parameter names: `destination`, `gift_name`, `step_index`, `question_id`. They report from the day they are created, so the Amazon-or-brand split and the top-gifts table fill in from then on.
5. In a terminal: `cd ~/Sites/gift-picker && npx wrangler secret put GA_SERVICE_ACCOUNT`, then paste the whole JSON key file contents and press Enter. Then delete the downloaded key file.

Optional: set `GA_PROPERTY_ID` (the numeric property ID) as a worker variable to skip the property lookup.

## Local preview

`npm run dev`, then open `/review?tab=analytics&mock` to see the dashboard with sample data (dev builds only; production never ships the sample data).
