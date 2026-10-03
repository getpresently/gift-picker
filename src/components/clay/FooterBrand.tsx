import { PresentlyMark } from "./PresentlyMark";
import { Wordmark } from "./Wordmark";

// Footer lockup: the wordmark with "by Presently" set beneath it as a byline,
// indented to start under the "g" of giftpicker (sm logo 22px + 6px gap).
export function FooterBrand() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
      <Wordmark size="sm" />
      <span style={{ paddingLeft: 28 }}>
        <PresentlyMark />
      </span>
    </div>
  );
}
