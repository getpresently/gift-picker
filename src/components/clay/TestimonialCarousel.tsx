import { useCallback, useEffect, useRef, useState } from "react";

type Quote = { q: string; em?: string; n: string };

// Real comments from GiftPicker users, quoted verbatim (trimmed only at
// sentence breaks). `em` is an optional phrase set in plum italic.
const HERO: Quote = {
  q: "Love this! This is so helpful to give thoughtful gifts especially when you don’t have days/weeks to hunt.",
  em: "thoughtful gifts",
  n: "Amanda E.",
};

// Shown three at a time beside the hero quote, like notes in a margin.
const PAGES: Quote[][] = [
  [
    { q: "This is addictive! Already filled it out multiple times looking for gifts for my fam. Life saver!!", n: "Anna F." },
    { q: "My boyfriend uses the V60 every single morning. It was the perfect choice.", n: "Ella R." },
    { q: "Took 90 seconds. Picked something better than I would have in an hour.", n: "Priya S." },
  ],
  [
    { q: "Perfect timing, I’ve been dragging my feet on gift shopping for my picky fam. Ty for the help!", n: "Peter W." },
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

const ADVANCE_MS = 8000;
const SERIF = '"Instrument Serif", serif';
const SANS = "Geist, sans-serif";
const INK = "#231410";
const RULE = "1px solid rgba(35,20,16,0.12)";

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
        fontSize: size >= 34 ? 12 : 10,
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

function Byline({ name, tone, size, fontSize }: { name: string; tone: number; size: number; fontSize: number }) {
  return (
    <figcaption style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Avatar name={name} tone={tone} size={size} />
      <span style={{ fontFamily: SANS, fontSize, fontWeight: 600, color: INK }}>{name}</span>
      <Stars />
    </figcaption>
  );
}

/**
 * Homepage testimonials: one fixed hero quote, with three shorter quotes
 * beside it as plain margin notes between hairline rules. The notes fade to
 * the next three every ADVANCE_MS; page dots below let visitors step through.
 * All pages share one grid cell, so the section never changes height.
 * Rotation pauses on hover or focus, stops for good once the visitor picks a
 * page, and never runs for reduced-motion users. Phones can also swipe.
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
        gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(0, 1fr)",
        gap: isMobile ? 32 : 72,
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
            margin: "0 0 22px",
            fontFamily: SERIF,
            fontSize: isMobile ? 30 : 42,
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
        <Byline name={HERO.n} tone={0} size={34} fontSize={14} />
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
          {PAGES.map((notes, p) => {
            const active = p === page;
            return (
              <div
                key={p}
                aria-hidden={!active}
                style={{
                  gridArea: "1 / 1",
                  alignSelf: "start",
                  opacity: active ? 1 : 0,
                  transition: "opacity 600ms ease",
                  pointerEvents: active ? "auto" : "none",
                }}
              >
                {notes.map((t, k) => (
                  <figure
                    key={t.n}
                    style={{
                      margin: 0,
                      padding: isMobile ? "18px 0" : "22px 0",
                      borderTop: RULE,
                      borderBottom: k === notes.length - 1 ? RULE : undefined,
                    }}
                  >
                    <blockquote
                      style={{
                        margin: "0 0 12px",
                        fontFamily: SERIF,
                        fontSize: isMobile ? 21 : 23,
                        lineHeight: 1.22,
                        letterSpacing: "-0.01em",
                        color: INK,
                        textWrap: "pretty" as never,
                      }}
                    >
                      {t.q}
                    </blockquote>
                    <Byline name={t.n} tone={p * 3 + k + 1} size={26} fontSize={13} />
                  </figure>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 12, marginLeft: -9 }}>
          {PAGES.map((_, p) => (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-label={`Show quote set ${p + 1} of ${PAGES.length}`}
              aria-current={p === page}
              style={{ border: "none", background: "transparent", padding: 12, cursor: "pointer", lineHeight: 0 }}
            >
              <span
                aria-hidden
                style={{
                  display: "block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: p === page ? "rgba(35,20,16,0.7)" : "rgba(35,20,16,0.18)",
                  transition: "background 250ms ease",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
