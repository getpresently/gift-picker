import { useNavigate } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { ClaySurface, type Tint } from "./clay/ClaySurface";
import { GiftBox3D } from "./clay/GiftBox3D";
import { Pillow } from "./clay/Pillow";
import { Wordmark } from "./clay/Wordmark";
import { useIsMobile } from "../hooks/useIsMobile";
import { track } from "../data/analytics";
import { SiteHeader } from "./clay/SiteHeader";
import { FooterLinks } from "./clay/FooterLinks";
import { PresentlyMark } from "./clay/PresentlyMark";

const HOW_STEPS: { n: string; title: string; body: string; tint: Tint }[] = [
  { n: "01", title: "Tell us about them", body: "Closeness, vibes, budget. Six questions, no account.", tint: "rose" },
  { n: "02", title: "We do the thinking", body: "Every gift is hand-curated by our team, then matched to your answers.", tint: "butter" },
  { n: "03", title: "Show up looking great", body: "Send the link or just buy it yourself.", tint: "sage" },
];

// 12 brands → renders cleanly as 6×2 on desktop, 3×4 on mobile.
const BRANDS = [
  "Apple", "Lululemon", "Patagonia", "Pottery Barn", "Anthropologie", "Peloton",
  "Aesop", "Le Creuset", "Diptyque", "Le Labo", "Smeg", "Bose",
];

const PRODUCTHUNT_URL = "https://www.producthunt.com/posts/giftpicker-by-presently";

// Real comments from GiftPicker users, quoted verbatim (trimmed only at
// sentence breaks). The first entry is the featured pull quote; `em` is the
// phrase set in plum italic. Avatar tints cycle through AVATAR_TONES.
const TESTIMONIALS: { q: string; em?: string; n: string }[] = [
  { q: "Love this! This is so helpful to give thoughtful gifts especially when you don\u2019t have days/weeks to hunt.", em: "thoughtful gifts", n: "Amanda E." },
  { q: "Easy to use and gave me a great idea for my gifts for my siblings. Thanks!", n: "Max G." },
  { q: "This is addictive! Already filled it out multiple times looking for gifts for my fam. Life saver!!", n: "Anna F." },
  { q: "Took 90 seconds. Picked something better than I would have in an hour.", n: "Priya S." },
  { q: "Super easy to use and will definitely be using for ideas for family and friends.", n: "Jigesh M." },
  { q: "Perfect timing, I\u2019ve been dragging my feet on gift shopping for my picky fam. Ty for the help!", n: "Peter W." },
  { q: "My boyfriend uses the V60 every single morning. It was the perfect choice.", n: "Ella R." },
  { q: "Simple, fast, and fun :)", n: "Bhaumik P." },
  { q: "Works great and makes the decision process easier.", n: "Mario S." },
];

const AVATAR_TONES = [
  { bg: "#FFD9CC", fg: "#8A3A2A" },
  { bg: "#FFE7B0", fg: "#7A5410" },
  { bg: "#EBD3E4", fg: "#7E3F71" },
];

// Desktop wall columns, balanced by hand by quote length (browser column
// balancing left the third column short).
const WALL_COLUMNS = [
  ["Max G.", "Anna F.", "Bhaumik P."],
  ["Jigesh M.", "Peter W."],
  ["Priya S.", "Ella R.", "Mario S."],
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .replace(/[^A-Z]/gi, "")
    .toUpperCase();
}

function Attribution({ t, i, size }: { t: (typeof TESTIMONIALS)[number]; i: number; size: "lg" | "sm" }) {
  const d = size === "lg" ? 34 : 28;
  const tone = AVATAR_TONES[i % AVATAR_TONES.length];
  return (
    <figcaption style={{ display: "flex", alignItems: "center", gap: 10, marginTop: size === "lg" ? 22 : 14 }}>
      <span
        aria-hidden
        style={{
          width: d,
          height: d,
          borderRadius: "50%",
          background: tone.bg,
          color: tone.fg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Geist, sans-serif",
          fontSize: size === "lg" ? 12 : 11,
          fontWeight: 600,
          letterSpacing: "0.02em",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 6px -1px rgba(80,30,30,0.16)",
        }}
      >
        {initials(t.n)}
      </span>
      <span style={{ fontFamily: "Geist, sans-serif", fontSize: 13, fontWeight: 600, color: "#231410" }}>{t.n}</span>
    </figcaption>
  );
}

