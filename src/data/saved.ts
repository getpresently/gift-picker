/** Hearted gift ids, kept in sessionStorage so they survive moving between pages. */
const SAVED_KEY = "giftpicker_saved_v1";

export function loadSaved(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SAVED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function saveSaved(s: Set<string>) {
  try {
    sessionStorage.setItem(SAVED_KEY, JSON.stringify([...s]));
  } catch {
    // no-op
  }
}
