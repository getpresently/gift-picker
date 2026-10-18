import { PresentlyMark } from "./PresentlyMark";
import { Wordmark } from "./Wordmark";

// Footer lockup: the wordmark with "by Presently" set beneath it as a byline,
// then a short description that names the gift finder quiz on every page,
// left-aligned with the gift-box mark (the logo's SVG has 2.5px of side
// bearing, so the byline steps in by the same amount to align optically).
export function FooterBrand() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
      <Wordmark size="sm" />
      <span style={{ paddingLeft: 2.5 }}>
        <PresentlyMark />
      </span>
      <p
        style={{
          margin: "8px 0 0",
          paddingLeft: 2.5,
          maxWidth: 300,
          fontFamily: "Geist, sans-serif",
          fontSize: 12,
          lineHeight: 1.5,
          color: "rgba(35,20,16,0.5)",
        }}
      >
        GiftPicker is a free 60-second gift finder quiz for the indecisive and the deeply caring. Answer five quick
        questions about the person and get a shortlist of gifts they'll actually love.
      </p>
    </div>
  );
}
