import type { CSSProperties } from "react";
import { Pillow } from "./Pillow";
import { track } from "../../data/analytics";
import { buyLinks, openBuyLink } from "../../data/affiliate";
import type { Gift } from "../../data/gifts";

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
  const buy = (url: string, destination: "amazon" | "brand") => (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    track("gift_buy_click", {
      gift_id: gift.id,
      gift_name: gift.name,
      brand: gift.brand,
      price: gift.price,
      source,
      destination,
    });
    openBuyLink(url);
  };
  const storeLabel = `Buy on ${gift.brand || "store"}`;

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: oneRow ? "nowrap" : "wrap", ...style }}>
      {amazon && (
        <Pillow tone="coral" size="md" onClick={buy(amazon, "amazon")} style={oneRow ? { flexShrink: 0, whiteSpace: "nowrap" } : undefined}>
          Buy on Amazon →
        </Pillow>
      )}
      {brand && (
        <Pillow
          tone={amazon ? "ink" : "coral"}
          size="md"
          onClick={buy(brand, "brand")}
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
