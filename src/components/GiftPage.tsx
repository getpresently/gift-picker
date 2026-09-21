import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { ClaySurface } from "./clay/ClaySurface";
import { GiftBox3D } from "./clay/GiftBox3D";
import { Pillow } from "./clay/Pillow";
import { PresentlyMark } from "./clay/PresentlyMark";
import { PriceDisplay } from "./clay/PriceDisplay";
import { Wordmark } from "./clay/Wordmark";
import { useIsMobile } from "../hooks/useIsMobile";
import { useImageFallback } from "../hooks/useImageFallback";
import { useGifts } from "../data/giftsApi";
import { track } from "../data/analytics";
import { isAmazonUrl, openBuyLink as openExternal } from "../data/affiliate";
import { AffiliateDisclosure } from "./clay/AffiliateDisclosure";
import { SiteHeader } from "./clay/SiteHeader";
import { FooterLinks } from "./clay/FooterLinks";

/**
 * Standalone, shareable page for a single gift at /gift/:giftId.
 *
 * This is the client-side render; the Cloudflare Worker prerenders
 * title/meta/OG and a static content block into the served HTML for
 * crawlers, so these URLs are indexable even without JavaScript.
 * Gift ids are the sheet row ids ("r2", "r3", ...) synthesized by the
 * Apps Script, so links survive as long as rows aren't reordered.
 */

