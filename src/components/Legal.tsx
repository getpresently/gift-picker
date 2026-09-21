import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AmbientGlow } from "./clay/AmbientGlow";
import { ClaySurface } from "./clay/ClaySurface";
import { Pillow } from "./clay/Pillow";
import { PresentlyMark } from "./clay/PresentlyMark";
import { SiteHeader } from "./clay/SiteHeader";
import { Wordmark } from "./clay/Wordmark";
import { useIsMobile } from "../hooks/useIsMobile";
import { AFFILIATE_DISCLOSURE } from "../data/affiliate";

const LAST_UPDATED = "September 21, 2026";

/**
 * Shared shell for the two legal pages: same header, reading column, and
 * footer as the rest of the site so /privacy and /terms don't feel bolted on.
 */
function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = `${title} · GiftPicker`;
  }, [title]);

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
          <ClaySurface
            tint="cream"
            style={{
              padding: isMobile ? "28px 22px" : "48px 64px",
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            <h1
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: isMobile ? 34 : 44,
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: "0 0 8px",
                color: "#231410",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 13,
                color: "rgba(35,20,16,0.62)",
                margin: "0 0 32px",
              }}
            >
              Last updated: {LAST_UPDATED}
            </p>

            <div
              style={{
                fontFamily: "Geist, sans-serif",
                fontSize: 15,
                lineHeight: 1.7,
                color: "#231410",
              }}
            >
              {children}
            </div>
          </ClaySurface>

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
            <PresentlyMark />
          </footer>
        </div>
      </div>
    </div>
  );
}

const sectionHeadingStyle: CSSProperties = {
  fontFamily: '"Instrument Serif", serif',
  fontSize: 22,
  fontWeight: 400,
  color: "#231410",
  margin: "28px 0 10px",
};

const paragraphStyle: CSSProperties = {
  margin: "0 0 14px",
};

