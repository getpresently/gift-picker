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

export function isAmazonUrl(url: string): boolean {
  try {
    return /(^|\.)amazon\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function affiliateUrl(url: string): string {
  if (!url || !AMAZON_TAG || !isAmazonUrl(url)) return url;
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

/**
 * Open a buy link in a new tab. Keeps the referrer (no `noreferrer`) so
 * merchants and Amazon can see the traffic came from giftpicker.io.
 */
export function openBuyLink(url: string): void {
  if (!url) return;
  window.open(affiliateUrl(url), "_blank", "noopener");
}

export const AFFILIATE_DISCLOSURE = "As an Amazon Associate, GiftPicker earns from qualifying purchases.";
