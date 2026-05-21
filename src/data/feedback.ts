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
    ack: "Thanks — we'll re-check the source.",
  },
  {
    v: "image",
    l: "Image broken",
    e: "🖼️",
    tone: "amber",
    ack: "Thanks — we'll fix the photo.",
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

type FeedbackPayload = {
  type: "feedback";
  giftId: string;
  giftName: string;
  brand: string;
  reason: FeedbackReason;
  reasonLabel: string;
  detail?: string;
  answers: Answers;
  at: string;
};

type RequestPayload = {
  type: "request";
  answers: Answers;
  at: string;
};

const ENDPOINT =
  (import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined)?.trim() ||
  "https://script.google.com/macros/s/AKfycbwPuaXtXuurdqNg94_mGoOR1YHXqKrJyZrkxkt09oFbGGZtS_KdH44vhJNn4qLzeJqhuQ/exec";

/**
 * Fire-and-forget POST to the Apps Script webhook. Uses `no-cors` mode
 * because Apps Script Web Apps don't return CORS headers — the request
 * still reaches the script and writes the row.
 *
 * The Apps Script routes by `payload.type` — "feedback" writes to the
 * Feedback sheet, "request" writes to the Requests sheet (sample script
 * in the redesign commit summary).
 */
async function postEvent(payload: FeedbackPayload | RequestPayload): Promise<void> {
  if (!ENDPOINT) {
    if (typeof console !== "undefined") {
      console.info(`[${payload.type}] endpoint not configured — logging instead`, payload);
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

export async function postFeedback(payload: Omit<FeedbackPayload, "type">): Promise<void> {
  return postEvent({ type: "feedback", ...payload });
}

/**
 * User-initiated "Request more in this category" — sent when the user
 * isn't satisfied with the picks and wants the catalog to grow in this
 * direction. The Apps Script appends a row to a "Requests" sheet.
 */
export async function postRequest(answers: Answers): Promise<void> {
  return postEvent({ type: "request", answers, at: new Date().toISOString() });
}