const linkStyle: CSSProperties = {
  color: "#C4477E",
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p style={paragraphStyle}>
        GiftPicker helps you find a gift without collecting more about you
        than it needs to. This page explains, plainly, what information we
        keep and why.
      </p>

      <h2 style={sectionHeadingStyle}>No accounts</h2>
      <p style={paragraphStyle}>
        GiftPicker does not ask you to create an account. We do not ask for
        your name, your email address, or any payment information.
      </p>

      <h2 style={sectionHeadingStyle}>Your quiz answers</h2>
      <p style={paragraphStyle}>
        When you take the quiz, your answers (who the gift is for, their
        age, the occasion, their interests, the vibe you're going for, your
        budget, and any custom occasion you type in) are kept in your
        browser's session storage so we can show you results. If you use
        the Share link, those same answers are put into the URL so a
        friend who opens it sees the same picks.
      </p>

      <h2 style={sectionHeadingStyle}>Hearted gifts</h2>
      <p style={paragraphStyle}>
        Gifts you heart, or save, while browsing are kept in your browser's
        session storage.
      </p>

      <h2 style={sectionHeadingStyle}>Anonymous ID</h2>
      <p style={paragraphStyle}>
        We store a random, anonymous ID in your browser's local storage.
        It's attached to feedback, hearts, and requests you make, so we can
        tell distinct visitors apart. It is not linked to your name, email,
        or any other identifying information.
      </p>

      <h2 style={sectionHeadingStyle}>Feedback you send us</h2>
      <p style={paragraphStyle}>
        When you report a problem with a gift using "Something off?", heart
        a gift, ask for more gifts in a category, or type a custom
        occasion, we send that action, the gift involved, your quiz
        answers, the anonymous ID above, and a timestamp to a Google Sheet
        through Google Apps Script. The GiftPicker team uses this to
        improve the catalog.
      </p>

      <h2 style={sectionHeadingStyle}>Analytics</h2>
      <p style={paragraphStyle}>
        We use Google Analytics to measure visits and interactions, such as
        page views, quiz steps, "Buy" clicks, and shares, using cookies. You
        can read Google's{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          privacy policy
        </a>{" "}
        or install the{" "}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          Google Analytics opt-out add-on
        </a>{" "}
        if you'd rather not be measured.
      </p>

      <h2 style={sectionHeadingStyle}>Hosting</h2>
      <p style={paragraphStyle}>
        The site is hosted on Cloudflare, which processes technical data
        such as your IP address and browser type to deliver and protect
        the site.
      </p>

      <h2 style={sectionHeadingStyle}>Affiliate links</h2>
      <p style={paragraphStyle}>
        GiftPicker participates in the Amazon Services LLC Associates
        Program. When you click through to Amazon, Amazon may set cookies
        to attribute purchases. Third parties, including Amazon, may place
        or recognize cookies on your browser and may collect information
        directly from you. Once you leave for a merchant's site, that
        merchant's own privacy policy applies. {AFFILIATE_DISCLOSURE}
      </p>

      <h2 style={sectionHeadingStyle}>Brand submissions</h2>
      <p style={paragraphStyle}>
        If you submit a product through our For brands page, we keep the
        contact and product details you send so we can review it and reply.
        We don't use them for anything else.
      </p>

      <h2 style={sectionHeadingStyle}>We don't sell your information</h2>
      <p style={paragraphStyle}>GiftPicker does not sell personal information.</p>

      <h2 style={sectionHeadingStyle}>Children</h2>
      <p style={paragraphStyle}>
        GiftPicker is not directed to children under 13.
      </p>

      <h2 style={sectionHeadingStyle}>Questions or deletion requests</h2>
      <p style={paragraphStyle}>
        If you have questions about this policy, or you'd like us to
        delete feedback you submitted, email{" "}
        <a href="mailto:hello@giftpicker.io" style={linkStyle}>
          hello@giftpicker.io
        </a>
        .
      </p>

      <h2 style={sectionHeadingStyle}>Changes</h2>
      <p style={paragraphStyle}>
        If this policy changes, we'll post the update here with a new date.
      </p>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell title="Terms of Use">
      <p style={paragraphStyle}>
        GiftPicker is a free service that suggests gift ideas. These terms
        cover how the site works and what you should know before you buy.
      </p>

      <h2 style={sectionHeadingStyle}>What GiftPicker does</h2>
      <p style={paragraphStyle}>
        Our suggestions reflect the GiftPicker team's editorial judgment
        and are provided for informational purposes.
      </p>

      <h2 style={sectionHeadingStyle}>Who sells the products</h2>
      <p style={paragraphStyle}>
        Products shown on GiftPicker are sold by independent third-party
        merchants. GiftPicker is not the seller and is not a party to any
        purchase. Merchants are solely responsible for their products,
        pricing, availability, shipping, returns, warranties, and product
        safety. Any issue with an order must be resolved with the
        merchant.
      </p>

      <h2 style={sectionHeadingStyle}>Prices and availability</h2>
      <p style={paragraphStyle}>
        Prices, availability, and product details can change at any time.
        Please confirm details on the merchant's site before buying.
      </p>

      <h2 style={sectionHeadingStyle}>Affiliate commissions</h2>
      <p style={paragraphStyle}>
        GiftPicker may earn a commission from purchases made through links
        on the site, at no extra cost to you. This does not change the
        price you pay. {AFFILIATE_DISCLOSURE}
      </p>

      <h2 style={sectionHeadingStyle}>Sponsored placements</h2>
      <p style={paragraphStyle}>
        Brands can pay for a sponsored placement. A sponsored gift has to
        pass the same editorial review as every other gift, appears only
        in results it matches, and is always labeled as sponsored.
      </p>

      <h2 style={sectionHeadingStyle}>No warranties</h2>
      <p style={paragraphStyle}>
        The site is provided "as is," without warranties of any kind.
        GiftPicker is not liable for any loss or damage arising from your
        use of the site or from any purchase made from a third-party
        merchant, to the fullest extent permitted by law.
      </p>

      <h2 style={sectionHeadingStyle}>Ownership</h2>
      <p style={paragraphStyle}>
        Site content, including its text, design, and the curated catalog,
        belongs to GiftPicker. Product names, images, and trademarks
        belong to their respective owners.
      </p>

      <h2 style={sectionHeadingStyle}>Changes to these terms</h2>
      <p style={paragraphStyle}>
        GiftPicker may update these terms from time to time. Continuing to
        use the site means you accept the current version.
      </p>

      <h2 style={sectionHeadingStyle}>Contact</h2>
      <p style={paragraphStyle}>
        Questions about these terms? Email{" "}
        <a href="mailto:hello@giftpicker.io" style={linkStyle}>
          hello@giftpicker.io
        </a>
        .
      </p>
    </LegalShell>
  );
}
