import { useNavigate } from "react-router-dom";
import { GiftCarousel } from "./GiftCarousel";
import { Pillow } from "./Pillow";
import { track } from "../../data/analytics";

const SERIF = '"Instrument Serif", serif';
const SANS = "Geist, sans-serif";
const CREAM = "#FFF8EE";

/**
 * The homepage catalog band: a full-width coral section with the Product
 * Hunt gallery's "Every gift is hand-picked" line, two rows of gift photos
 * drifting past, the brand names, and the way in (the quiz, then the gift
 * guides). Coral alternates with the cream sections around it.
 */
export function CatalogShowcase({
  isMobile,
  brands,
  onStart,
}: {
  isMobile: boolean;
  brands: string[];
  onStart: () => void;
}) {
  const navigate = useNavigate();
  const pad = isMobile ? 20 : 56;
  return (
    <section
      id="catalog"
      aria-labelledby="catalog-title"
      style={{
        // Full bleed, like the gift rows inside it.
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        background: "linear-gradient(165deg, #FF8166 0%, #E85A4C 55%, #D9476A 100%)",
        color: CREAM,
        padding: isMobile ? "56px 0 52px" : "88px 0 80px",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: `0 ${pad}px`, textAlign: "center" }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,248,238,0.72)",
            marginBottom: 14,
          }}
        >
          The catalog
        </div>
        <h2
          id="catalog-title"
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: isMobile ? 42 : 72,
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
            margin: 0,
            textWrap: "balance" as never,
          }}
        >
          Every gift is <em style={{ fontStyle: "italic", color: "#FFE9A8" }}>hand-picked.</em>
        </h2>
        <p
          style={{
            fontFamily: SANS,
            fontSize: isMobile ? 15 : 17,
            lineHeight: 1.55,
            color: "rgba(255,248,238,0.86)",
            margin: "16px auto 0",
            maxWidth: 520,
            textWrap: "balance" as never,
          }}
        >
          800+ gifts from 600+ brands. The quiz finds the ones that fit the person you're shopping for.
        </p>
      </div>

      <div style={{ margin: isMobile ? "30px 0 26px" : "44px 0 40px" }}>
        <GiftCarousel isMobile={isMobile} />
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: `0 ${pad}px`, textAlign: "center" }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,248,238,0.72)",
            marginBottom: 14,
          }}
        >
          From brands like
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: isMobile ? 18 : 30,
            rowGap: isMobile ? 6 : 8,
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: isMobile ? 21 : 27,
            lineHeight: 1.25,
          }}
        >
          {brands.map((b) => (
            <span key={b} style={{ whiteSpace: "nowrap", opacity: 0.94 }}>
              {b}
            </span>
          ))}
        </div>

        <div
          style={{
            marginTop: isMobile ? 32 : 40,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 14 : 24,
          }}
        >
          <Pillow tone="cream" size="lg" onClick={onStart}>
            Find their gift →
          </Pillow>
          <button
            type="button"
            onClick={() => {
              track("home_catalog_guides_click");
              navigate("/blog");
            }}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 15,
              color: CREAM,
              textDecoration: "underline",
              textUnderlineOffset: 4,
              textDecorationColor: "rgba(255,248,238,0.5)",
            }}
          >
            Or browse our gift guides
          </button>
        </div>
      </div>
    </section>
  );
}
