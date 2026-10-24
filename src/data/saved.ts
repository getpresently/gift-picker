import { useSyncExternalStore } from "react";

/**
 * Hearted gift ids, newest first, kept in localStorage so they stay on this
 * device between visits (they used to live in sessionStorage and vanished
 * when the tab closed). Every page reads them through useSaved(), so the
 * header's saved count and the hearts on cards stay in step, across tabs too.
 */
const SAVED_KEY = "giftpicker_saved_v1";

let ids: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY) ?? sessionStorage.getItem(SAVED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function current(): string[] {
  if (!ids) ids = read();
  return ids;
}

function write(next: string[]) {
  ids = next;
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    sessionStorage.removeItem(SAVED_KEY);
  } catch {
    // Private mode or storage off: keep them for this page view only.
  }
  listeners.forEach((fn) => fn());
}

/** Adds or removes a gift; returns true when it was added. */
export function toggleSaved(id: string): boolean {
  const list = current();
  const adding = !list.includes(id);
  write(adding ? [id, ...list] : list.filter((x) => x !== id));
  return adding;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== SAVED_KEY) return;
    ids = read();
    fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/** The saved ids, newest first. */
export function useSavedIds(): string[] {
  return useSyncExternalStore(subscribe, current, () => []);
}

/** The saved ids as a set, for marking hearts on cards. */
export function useSaved(): Set<string> {
  const list = useSavedIds();
  // One Set per list change, not per render.
  return setFor(list);
}

const sets = new WeakMap<string[], Set<string>>();
function setFor(list: string[]): Set<string> {
  let s = sets.get(list);
  if (!s) {
    s = new Set(list);
    sets.set(list, s);
  }
  return s;
}
