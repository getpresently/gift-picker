import { useCallback, useEffect, useRef, useState } from "react";

// Real comments from GiftPicker users, quoted verbatim (trimmed only at
// sentence breaks). `em` is an optional phrase set in plum italic.
const QUOTES: { q: string; em?: string; n: string }[] = [
  { q: "Love this! This is so helpful to give thoughtful gifts especially when you don’t have days/weeks to hunt.", em: "thoughtful gifts", n: "Amanda E." },
  { q: "This is addictive! Already filled it out multiple times looking for gifts for my fam. Life saver!!", n: "Anna F." },
  { q: "Easy to use and gave me a great idea for my gifts for my siblings. Thanks!", n: "Max G." },
  { q: "Perfect timing, I’ve been dragging my feet on gift shopping for my picky fam. Ty for the help!", n: "Peter W." },
  { q: "My boyfriend uses the V60 every single morning. It was the perfect choice.", n: "Ella R." },
  { q: "Super easy to use and will definitely be using for ideas for family and friends.", n: "Jigesh M." },
  { q: "Took 90 seconds. Picked something better than I would have in an hour.", n: "Priya S." },
  { q: "Works great and makes the decision process easier.", n: "Mario S." },
  { q: "Simple, fast, and fun :)", n: "Bhaumik P." },
];

const TONES = [
  { bg: "#FFD9CC", fg: "#8A3A2A" },
  { bg: "#FFE7B0", fg: "#7A5410" },
  { bg: "#EBD3E4", fg: "#7E3F71" },
];

const ADVANCE_MS = 7000;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .replace(/[^A-Z]/gi, "")
    .toUpperCase();

function Avatar({ i, size, active }: { i: number; size: number; active?: boolean }) {
  const tone = TONES[i % TONES.length];
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: tone.bg,
        color: tone.fg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Geist, sans-serif",
        fontSize: size >= 34 ? 12 : 10.5,
        fontWeight: 600,
        letterSpacing: "0.02em",
        boxShadow: active
          ? `0 0 0 2px #FBF1E1, 0 0 0 3.5px ${tone.fg}`
          : "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 6px -1px rgba(80,30,30,0.16)",
        opacity: active === false ? 0.55 : 1,
        transition: "opacity 200ms ease, box-shadow 200ms ease",
      }}
    >
      {initials(QUOTES[i].n)}
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

function ArrowButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous quote" : "Next quote"}
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
 * Homepage testimonials: one large pull quote at a time, cross-fading.
 * All quotes share one grid cell so the section never changes height.
 * Auto-advances every ADVANCE_MS, pauses on hover or focus, stops for good
 * once the visitor navigates, and never moves for reduced-motion users.
 * The initials row is the navigation (plus arrows on desktop); phones swipe.
 */
export function TestimonialCarousel({ isMobile }: { isMobile: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number, byUser = true) => {
    setIndex(((i % QUOTES.length) + QUOTES.length) % QUOTES.length);
    if (byUser) setStopped(true);
  }, []);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused || stopped) return;
    const t = window.setTimeout(() => go(index + 1, false), ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, stopped, go]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="What people say"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
      style={{ maxWidth: 860 }}
    >
      <div
        aria-hidden
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: isMobile ? 88 : 120,
          lineHeight: 1,
          height: isMobile ? 44 : 60,
          color: "#C4477E",
          opacity: 0.35,
        }}
      >
        &ldquo;
      </div>

      <div style={{ display: "grid" }} aria-live={stopped ? "polite" : "off"}>
        {QUOTES.map((t, i) => {
          const [before, after] = t.em ? t.q.split(t.em) : [t.q, ""];
          const active = i === index;
          return (
            <figure
              key={t.n}
              aria-hidden={!active}
              style={{
                gridArea: "1 / 1",
                margin: 0,
                opacity: active ? 1 : 0,
                transform: active ? "translateY(0)" : "translateY(6px)",
                transition: "opacity 450ms ease, transform 450ms ease",
                pointerEvents: active ? "auto" : "none",
              }}
            >
              <blockquote
                style={{
                  margin: 0,
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: isMobile ? 30 : 42,
                  lineHeight: 1.12,
                  letterSpacing: "-0.02em",
                  color: "#231410",
                  textWrap: "balance" as never,
                }}
              >
                {before}
                {t.em && <em style={{ color: "#C4477E", fontStyle: "italic" }}>{t.em}</em>}
                {after}
              </blockquote>
              <figcaption style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>
                <Avatar i={i} size={34} />
                <span style={{ fontFamily: "Geist, sans-serif", fontSize: 14, fontWeight: 600, color: "#231410" }}>{t.n}</span>
                <Stars />
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, marginTop: isMobile ? 26 : 32, flexWrap: "wrap" }}>
        {!isMobile && <ArrowButton dir="prev" onClick={() => go(index - 1)} />}
        {QUOTES.map((t, i) => (
          <button
            key={t.n}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show the quote from ${t.n}`}
            aria-current={i === index}
            style={{ border: "none", background: "transparent", padding: 2, cursor: "pointer", borderRadius: "50%" }}
          >
            <Avatar i={i} size={isMobile ? 26 : 28} active={i === index} />
          </button>
        ))}
        {!isMobile && <ArrowButton dir="next" onClick={() => go(index + 1)} />}
      </div>
    </div>
  );
}
