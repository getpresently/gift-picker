/**
 * "Email my saved gifts": the saved-gifts sheet posts the shopper's address
 * and gift ids to /api/email-list, and the worker (workers-site/index.js)
 * sends the list through Resend and logs the address to the sheet. Both
 * sides share these checks.
 */

/** The most gifts one email lists. */
export const MAX_EMAIL_GIFTS = 50;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

export function isValidEmail(email: string): boolean {
  const e = email.trim();
  return e.length <= 254 && EMAIL_RE.test(e);
}

export type EmailListResult = "sent" | "limit" | "error";

export async function emailSavedList(email: string, ids: string[], optIn: boolean, clientId: string, hp = ""): Promise<EmailListResult> {
  // Local previews have no worker behind them; pretend it went out.
  if (import.meta.env?.DEV) {
    await new Promise((r) => setTimeout(r, 700));
    return "sent";
  }
  try {
    const r = await fetch("/api/email-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), ids: ids.slice(0, MAX_EMAIL_GIFTS), optIn, clientId, hp }),
    });
    if (r.status === 429) return "limit";
    return r.ok ? "sent" : "error";
  } catch {
    return "error";
  }
}
