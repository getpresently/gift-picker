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

import type { Answers } from "./questions";

export type FeedbackReason = "link" | "stock" | "dont" | "other";

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
    ack: "Thanks — we'll re-check the source.",
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
    ack: "Got it — we'll learn from this.",
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

type SubmitPayload = {
  giftId: string;
  giftName: string;
  brand: string;
  reason: FeedbackReason;
  reasonLabel: string;
  detail?: string;
  answers: Answers;
  at: string;
};

const ENDPOINT = (import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined)?.trim() ?? "";

/**
 * Fire-and-forget POST to the Apps Script webhook. Uses `no-cors` mode
 * because Apps Script Web Apps don't return CORS headers — the request
 * still reaches the script and writes the row.
 */
export async function postFeedback(payload: SubmitPayload): Promise<void> {
  if (!ENDPOINT) {
    if (typeof console !== "undefined") {
      console.info("[feedback] endpoint not configured — logging instead", payload);
    }
    return;
  }
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      // Apps Script wants text/plain so the JSON arrives intact in e.postData.contents
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Don't block the UI on a feedback failure; just surface to console
    if (typeof console !== "undefined") {
      console.warn("[feedback] submit failed", err);
    }
  }
}
