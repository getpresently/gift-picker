/**
 * Outbound buy links. The sheet stores clean product URLs; the Amazon
 * Associates tag is added here at click time, so it lives in exactly one
 * place and changing it never means editing hundreds of cells.
 *
 * Only `tag=` earns commission. SiteStripe's extra params (linkCode, linkId,
 * ref_, gaOptInStatus) are reporting sugar, and `smid` pins a single
 * third-party seller, so links are rebuilt as /dp/ASIN?tag=... from scratch.
 */

export const AMAZON_TAG =
  (import.meta.env.VITE_AMAZON_TAG as string | undefined)?.trim() || "dalia0f8-20";

const ASIN_RE = /\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN|o\/ASIN)\/([A-Z0-9]{10})(?:[/?&#]|$)/i;

/**
 * Amazon short links (amzn.to, a.co) hide the product and carry whatever
 * affiliate tag was baked in when they were made (two old ones carried the
 * Presently tag), so the site never uses them as buy links.
 */
export function isAmazonShortLink(url: string): boolean {
  try {
    return /(^|\.)(amzn\.to|a\.co|amzn\.com|amzn\.eu)$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function isAmazonUrl(url: string): boolean {
  try {
    return /(^|\.)amazon\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * The store buttons a gift gets. A Link that is itself an Amazon page is the
 * Amazon button (it wins over the AmazonAltLink, which is only a fallback
 * listing), so a gift never shows "Buy on Amazon" twice or labels an Amazon
 * page "Buy on <brand>".
 */
export function buyLinks(gift: { link: string; amazonLink: string }): { amazon: string; brand: string } {
  const linkIsAmazon = isAmazonUrl(gift.link);
  return {
    amazon: linkIsAmazon ? gift.link : gift.amazonLink,
    brand: linkIsAmazon ? "" : gift.link,
  };
}

/** The one store a card's quick Buy button opens: Amazon when the gift is sold there, else the brand. */
export function primaryBuy(gift: { link: string; amazonLink: string }): { url: string; destination: "amazon" | "brand" } {
  const { amazon, brand } = buyLinks(gift);
  return amazon ? { url: amazon, destination: "amazon" } : { url: brand, destination: "brand" };
}

/**
 * Ad-click and other affiliates' tracking parameters that sometimes come along
 * when a product link is copied from an ad or a deal site. They don't pay us and
 * can credit someone else, so brand links drop them (10/25/26).
 */
const FOREIGN_TRACKING = /^(?:utm_\w+|gclid|gbraid|wbraid|gclsrc|msclkid|fbclid|sscid|irgwc|irclickid|clickid|cjevent|cm_ven|cm_cat|cm_pla|campaignid|adgroupid|targetid|mkwid|pcrid)$/i;

export function affiliateUrl(url: string): string {
  if (url && !isAmazonUrl(url)) return withoutForeignTracking(url);
  if (!url || !AMAZON_TAG) return url;
  try {
    const u = new URL(url);
    const m = u.pathname.match(ASIN_RE);
    if (m) return `https://www.amazon.com/dp/${m[1].toUpperCase()}?tag=${AMAZON_TAG}`;
    u.searchParams.set("tag", AMAZON_TAG);
    return u.toString();
  } catch {
    return url;
  }
}

function withoutForeignTracking(url: string): string {
  try {
    const u = new URL(url);
    const keys = [...u.searchParams.keys()].filter((k) => FOREIGN_TRACKING.test(k));
    if (!keys.length) return url;
    for (const k of keys) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return url;
  }
}

export const AFFILIATE_DISCLOSURE = "As an Amazon Associate, GiftPicker earns from qualifying purchases.";
