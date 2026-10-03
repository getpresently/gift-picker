import { useCallback, useEffect, useRef, useState } from "react";

type Quote = { q: string; em?: string; n: string };

// Real comments from GiftPicker users, quoted verbatim (trimmed only at
// sentence breaks). `em` is an optional phrase set in plum italic.
const HERO: Quote = {
  q: "Love this! This is so helpful to give thoughtful gifts especially when you don’t have days/weeks to hunt.",
  em: "thoughtful gifts",
  n: "Amanda E.",
};

// Shown two at a time beside the hero quote, so three are always visible.
const PAGES: Quote[][] = [
  [
    { q: "This is addictive! Already filled it out multiple times looking for gifts for my fam. Life saver!!", n: "Anna F." },
    { q: "My boyfriend uses the V60 every single morning. It was the perfect choice.", n: "Ella R." },
  ],
  [
    { q: "Perfect timing, I’ve been dragging my feet on gift shopping for my picky fam. Ty for the help!", n: "Peter W." },
    { q: "Took 90 seconds. Picked something better than I would have in an hour.", n: "Priya S." },
  ],
  [
    { q: "Easy to use and gave me a great idea for my gifts for my siblings. Thanks!", n: "Max G." },
    { q: "Super easy to use and will definitely be using for ideas for family and friends.", n: "Jigesh M." },
  ],
  [
    { q: "Works great and makes the decision process easier.", n: "Mario S." },
    { q: "Simple, fast, and fun :)", n: "Bhaumik P." },
  ],
];

const TONES = [
  { bg: "#FFD9CC", fg: "#8A3A2A" },
  { bg: "#FFE7B0", fg: "#7A5410" },
  { bg: "#EBD3E4", fg: "#7E3F71" },
];

const ADVANCE_MS = 7000;
const SERIF = '"Instrument Serif", serif';
const SANS = "Geist, sans-serif";
const INK = "#231410";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .replace(/[^A-Z]/gi, "")
    .toUpperCase();

function Avatar({ name, tone, size }: { name: string; tone: number; size: number }) {
  const t = TONES[tone % TONES.length];
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: t.bg,
        color: t.fg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: SANS,
        fontSize: size >= 34 ? 12 : 10.5,
        fontWeight: 600,
        letterSpacing: "0.02em",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 6px -1px rgba(80,30,30,0.16)",
      }}
    >
      {initials(name)}
    </span>
  );
}

function Stars() {
  return (
    <span style={{ display: "inline-flex", gap: 1 }} aria-label="5 out of 5 stars">
      {[0, 1, 2, 3, 4].map((k) => (
        <svg key={k} width={11} height={11} viewBox="0 0 16 16" fill="#E64B45" aria-hidden>
          <path d="M8 1l2.1 4.4 4.9.7-3.5 3.4.8 4.8L8 12l-4.3 2.3.8-4.8L1 6.1l4.9-.7z" />
        </svg>
      ))}
    </span>
  );
}

function Byline({ name, tone, size }: { name: string; tone: number; size: number }) {
  return (
    <figcaption style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Avatar name={name} tone={tone} size={size} />
      <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: INK }}>{name}</span>
      <Stars />
    </figcaption>
  );
}

function ArrowButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous quotes" : "Next quotes"}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        color: "rgba(35,20,16,0.55)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {dir === "prev" ? <path d="M10 3L5 8l5 5" /> : <path d="M6 3l5 5-5 5" />}
      </svg>
    </button>
  );
}

/**
 * Homepage testimonials: one fixed hero quote, plus a pair of smaller quote
 * cards that rotate through the rest, so three are always on screen.
 * All pages share one grid cell, so the section never changes height.
 * The pair auto-advances every ADVANCE_MS, pauses on hover or focus, stops
 * for good once the visitor navigates, and never moves for reduced-motion
 * users. Arrows and page bars navigate; phones can also swipe.
 */