export function GiftPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { giftId } = useParams<{ giftId: string }>();
  const { data: allGifts, loading, error } = useGifts();

  const gift = useMemo(
    () => allGifts.find((g) => g.id === giftId) ?? null,
    [allGifts, giftId],
  );
  const { failed: imgFailed, onError: onImgError } = useImageFallback(gift?.image);

  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      track("gift_link_copy", { gift_id: gift?.id, source: "gift_page" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: leave the button as-is.
    }
  };

  return (
    <div style={{ background: "#FBF1E1", minHeight: "100vh", position: "relative" }}>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <AmbientGlow variant="results" />

        <SiteHeader onLogoClick={() => navigate("/")}>
          <Pillow tone="coral" size="sm" onClick={() => navigate("/quiz")}>
              Find a gift →
            </Pillow>
        </SiteHeader>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: isMobile ? "28px 20px 48px" : "48px 56px 64px",
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          {loading && (
            <p
              style={{
                fontFamily: "Geist, sans-serif",
                textAlign: "center",
                color: "rgba(35,20,16,0.62)",
                padding: "80px 0",
              }}
            >
              Loading this gift…
            </p>
          )}

          {!loading && (error || !gift) && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <h1
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: isMobile ? 32 : 44,
                  fontWeight: 400,
                  color: "#231410",
                  margin: "0 0 12px",
                }}
              >
                We couldn't find that gift.
              </h1>
              <p
                style={{
                  fontFamily: "Geist, sans-serif",
                  fontSize: 15,
                  color: "rgba(35,20,16,0.6)",
                  margin: "0 0 24px",
                }}
              >
                It may have been retired from the catalog. Take the quiz and
                we'll find you something even better.
              </p>
              <Pillow tone="coral" size="lg" onClick={() => navigate("/quiz")}>
                Take the quiz · 60s
              </Pillow>
            </div>
          )}

          {!loading && !error && gift && (
            <ClaySurface
              tint="cream"
              style={{ padding: isMobile ? 18 : 28, overflow: "hidden" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: isMobile ? 18 : 32,
                  alignItems: "start",
                }}
              >
                {/* Image well */}
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "1/1",
                    borderRadius: 18,
                    background: "linear-gradient(160deg, #FFE9A8, #F7C76A)",
                    overflow: "hidden",
                    boxShadow:
                      "inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 -20px 40px -10px rgba(0,0,0,0.12)",
                  }}
                >
                  {gift.image && !imgFailed ? (
                    <img
                      src={gift.image}
                      alt={gift.name}
                      onError={onImgError}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <GiftBox3D size={isMobile ? 150 : 210} color="butter" rotate={-10} ribbonColor="#FF8166" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
                  {gift.brand && (
                    <div
                      style={{
                        fontFamily: "Geist, sans-serif",
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(35,20,16,0.62)",
                        fontWeight: 600,
                      }}
                    >
                      {gift.brand}
                    </div>
                  )}
                  <h1
                    style={{
                      fontFamily: '"Instrument Serif", serif',
                      fontSize: isMobile ? 30 : 40,
                      fontWeight: 400,
                      lineHeight: 1.1,
                      letterSpacing: "-0.02em",
                      margin: 0,
                      color: "#231410",
                    }}
                  >
                    {gift.name}
                  </h1>
                  <PriceDisplay gift={gift} variant="hero" />
                  {gift.description && (
                    <p
                      style={{
                        fontFamily: "Geist, sans-serif",
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: "rgba(35,20,16,0.75)",
                        margin: 0,
                      }}
                    >
                      {gift.description}
                    </p>
                  )}
                  {gift.interests.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {gift.interests.map((t) => (
                        <span
                          key={t}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "rgba(35,20,16,0.06)",
                            fontFamily: "Geist, sans-serif",
                            fontSize: 12,
                            color: "rgba(35,20,16,0.7)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Buy CTAs: same Amazon-first rules as the modal */}
                  <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    {gift.amazonLink ? (
                      <>
                        <Pillow
                          tone="coral"
                          size="md"
                          onClick={() => {
                            track("gift_buy_click", {
                              gift_id: gift.id,
                              gift_name: gift.name,
                              brand: gift.brand,
                              price: gift.price,
                              source: "gift_page",
                              destination: "amazon",
                            });
                            openExternal(gift.amazonLink);
                          }}
                        >
                          Buy on Amazon →
                        </Pillow>
                        {gift.link && (
                          <Pillow
                            tone="ink"
                            size="md"
                            onClick={() => {
                              track("gift_buy_click", {
                                gift_id: gift.id,
                                gift_name: gift.name,
                                brand: gift.brand,
                                price: gift.price,
                                source: "gift_page",
                                destination: "brand",
                              });
                              openExternal(gift.link);
                            }}
                          >
                            Buy on {gift.brand || "store"} →
                          </Pillow>
                        )}
                      </>
                    ) : (
                      <Pillow
                        tone="coral"
                        size="md"
                        onClick={() => {
                          track("gift_buy_click", {
                            gift_id: gift.id,
                            gift_name: gift.name,
                            brand: gift.brand,
                            price: gift.price,
                            source: "gift_page",
                            destination: "brand",
                          });
                          openExternal(gift.link);
                        }}
                      >
                        Buy on {gift.brand || "store"} →
                      </Pillow>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={copyLink}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      alignSelf: "flex-start",
                      fontFamily: "Geist, sans-serif",
                      fontSize: 12,
                      color: copied ? "#4CAF50" : "rgba(35,20,16,0.55)",
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                    }}
                  >
                    {copied ? "Link copied ✓" : "🔗 Copy link to this gift"}
                  </button>
                </div>
              </div>
            </ClaySurface>
          )}

          {/* Cross-sell into the quiz */}
          {!loading && !error && gift && (
            <div style={{ textAlign: "center", marginTop: isMobile ? 32 : 44 }}>
              <p
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontSize: isMobile ? 22 : 26,
                  color: "#231410",
                  margin: "0 0 14px",
                }}
              >
                Not quite it? Find their <em style={{ color: "#C4477E" }}>perfect</em> gift.
              </p>
              <Pillow tone="ink" size="lg" onClick={() => navigate("/quiz")}>
                Take the 60-second quiz →
              </Pillow>
            </div>
          )}

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
            {gift && (gift.amazonLink || isAmazonUrl(gift.link)) && <AffiliateDisclosure />}
          </footer>
        </div>
      </div>
    </div>
  );
}