function Star({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="#E64B45">
      <path d="M8 1l2.1 4.4 4.9.7-3.5 3.4.8 4.8L8 12l-4.3 2.3.8-4.8L1 6.1l4.9-.7z" />
    </svg>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const goStart = () => {
    track("quiz_start");
    navigate("/quiz");
  };
  const goHome = () => navigate("/");

  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <AmbientGlow variant="landing" />

        <SiteHeader onLogoClick={goHome}>
          <Pillow
              tone={isMobile ? "coral" : "ink"}
              size="sm"
              onClick={goStart}
              style={isMobile ? { fontSize: 13, padding: "8px 14px" } : undefined}
            >
              Start quiz →
            </Pillow>
        </SiteHeader>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: isMobile ? "28px 20px 40px" : "36px 56px 64px",
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          {/* Hero */}
          <section
            style={{
              display: isMobile ? "block" : "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
              gap: 56,
              alignItems: "center",
            }}
          >
            <div>
              <a
                href={PRODUCTHUNT_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px 6px 8px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px -4px rgba(80,30,30,0.15)",
                  fontFamily: "Geist, sans-serif",
                  fontSize: 12,
                  color: "#5A3F36",
                  marginBottom: 20,
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: 14 }}>🏆</span> #3 Product of the Day on ProductHunt
              </a>

              <h1
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: isMobile ? 52 : 84,
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                  color: "#231410",
                  margin: 0,
                  fontWeight: 400,
                  textWrap: "pretty" as never,
                }}
              >
                Stop guessing.<br />
                Start <em style={{ color: "#C4477E", fontStyle: "italic" }}>gifting</em>.
              </h1>
              <p
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: isMobile ? 17 : 19,
                  lineHeight: 1.55,
                  color: "rgba(35,20,16,0.65)",
                  marginTop: 20,
                  maxWidth: 460,
                  textWrap: "pretty" as never,
                }}
              >
                Six questions. A shortlist of gifts they'll actually love. Built for the indecisive and the deeply
                caring.
              </p>

              <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
                <Pillow tone="coral" size="lg" onClick={goStart}>
                  Take the quiz · 60s
                </Pillow>
              </div>

              {/* Social proof, rating + quote only. (Avatar placeholders
                  intentionally omitted until we have real user photos.) */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ display: "flex", gap: 1 }}>
                      {[0, 1, 2, 3, 4].map((i) => <Star key={i} />)}
                    </div>
                    <strong style={{ fontFamily: "Geist, sans-serif", fontSize: 14, color: "#231410" }}>4.8/5</strong>
                  </div>
                  <div
                    style={{
                      fontFamily: '"Instrument Serif", serif',
                      fontStyle: "italic",
                      fontSize: 16,
                      color: "rgba(35,20,16,0.7)",
                      marginTop: 2,
                    }}
                  >
                    “best gift I’ve ever given.”
                  </div>
                </div>
              </div>
            </div>

            {/* Hero illustration: stacked gift boxes */}
            <div
              style={{
                position: "relative",
                height: isMobile ? 320 : 460,
                marginTop: isMobile ? 36 : 0,
              }}
            >
              <div style={{ position: "absolute", top: isMobile ? 30 : 60, left: isMobile ? 30 : 80 }}>
                <GiftBox3D size={isMobile ? 130 : 200} color="butter" rotate={-12} ribbonColor="#FF8166" />
              </div>
              <div style={{ position: "absolute", top: isMobile ? 90 : 130, right: isMobile ? 30 : 60, zIndex: 2 }}>
                <GiftBox3D size={isMobile ? 150 : 230} color="coral" rotate={8} />
              </div>
              <div style={{ position: "absolute", bottom: isMobile ? 10 : 30, left: isMobile ? 80 : 130 }}>
                <GiftBox3D size={isMobile ? 110 : 170} color="plum" rotate={4} ribbonColor="#FFC9B9" />
              </div>
              <ClaySurface
                tint="cream"
                style={{
                  position: "absolute",
                  top: isMobile ? 0 : 20,
                  right: isMobile ? 10 : 0,
                  padding: "10px 14px",
                  borderRadius: 16,
                  fontFamily: "Geist, sans-serif",
                  fontSize: 13,
                  transform: "rotate(6deg)",
                }}
              >
                <div style={{ fontWeight: 600, color: "#231410" }}>For: Maya</div>
                <div style={{ color: "rgba(35,20,16,0.55)", fontSize: 11 }}>Birthday · $50–$120</div>
              </ClaySurface>
            </div>
          </section>

          {/* How it works */}
          <section id="how" style={{ marginTop: isMobile ? 64 : 96 }}>
            <div
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 12,
                letterSpacing: "0.14em",
                color: "rgba(35,20,16,0.55)",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              How it works
            </div>
            <h2
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: isMobile ? 36 : 48,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#231410",
                margin: "0 0 28px",
                fontWeight: 400,
              }}
            >
              Three steps to a <em style={{ color: "#C4477E", fontStyle: "italic" }}>great</em> gift.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {HOW_STEPS.map((step) => (
                <ClaySurface key={step.n} tint={step.tint} style={{ padding: 24 }}>
                  <div
                    style={{
                      fontFamily: '"Instrument Serif", serif',
                      fontSize: 42,
                      color: "rgba(35,20,16,0.5)",
                      lineHeight: 1,
                    }}
                  >
                    {step.n}
                  </div>
                  <div
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#231410",
                      marginTop: 16,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "Geist, sans-serif",
                      fontSize: 14,
                      color: "rgba(35,20,16,0.65)",
                      marginTop: 6,
                      lineHeight: 1.45,
                    }}
                  >
                    {step.body}
                  </div>
                </ClaySurface>
              ))}
            </div>
          </section>

          {/* Brands */}
          <section id="brands" style={{ marginTop: isMobile ? 64 : 96 }}>
            <ClaySurface tint="ink" style={{ padding: isMobile ? "24px 20px" : "36px 40px", color: "#FFF8EE" }}>
              <div
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.14em",
                  color: "rgba(255,248,238,0.55)",
                  textTransform: "uppercase",
                  marginBottom: 18,
                }}
              >
                Curated from 300+ brands · including
              </div>
              {/* 6×2 grid on desktop, 3×4 on mobile, even rows, consistent
                  serif treatment so the strip reads as one cohesive band. */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
                  columnGap: isMobile ? 12 : 24,
                  rowGap: isMobile ? 16 : 22,
                  alignItems: "center",
                  justifyItems: "center",
                  fontFamily: '"Instrument Serif", serif',
                  fontStyle: "italic",
                  fontSize: isMobile ? 19 : 24,
                  color: "#FFF8EE",
                  textAlign: "center",
                }}
              >
                {BRANDS.map((b) => (
                  <span
                    key={b}
                    style={{
                      opacity: 0.82,
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap",
                      lineHeight: 1.1,
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </ClaySurface>
          </section>

          {/* Testimonials */}
          {/* Kept off ClaySurface on purpose so this band doesn't mirror the step cards above. */}
          <section id="testimonials" style={{ marginTop: isMobile ? 64 : 96 }}>
            {(() => {
              const f = TESTIMONIALS[0];
              const [before, after] = f.em ? f.q.split(f.em) : [f.q, ""];
              return (
                <figure style={{ margin: 0, maxWidth: 820 }}>
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
                  <blockquote
                    style={{
                      margin: 0,
                      fontFamily: '"Instrument Serif", serif',
                      fontSize: isMobile ? 32 : 44,
                      lineHeight: 1.1,
                      letterSpacing: "-0.02em",
                      color: "#231410",
                      textWrap: "balance" as never,
                    }}
                  >
                    {before}
                    {f.em && <em style={{ color: "#C4477E", fontStyle: "italic" }}>{f.em}</em>}
                    {after}
                  </blockquote>
                  <Attribution t={f} i={0} size="lg" />
                </figure>
              );
            })()}

            {/* The rest: an editorial wall in three columns on desktop, a
                swipeable row on phones so the page stays short. */}
            {(() => {
              const card = (t: (typeof TESTIMONIALS)[number]) => {
                const i = TESTIMONIALS.indexOf(t);
                return (
                  <figure
                    key={t.n}
                    style={
                      isMobile
                        ? {
                            margin: 0,
                            flex: "0 0 78%",
                            scrollSnapAlign: "start",
                            padding: "20px 20px 18px",
                            borderRadius: 22,
                            background: "rgba(255,255,255,0.55)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 6px 18px -10px rgba(80,30,30,0.25)",
                          }
                        : { margin: 0, paddingTop: 22, borderTop: "1px solid rgba(35,20,16,0.1)" }
                    }
                  >
                    <blockquote
                      style={{
                        margin: 0,
                        fontFamily: '"Instrument Serif", serif',
                        fontStyle: "italic",
                        fontSize: isMobile ? 21 : 23,
                        lineHeight: 1.28,
                        letterSpacing: "-0.01em",
                        color: "#231410",
                      }}
                    >
                      &ldquo;{t.q}&rdquo;
                    </blockquote>
                    <Attribution t={t} i={i} size="sm" />
                  </figure>
                );
              };
              const byName = (n: string) => TESTIMONIALS.find((t) => t.n === n)!;
              return isMobile ? (
                // The rest as a swipeable row on phones, so the page stays short.
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    overflowX: "auto",
                    scrollSnapType: "x mandatory",
                    scrollPadding: "0 20px",
                    margin: "36px -20px 0",
                    padding: "0 20px 6px",
                    scrollbarWidth: "none",
                  }}
                >
                  {TESTIMONIALS.slice(1).map(card)}
                </div>
              ) : (
                // The rest as an editorial wall in three columns.
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", columnGap: 56, marginTop: 64, alignItems: "start" }}>
                  {WALL_COLUMNS.map((col) => (
                    <div key={col[0]} style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                      {col.map((n) => card(byName(n)))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>

          {/* Closing CTA */}
          <section style={{ marginTop: isMobile ? 64 : 96, textAlign: "center" }}>
            <h2
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: isMobile ? 38 : 64,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: "#231410",
                margin: "0 auto 24px",
                fontWeight: 400,
                maxWidth: 680,
                textWrap: "balance" as never,
              }}
            >
              They deserve better than <em style={{ color: "#C4477E", fontStyle: "italic" }}>another</em> scented candle.
            </h2>
            <Pillow tone="coral" size="lg" onClick={goStart}>Take the quiz →</Pillow>
          </section>

          {/* For brands */}
          <section
            id="brands-cta"
            style={{
              marginTop: isMobile ? 48 : 72,
              padding: isMobile ? "22px 20px" : "24px 32px",
              borderRadius: 22,
              background: "rgba(196,71,126,0.07)",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: isMobile ? 16 : 24,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(35,20,16,0.55)",
                  marginBottom: 6,
                }}
              >
                For brands
              </div>
              <div
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: isMobile ? 22 : 26,
                  lineHeight: 1.2,
                  color: "#231410",
                }}
              >
                Make something people love to give? Submit it for review or ask about sponsored placement.
              </div>
            </div>
            <Pillow tone="cream" size="md" onClick={() => navigate("/brands")} style={{ flexShrink: 0 }}>
              Submit a product →
            </Pillow>
          </section>

          {/* Footer */}
          <footer
            style={{
              marginTop: isMobile ? 40 : 56,
              paddingTop: 24,
              borderTop: "1px solid rgba(35,20,16,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <Wordmark size="sm" />
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <PresentlyMark />
              <FooterLinks />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
