import { PresentlyMark } from "./PresentlyMark";
import { Wordmark } from "./Wordmark";

// Footer lockup: the wordmark with "by Presently" set beneath it as a byline,
// left-aligned with the gift-box mark (the logo's SVG has 2.5px of side
// bearing, so the byline steps in by the same amount to align optically).
export function FooterBrand() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
      <Wordmark size="sm" />
      <span style={{ paddingLeft: 2.5 }}>
        <PresentlyMark />
      </span>
    </div>
  );
}
