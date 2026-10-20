import type { CSSProperties } from "react";
import { Pillow } from "./Pillow";
import { track } from "../../data/analytics";
import { affiliateUrl, buyLinks } from "../../data/affiliate";
import type { Gift } from "../../data/gifts";

/** Logs gift_buy_click. */
function trackGiftBuy(gift: Gift, destination: "amazon" | "brand", source: string) {
  track("gift_buy_click", {
    gift_id: gift.id,
    gift_name: gift.name,
    brand: gift.brand,
    price: gift.price,
    source,
    destination,
  });
}

/**
 * Link props that turn a Pillow into the real store link (with the Amazon
 * tag), so the store URL is in the page for crawlers and AI agents. The
 * browser opens it in a new tab; the click logs gift_buy_click on the way.
 * Amazon links are marked sponsored, since they carry the affiliate tag.
 * No `noreferrer`, so merchants and Amazon can see the traffic came from
 * giftpicker.io.
 */
export function buyLinkProps(gift: Gift, url: string, destination: "amazon" | "brand", source: string) {
  return {
    href: affiliateUrl(url),
    external: true,
    rel: destination === "amazon" ? "sponsored noopener" : "noopener",
    onClick: (e?: { stopPropagation?: () => void }) => {
      e?.stopPropagation?.();
      trackGiftBuy(gift, destination, source);
    },
  };
}

type Props = {
  gift: Gift;
  /** Where the click happened, for the gift_buy_click event. */
  source: "modal" | "gift_page";
  /**
   * Keep both buttons on one line (desktop). A long store name then
   * shortens with an ellipsis instead of pushing the button onto a new line.
   */
  oneRow?: boolean;
  style?: CSSProperties;
};

/**
 * A gift's store buttons, shared by the detail modal and the gift page:
 * "Buy on Amazon" first (coral) when the gift is on Amazon, then the
 * brand's own store (ink, or coral when it is the only store).
 */
export function BuyButtons({ gift, source, oneRow, style }: Props) {
  const { amazon, brand } = buyLinks(gift);
  const storeLabel = `Buy on ${gift.brand || "store"}`;

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: oneRow ? "nowrap" : "wrap", ...style }}>
      {amazon && (
        <Pillow tone="coral" size="md" {...buyLinkProps(gift, amazon, "amazon", source)} style={oneRow ? { flexShrink: 0, whiteSpace: "nowrap" } : undefined}>
          Buy on Amazon →
        </Pillow>
      )}
      {brand && (
        <Pillow
          tone={amazon ? "ink" : "coral"}
          size="md"
          {...buyLinkProps(gift, brand, "brand", source)}
          style={oneRow ? { minWidth: 0, display: "inline-flex", whiteSpace: "nowrap" } : undefined}
        >
          {oneRow ? (
            <>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{storeLabel}</span>
              &nbsp;→
            </>
          ) : (
            `${storeLabel} →`
          )}
        </Pillow>
      )}
    </div>
  );
}
