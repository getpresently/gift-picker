import { useNavigate } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { ClaySurface, type Tint } from "./clay/ClaySurface";
import { GiftBox3D } from "./clay/GiftBox3D";
import { Pillow } from "./clay/Pillow";
import { PresentlyMark } from "./clay/PresentlyMark";
import { Wordmark } from "./clay/Wordmark";
import { useIsMobile } from "../hooks/useIsMobile";

const HOW_STEPS: { n: string; title: string; body: string; tint: Tint }[] = [
  { n: "01", title: "Tell us about them", body: "Closeness, vibes, budget. Five questions, no account.", tint: "rose" },
  { n: "02", title: "We do the thinking", body: "Real gifts from real brands. Curated, never AI-slop.", tint: "butter" },
  { n: "03", title: "Show up looking great", body: "Send the link or just buy it yourself.", tint: "sage" },
];

const BRANDS = [
  "Apple", "Airbnb", "Pottery Barn", "Anthropologie", "Peloton", "Fujifilm",
  "JBL", "Lululemon", "Keurig", "Anker", "Aesop", "MUJI",
];

const PRODUCTHUNT_URL = "https://www.producthunt.com/posts/giftpicker-by-presently";

const TESTIMONIALS: { q: string; n: string; tint: Tint; dot: string }[] = [
  { q: "My boyfriend uses the V60 every single morning. I look like a genius.", n: "Ella R.", tint: "rose", dot: "#FF9D81" },
  { q: "Finally, a gift quiz that doesn't suggest a scented candle every time.", n: "Marcus T.", tint: "butter", dot: "#7E3F71" },
  { q: "Took 90 seconds. Picked something better than I would have in an hour.", n: "Priya S.", tint: "cream", dot: "#FFD074" },
];

const AVATAR_DOTS = ["#FF9D81", "#7E3F71", "#FFD074", "#9DB378", "#7DDCFF"];

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

  const goStart = () => navigate("/quiz");
  const goHome = () => navigate("/");

  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <AmbientGlow variant="landing" />

        {/* Full-viewport-width sticky nav (inner row stays bounded to page width) */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(251, 241, 225, 0.82)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(35,20,16,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              maxWidth: 1280,
              margin: "0 auto",
              padding: isMobile ? "20px 20px 14px" : "24px 56px 16px",
            }}
          >
            <Wordmark size={isMobile ? "md" : "lg"} onClick={goHome} />
            {!isMobile && (
              <nav
                style={{
                  display: "flex",
                  gap: 28,
                  alignItems: "center",
                  fontFamily: "Geist, sans-serif",
                  fontSize: 14,
                  color: "#5A3F36",
                }}
              >
                <a href="#how" style={{ textDecoration: "none", color: "inherit" }}>How it works</a>
                <a href="#brands" style={{ textDecoration: "none", color: "inherit" }}>Brands</a>
                <a href="#testimonials" style={{ textDecoration: "none", color: "inherit" }}>Reviews</a>
                <Pillow tone="ink" size="sm" onClick={goStart}>Start quiz →</Pillow>
              </nav>
            )}
            {isMobile && (
              <Pillow tone="coral" size="sm" onClick={goStart} style={{ fontSize: 13, padding: "8px 14px" }}>
                Start quiz →
              </Pillow>
            )}
          </div>
        </header>

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
                }}
              >
                Five questions. A pile of gifts they'll actually love. Built for the chronically indecisive — and the
                deeply caring.
              </p>

              <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
                <Pillow tone="coral" size="lg" onClick={goStart}>
                  Take the quiz · 60s
                </Pillow>
              </div>

              {/* Social proof */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
                <div style={{ display: "flex" }}>
                  {AVATAR_DOTS.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: c,
                        marginLeft: i === 0 ? 0 : -10,
                        border: "2.5px solid #FBF1E1",
                        boxShadow: "0 3px 8px rgba(80,30,30,0.2)",
                      }}
                    />
                  ))}
                </div>
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
                    "best gift I've ever given."
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
                <GiftBox3D size={isMobile ? 130 : 200} color="butter" rotate={-12} />
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
                <div style={{ fontWeight: 600, color: "#231410" }}>For: Ella</div>
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
              Three quick taps to a <em style={{ color: "#C4477E", fontStyle: "italic" }}>great</em> gift.
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
          <section id="brands" style={{ marginTop: isMobile ? 56 : 80 }}>
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
                Curated from 200+ brands · including
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: isMobile ? 14 : 28,
                  alignItems: "center",
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: isMobile ? 20 : 26,
                  color: "#FFF8EE",
                }}
              >
                {BRANDS.map((b) => (
                  <span key={b} style={{ opacity: 0.85, letterSpacing: "-0.01em" }}>{b}</span>
                ))}
              </div>
            </ClaySurface>
          </section>

          {/* Testimonials */}
          <section id="testimonials" style={{ marginTop: isMobile ? 48 : 72 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {TESTIMONIALS.map((t) => (
                <ClaySurface key={t.n} tint={t.tint} style={{ padding: 22 }}>
                  <div
                    style={{
                      fontFamily: '"Instrument Serif", serif',
                      fontSize: 28,
                      color: "#C4477E",
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    "
                  </div>
                  <div
                    style={{
                      fontFamily: '"Instrument Serif", serif',
                      fontSize: isMobile ? 20 : 22,
                      fontStyle: "italic",
                      color: "#231410",
                      lineHeight: 1.3,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t.q}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: t.dot,
                        border: "2px solid #FFFCF5",
                        boxShadow: "0 2px 6px rgba(80,30,30,0.18)",
                      }}
                    />
                    <div>
                      <div style={{ fontFamily: "Geist, sans-serif", fontSize: 13, fontWeight: 600, color: "#231410" }}>
                        {t.n}
                      </div>
                      <div style={{ display: "flex", gap: 1, marginTop: 2 }}>
                        {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={10} />)}
                      </div>
                    </div>
                  </div>
                </ClaySurface>
              ))}
            </div>
          </section>

          {/* Closing CTA */}
          <section style={{ marginTop: isMobile ? 56 : 88, textAlign: "center" }}>
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

          {/* Footer */}
          <footer
            style={{
              marginTop: isMobile ? 56 : 80,
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
            <PresentlyMark />
          </footer>
        </div>
      </div>
    </div>
  );
}
