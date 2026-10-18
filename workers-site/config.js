/** The Apps Script web app behind the gift sheet, the forms, and the review password check. */
export const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwPuaXtXuurdqNg94_mGoOR1YHXqKrJyZrkxkt09oFbGGZtS_KdH44vhJNn4qLzeJqhuQ/exec";

/** KV key for the live gift rows (slimmed: row_id, Gift, Brand, ...), refreshed by the cron in index.js. */
export const GIFTS_KEY = "gifts:live:v1";

/** A gift page path; the capture is the gift's row id. */
export const GIFT_PATH = /^\/gift\/(r\d+)\/?$/;
