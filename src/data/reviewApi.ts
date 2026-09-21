import { useCallback, useEffect, useState } from "react";
import { API_ENDPOINT, adaptRow } from "./giftsApi";
import type { Gift } from "./gifts";

/**
 * Data + write layer for the internal /review tool. Reuses API_ENDPOINT
 * and adaptRow from giftsApi.ts (the same Apps Script + row shape), and
 * layers on the Review-status/Feedback fields the public site never reads.
 */

export type ReviewGift = Gift & {
  reviewed: boolean;
  feedback: string;
};

type RawRow = Record<string, string | number | boolean | undefined>;

/** "Review status" comes back as a real boolean OR the strings TRUE/FALSE. */
function parseReviewed(raw: RawRow["Review status"]): boolean {
  if (typeof raw === "boolean") return raw;
  return String(raw ?? "").trim().toUpperCase() === "TRUE";
}

function adaptReviewRow(row: RawRow): ReviewGift {
  // adaptRow only reads the string/number columns, never "Review status",
  // so the boolean in this row shape is safe to widen away here.
  const giftRow = row as Record<string, string | number | undefined>;
  return {
    ...adaptRow(giftRow),
    reviewed: parseReviewed(row["Review status"]),
    feedback: String(row.Feedback ?? "").trim(),
  };
}

type FetchState = {
  data: ReviewGift[];
  loading: boolean;
  error: string | null;
};

/**
 * Fetches the full catalog for review. Unlike the public useGifts, this
 * always bypasses HTTP caching (the sheet changes as Dalia works through
 * it) and carries the Review status / Feedback columns.
 */
export function useReviewGifts(): FetchState & { reload: () => void } {
  const [state, setState] = useState<FetchState>({ data: [], loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ data: s.data, loading: true, error: null }));
    fetch(`${API_ENDPOINT}?tab=Gifts`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`Gift API responded ${r.status}`);
        return r.json();
      })
      .then((payload: { data?: RawRow[] }) => {
        if (cancelled) return;
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setState({ data: rows.map(adaptReviewRow), loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ data: [], loading: false, error: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

/* ------------------------------------------------------------------ *
 * Secret storage. Never logged, never put in a URL.
 * ------------------------------------------------------------------ */

const SECRET_KEY = "gp_review_secret";

export function loadStoredSecret(): string | null {
  try {
    return window.localStorage.getItem(SECRET_KEY);
  } catch {
    return null;
  }
}

function storeSecret(secret: string): void {
  try {
    window.localStorage.setItem(SECRET_KEY, secret);
  } catch {
    // No storage available (private mode etc.), the unlock still works
    // for this tab, it just won't survive a reload.
  }
}

function clearStoredSecret(): void {
  try {
    window.localStorage.removeItem(SECRET_KEY);
  } catch {
    // Nothing to clear.
  }
}

/* ------------------------------------------------------------------ *
 * Write API. POST body is sent as a plain string (fetch defaults to a
 * text/plain content type for a string body), which keeps the request
 * simple enough to skip a CORS preflight and still readable as JSON.
 * ------------------------------------------------------------------ */

export type ReviewErrorCode =
  | "unauthorized"
  | "not_configured"
  | "row_moved"
  | "bad_row"
  | "bad_value"
  | "endpoint_missing"
  | "network";

export type ReviewResult<T extends object = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: ReviewErrorCode };

async function postReview<T extends object = Record<string, never>>(
  body: Record<string, unknown>,
): Promise<ReviewResult<T>> {
  let json: unknown;
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(body),
    });
    json = await res.json();
  } catch {
    return { ok: false, error: "network" };
  }
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    // The live server may not have the review handler yet: an unknown
    // `type` comes back as a plain { error: "Unknown type: review" }.
    if (typeof obj.error === "string" && obj.error.startsWith("Unknown type")) {
      return { ok: false, error: "endpoint_missing" };
    }
    if (obj.ok === true) return obj as ReviewResult<T> & { ok: true };
    if (obj.ok === false) {
      const code = typeof obj.error === "string" ? (obj.error as ReviewErrorCode) : "network";
      return { ok: false, error: code };
    }
  }
  return { ok: false, error: "network" };
}

export function pingReview(secret: string): Promise<ReviewResult> {
  return postReview({ type: "review", secret, action: "ping" });
}

export type SetRowInput = {
  secret: string;
  rowId: string;
  gift: string;
  status?: string;
  reviewed?: boolean;
};

export type SetRowResult = ReviewResult<{ rowId: string; status?: string; reviewed?: boolean }>;

/**
 * Change a row's Status / Review status. `gift` must be the row's exact
 * current Gift value, the server refuses with `row_moved` if that sheet
 * row no longer holds that gift (e.g. rows were resorted mid-review).
 */
export function setReviewRow(input: SetRowInput): Promise<SetRowResult> {
  const body: Record<string, unknown> = {
    type: "review",
    secret: input.secret,
    action: "set",
    rowId: input.rowId,
    gift: input.gift,
  };
  if (input.status !== undefined) body.status = input.status;
  if (input.reviewed !== undefined) body.reviewed = input.reviewed;
  return postReview(body);
}

/* ------------------------------------------------------------------ *
 * Unlock flow: check localStorage on mount, ping in the background,
 * and expose unlock()/lock() for the password gate UI.
 * ------------------------------------------------------------------ */

export type UnlockState = {
  unlocked: boolean;
  checking: boolean;
  /** The verified secret, needed to authenticate write calls. Null when locked. */
  secret: string | null;
  error: ReviewErrorCode | null;
  unlock: (secret: string) => Promise<boolean>;
  lock: () => void;
};

export function useReviewUnlock(): UnlockState {
  const [secret, setSecret] = useState<string | null>(() => loadStoredSecret());
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(() => loadStoredSecret() !== null);
  const [error, setError] = useState<ReviewErrorCode | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!secret) {
      setChecking(false);
      setUnlocked(false);
      return;
    }
    setChecking(true);
    pingReview(secret).then((res) => {
      if (cancelled) return;
      setChecking(false);
      if (res.ok) {
        setUnlocked(true);
        setError(null);
        return;
      }
      setUnlocked(false);
      setError(res.error);
      if (res.error === "unauthorized") {
        clearStoredSecret();
        setSecret(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [secret]);

  const unlock = useCallback(async (candidate: string): Promise<boolean> => {
    setChecking(true);
    setError(null);
    const res = await pingReview(candidate);
    setChecking(false);
    if (res.ok) {
      storeSecret(candidate);
      setSecret(candidate);
      setUnlocked(true);
      return true;
    }
    setError(res.error);
    setUnlocked(false);
    return false;
  }, []);

  const lock = useCallback(() => {
    clearStoredSecret();
    setSecret(null);
    setUnlocked(false);
  }, []);

  return { unlocked, checking, secret: unlocked ? secret : null, error, unlock, lock };
}
