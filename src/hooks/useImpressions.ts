import { useCallback, useEffect, useRef } from "react";

/** A card counts as seen once at least half of it has stayed on screen this long, so scrolling past doesn't count. */
const SEEN_RATIO = 0.5;
const SEEN_DELAY_MS = 500;

/**
 * Card impressions on the results page. `refFor(id)` is a stable ref callback
 * for the card showing gift `id`; `onSeen(id)` runs once per gift when at least
 * half the card has been on screen for 500ms. `markSeen(id)` counts a gift at
 * once (a tap on its card proves it was seen). A new `resetKey` (a new ranking)
 * starts the count over for every card on the page.
 */
export function useImpressions(resetKey: unknown, onSeen: (id: string) => void) {
  const onSeenRef = useRef(onSeen);
  onSeenRef.current = onSeen;
  const seen = useRef(new Set<string>());
  const elById = useRef(new Map<string, Element>());
  const idByEl = useRef(new Map<Element, string>());
  const timers = useRef(new Map<string, number>());
  const refs = useRef(new Map<string, (el: Element | null) => void>());
  const observer = useRef<IntersectionObserver | null>(null);

  const cancel = (id: string) => {
    const t = timers.current.get(id);
    if (t !== undefined) window.clearTimeout(t);
    timers.current.delete(id);
  };

  const markSeen = useCallback((id: string) => {
    cancel(id);
    if (seen.current.has(id)) return;
    seen.current.add(id);
    const el = elById.current.get(id);
    if (el) observer.current?.unobserve(el);
    onSeenRef.current(id);
  }, []);

  const watcher = useCallback(() => {
    if (!observer.current && typeof IntersectionObserver !== "undefined") {
      observer.current = new IntersectionObserver((entries) => {
        for (const e of entries) {
          const id = idByEl.current.get(e.target);
          if (!id || seen.current.has(id)) continue;
          if (e.intersectionRatio < SEEN_RATIO) cancel(id);
          else if (!timers.current.has(id)) timers.current.set(id, window.setTimeout(() => markSeen(id), SEEN_DELAY_MS));
        }
      }, { threshold: SEEN_RATIO });
    }
    return observer.current;
  }, [markSeen]);

  const refFor = useCallback((id: string) => {
    let ref = refs.current.get(id);
    if (!ref) {
      ref = (el: Element | null) => {
        const prev = elById.current.get(id);
        if (prev) {
          observer.current?.unobserve(prev);
          idByEl.current.delete(prev);
          elById.current.delete(id);
        }
        if (!el) return cancel(id);
        elById.current.set(id, el);
        idByEl.current.set(el, id);
        if (!seen.current.has(id)) watcher()?.observe(el);
      };
      refs.current.set(id, ref);
    }
    return ref;
  }, [watcher]);

  // A new ranking: forget what was seen and watch every card on the page again.
  useEffect(() => {
    for (const id of [...timers.current.keys()]) cancel(id);
    seen.current = new Set();
    const obs = watcher();
    for (const el of elById.current.values()) {
      obs?.unobserve(el);
      obs?.observe(el);
    }
  }, [resetKey, watcher]);

  useEffect(() => () => {
    observer.current?.disconnect();
    observer.current = null;
    for (const id of [...timers.current.keys()]) cancel(id);
  }, []);

  return { refFor, markSeen };
}