export function TestimonialCarousel({ isMobile }: { isMobile: boolean }) {
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number, byUser = true) => {
    setPage(((i % PAGES.length) + PAGES.length) % PAGES.length);
    if (byUser) setStopped(true);
  }, []);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused || stopped) return;
    const t = window.setTimeout(() => go(page + 1, false), ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [page, paused, stopped, go]);

  const [before, after] = HERO.em ? HERO.q.split(HERO.em) : [HERO.q, ""];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.15fr) minmax(0, 1fr)",
        gap: isMobile ? 28 : 56,
        alignItems: "center",
      }}
    >
      <figure style={{ margin: 0 }}>
        <div
          aria-hidden
          style={{ fontFamily: SERIF, fontSize: isMobile ? 88 : 120, lineHeight: 1, height: isMobile ? 44 : 60, color: "#C4477E", opacity: 0.35 }}
        >
          &ldquo;
        </div>
        <blockquote
          style={{
            margin: "0 0 20px",
            fontFamily: SERIF,
            fontSize: isMobile ? 30 : 40,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            color: INK,
            textWrap: "balance" as never,
          }}
        >
          {before}
          {HERO.em && <em style={{ color: "#C4477E", fontStyle: "italic" }}>{HERO.em}</em>}
          {after}
        </blockquote>
        <Byline name={HERO.n} tone={0} size={34} />
      </figure>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="More of what people say"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(page + (dx < 0 ? 1 : -1));
        }}
      >
        <div style={{ display: "grid" }} aria-live={stopped ? "polite" : "off"}>
          {PAGES.map((pair, p) => {
            const active = p === page;
            return (
              <div
                key={p}
                aria-hidden={!active}
                style={{
                  gridArea: "1 / 1",
                  display: "grid",
                  gridTemplateRows: "1fr 1fr",
                  gap: 14,
                  opacity: active ? 1 : 0,
                  transform: active ? "translateY(0)" : "translateY(6px)",
                  transition: "opacity 450ms ease, transform 450ms ease",
                  pointerEvents: active ? "auto" : "none",
                }}
              >
                {pair.map((t, k) => (
                  <figure
                    key={t.n}
                    style={{
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: isMobile ? "18px 20px" : "22px 24px",
                      borderRadius: 22,
                      background: "linear-gradient(160deg, rgba(255,252,245,0.85) 0%, rgba(248,236,218,0.85) 100%)",
                      boxShadow: "inset 0 0 0 1px rgba(35,20,16,0.06), inset 0 1px 0 rgba(255,255,255,0.8), 0 10px 24px -16px rgba(120,40,30,0.3)",
                    }}
                  >
                    <blockquote
                      style={{
                        margin: 0,
                        fontFamily: SERIF,
                        fontSize: isMobile ? 21 : 23,
                        lineHeight: 1.2,
                        letterSpacing: "-0.01em",
                        color: INK,
                        textWrap: "pretty" as never,
                      }}
                    >
                      {t.q}
                    </blockquote>
                    <Byline name={t.n} tone={p * 2 + k + 1} size={28} />
                  </figure>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14 }}>
          <ArrowButton dir="prev" onClick={() => go(page - 1)} />
          {PAGES.map((_, p) => (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-label={`Show quotes ${p * 2 + 1} and ${p * 2 + 2}`}
              aria-current={p === page}
              style={{ border: "none", background: "transparent", padding: "10px 2px", cursor: "pointer" }}
            >
              <span
                aria-hidden
                style={{
                  display: "block",
                  width: p === page ? 22 : 10,
                  height: 4,
                  borderRadius: 999,
                  background: p === page ? "rgba(35,20,16,0.55)" : "rgba(35,20,16,0.16)",
                  transition: "width 250ms ease, background 250ms ease",
                }}
              />
            </button>
          ))}
          <ArrowButton dir="next" onClick={() => go(page + 1)} />
        </div>
      </div>
    </div>
  );
}
