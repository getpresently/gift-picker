/**
 * Per-card "Something off?" feedback.
 *
 * Submissions POST to a Google Apps Script webhook (URL set via the
 * VITE_FEEDBACK_ENDPOINT env var). The Apps Script appends a row to a
 * "Feedback" sheet in the same spreadsheet that hosts the gift database.
 * See README in the redesign commit for the script body to deploy.
 *
 * If the endpoint isn't configured, submissions fall back to a console.log
 * so dev/preview environments don't error out.
 */

import { humanizeAnswers, type Answers } from "./questions";

/**
 * Visible-in-popover reasons + a couple of implicit signals ("heart")
 * that the site emits without ever showing a popover option for them.
 */
export type FeedbackReason = "link" | "image" | "stock" | "dont" | "other" | "heart";

export type FeedbackOption = {
  v: FeedbackReason;
  l: string;
  e: string;
  tone: "amber" | "coral" | "plum";
  ack: string;
};

export const FEEDBACK_OPTIONS: FeedbackOption[] = [
  {
    v: "link",
    l: "Link not working",
    e: "🔗",
    tone: "amber",
    ack: "Thanks, we'll re-check the source.",
  },
  {
    v: "image",
    l: "Image broken",
    e: "🖼️",
    tone: "amber",
    ack: "Thanks, we'll fix the photo.",
  },
  {
    v: "stock",
    l: "Product not available",
    e: "📦",
    tone: "amber",
    ack: "Noted. We'll surface alternatives next time.",
  },
  {
    v: "dont",
    l: "Don't like product",
    e: "👎",
    tone: "coral",
    ack: "Got it, we'll learn from this.",
  },
  {
    v: "other",
    l: "Other feedback",
    e: "✏️",
    tone: "plum",
    ack: "Thanks for the note.",
  },
];

export type FeedbackRecord = {
  option: FeedbackOption;
  detail?: string;
  at: string; // ISO timestamp
};

/**
 * Reports that mean the shopper can't or won't buy it (disliked, unavailable,
 * dead link) dim the gift and sink it in the results. A broken photo or an
 * "other" note leaves it exactly where it is: the gift is still a good pick.
 */
const DEMOTING_REASONS: ReadonlySet<FeedbackReason> = new Set<FeedbackReason>(["dont", "stock", "link"]);
export const isDemoting = (r?: FeedbackRecord): boolean => !!r && DEMOTING_REASONS.has(r.option.v);

/**
 * Wire payloads sent to the Apps Script. `answers` is the humanized
 * form (friendly labels like "Partner", "Young adult", "Birthday")
 * rather than the internal v-codes, so the Feedback and Requests sheets
 * read the way a human did the quiz.
 */
type WireAnswers = Record<string, unknown>;

type FeedbackPayload = {
  type: "feedback";
  giftId: string;
  giftName: string;
  brand: string;
  reason: FeedbackReason;
  reasonLabel: string;
  detail?: string;
  answers: WireAnswers;
  at: string;
  clientId: string;
};

type RequestPayload = {
  type: "request";
  answers: WireAnswers;
  at: string;
  clientId: string;
};

type NotifyPayload = {
  type: "notify";
  email: string;
  answers: WireAnswers;
  at: string;
  clientId: string;
};

/**
 * Stable per-device anonymous identifier. Lets us distinguish "10 hearts
 * from 10 people" vs "10 hearts from the same browser" without any login
 * or PII. Stored in localStorage so it persists across visits on the same
 * browser; a new device or a cleared profile produces a new id.
 *
 * Falls back gracefully if localStorage is unavailable (private mode, SSR).
 */
const CLIENT_ID_KEY = "gp_client_id";
function getClientId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `gp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

const ENDPOINT =
  (import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined)?.trim() ||
  "https://script.google.com/macros/s/AKfycbwPuaXtXuurdqNg94_mGoOR1YHXqKrJyZrkxkt09oFbGGZtS_KdH44vhJNn4qLzeJqhuQ/exec";

/**
 * Fire-and-forget POST to the Apps Script webhook. Uses `no-cors` mode
 * because Apps Script Web Apps don't return CORS headers; the request
 * still reaches the script and writes the row.
 *
 * The Apps Script routes by `payload.type`: "feedback" writes to the
 * Feedback sheet, "request" writes to the Requests sheet (sample script
 * in the redesign commit summary).
 */
async function postEvent(payload: FeedbackPayload | RequestPayload | NotifyPayload): Promise<void> {
  if (!ENDPOINT) {
    if (typeof console !== "undefined") {
      console.info(`[${payload.type}] endpoint not configured, logging instead`, payload);
    }
    return;
  }
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn(`[${payload.type}] submit failed`, err);
    }
  }
}

/**
 * Public callers pass raw `Answers` (v-codes); we humanize at the wire
 * boundary so internal types stay clean but the sheet rows are readable.
 */
type FeedbackInput = Omit<FeedbackPayload, "type" | "clientId" | "answers"> & {
  answers: Answers;
};

export async function postFeedback(payload: FeedbackInput): Promise<void> {
  return postEvent({
    type: "feedback",
    clientId: getClientId(),
    ...payload,
    answers: humanizeAnswers(payload.answers),
  });
}

/**
 * User-initiated "Request more in this category", sent when the user
 * isn't satisfied with the picks and wants the catalog to grow in this
 * direction. The Apps Script appends a row to a "Requests" sheet.
 */
export async function postRequest(answers: Answers): Promise<void> {
  return postEvent({
    type: "request",
    answers: humanizeAnswers(answers),
    at: new Date().toISOString(),
    clientId: getClientId(),
  });
}

/**
 * Optional email a shopper leaves after "Request more", so we can send one
 * note when gifts for that request are added. The Apps Script writes it onto
 * their Requests row ("notify" handler). Keep NOTIFY_OPT_IN_LIVE false until
 * the updated script is deployed, or emails would be silently dropped.
 */
export const NOTIFY_OPT_IN_LIVE = false;

export async function postNotify(answers: Answers, email: string): Promise<void> {
  return postEvent({
    type: "notify",
    email: email.trim(),
    answers: humanizeAnswers(answers),
    at: new Date().toISOString(),
    clientId: getClientId(),
  });
}
