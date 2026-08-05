import {
  getAssetFromKV,
  serveSinglePageApp,
} from "@cloudflare/kv-asset-handler";

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false;

/**
 * Gift database endpoint (same Apps Script web app the client uses).
 * Fetched at the edge with a 1-hour cache so gift-page prerenders and
 * the sitemap don't hammer Apps Script.
 */
const GIFTS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwPuaXtXuurdqNg94_mGoOR1YHXqKrJyZrkxkt09oFbGGZtS_KdH44vhJNn4qLzeJqhuQ/exec?tab=Gifts";

const SITE_ORIGIN = "https://giftpicker.io";

addEventListener("fetch", (event) => {
  try {
    event.respondWith(handleEvent(event));
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        })
      );
    }
    event.respondWith(new Response("Internal Error", { status: 500 }));
  }
});

async function handleEvent(event) {
  const url = new URL(event.request.url);

  // Dynamic sitemap: /, /quiz, plus one URL per live gift.
  if (url.pathname === "/sitemap.xml") {
    return serveSitemap();
  }

  let options = {};

  /**
   * Single-page app: serve index.html for any non-file route so the
   * client-side router handles /quiz, /results, /gift/:id on direct
   * load, refresh, and shared links instead of 404ing.
   */
  options.mapRequestToAsset = serveSinglePageApp;

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      };
    }
    const page = await getAssetFromKV(event, options);

    // allow headers to be altered
    let response = new Response(page.body, page);

    // Per-gift pages: rewrite the served index.html with gift-specific
    // title/meta/OG/JSON-LD and a static content block so the URL is
    // fully indexable by crawlers that don't execute JavaScript. Any
    // failure falls back to the untouched SPA shell.
    const giftMatch = url.pathname.match(/^\/gift\/(r\d+)\/?$/);
    if (giftMatch) {
      try {
        const rewritten = await prerenderGiftPage(response, giftMatch[1]);
        if (rewritten) response = rewritten;
      } catch (e) {
        // fall through with the plain SPA shell
      }
    }

    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "unsafe-url");
    response.headers.set("Feature-Policy", "none");

    return response;
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: (req) =>
            new Request(`${new URL(req.url).origin}/404.html`, req),
        });

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404,
        });
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 });
  }
}

/** Fetch the gift rows from Apps Script with a 1-hour edge cache. */
async function fetchGifts() {
  const res = await fetch(GIFTS_ENDPOINT, {
    redirect: "follow",
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`gifts fetch ${res.status}`);
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

function isLive(row) {
  return String(row.Status || "").trim().toLowerCase() === "live";
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Human price label from the raw sheet row (best-effort, display only). */
function priceLabel(row) {
  const price = Number(row.Price);
  if (!Number.isFinite(price) || price <= 0) return "";
  const per =
    String(row.BillingPeriod || "").trim() === "monthly"
      ? "/mo"
      : String(row.BillingPeriod || "").trim() === "weekly"
        ? "/wk"
        : "";
  const max = row.PriceMax;
  if (String(max).trim().toLowerCase() === "open") return `$${price}+${per}`;
  const maxNum = Number(max);
  if (Number.isFinite(maxNum) && maxNum > price) return `$${price}-$${maxNum}${per}`;
  return `$${price}${per}`;
}

/**
 * Swap the gp-meta and gp-static marker blocks in the SPA shell for
 * gift-specific content. Returns null if the gift isn't found (the
 * plain shell is served and React shows its not-found state).
 */
async function prerenderGiftPage(response, giftId) {
  const gifts = await fetchGifts();
  const row = gifts.find((g) => g.row_id === giftId);
  if (!row || !isLive(row)) return null;

  const html = await response.text();

  const name = escapeHtml(row.Gift);
  const brand = escapeHtml(row.Brand);
  const desc = escapeHtml(String(row.Description || "").slice(0, 300));
  const image = escapeHtml(row.PhotoAddress || `${SITE_ORIGIN}/logo512.png`);
  const label = priceLabel(row);
  const pageUrl = `${SITE_ORIGIN}/gift/${giftId}`;
  const title = brand ? `${name} by ${brand} · GiftPicker` : `${name} · GiftPicker`;
  const metaDesc = desc || `${name}${brand ? ` from ${brand}` : ""}, a hand-curated gift pick on GiftPicker.`;
  const buyLink = escapeHtml(row.Link || row.AmazonAltLink || `${SITE_ORIGIN}/quiz`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: String(row.Gift ?? ""),
    description: String(row.Description ?? ""),
    image: String(row.PhotoAddress ?? ""),
    url: pageUrl,
  };
  if (row.Brand) jsonLd.brand = { "@type": "Brand", name: String(row.Brand) };
  const priceNum = Number(row.Price);
  if (Number.isFinite(priceNum) && priceNum > 0) {
    jsonLd.offers = {
      "@type": "Offer",
      price: String(priceNum),
      priceCurrency: "USD",
      url: String(row.Link || row.AmazonAltLink || pageUrl),
      availability: "https://schema.org/InStock",
    };
  }

  const metaBlock = `
	<meta name="description" content="${metaDesc}"/>
	<link rel="canonical" href="${pageUrl}"/>
	<meta property="og:type" content="product"/>
	<meta property="og:site_name" content="GiftPicker"/>
	<meta property="og:title" content="${escapeHtml(title)}"/>
	<meta property="og:description" content="${metaDesc}"/>
	<meta property="og:url" content="${pageUrl}"/>
	<meta property="og:image" content="${image}"/>
	<meta name="twitter:card" content="summary_large_image"/>
	<meta name="twitter:title" content="${escapeHtml(title)}"/>
	<meta name="twitter:description" content="${metaDesc}"/>
	<meta name="twitter:image" content="${image}"/>
	<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  const staticBlock = `
	<div style="max-width:720px;margin:0 auto;padding:48px 24px;font-family:Geist,system-ui,sans-serif;color:#231410;background:#FBF1E1;line-height:1.6;">
		${brand ? `<p style="text-transform:uppercase;letter-spacing:0.14em;font-size:12px;margin:0 0 8px;">${brand}</p>` : ""}
		<h1 style="font-size:36px;line-height:1.1;margin:0 0 12px;">${name}</h1>
		${label ? `<p style="font-size:20px;margin:0 0 12px;">${escapeHtml(label)}</p>` : ""}
		${desc ? `<p>${desc}</p>` : ""}
		<p><a href="${buyLink}" rel="noopener" style="color:#C4477E;">Buy this gift</a></p>
		<p>This is a hand-curated gift pick on <a href="${SITE_ORIGIN}/" style="color:#C4477E;">GiftPicker</a>, a free 30-second quiz that recommends genuinely good gifts from 200+ brands. <a href="${SITE_ORIGIN}/quiz" style="color:#C4477E;">Take the quiz</a> to get picks tailored to your recipient.</p>
	</div>`;

  let out = replaceBetween(html, "<!--gp-meta-->", "<!--/gp-meta-->", metaBlock);
  out = replaceBetween(out, "<!--gp-static-->", "<!--/gp-static-->", staticBlock);
  // Swap the tab title too (it lives outside the meta markers).
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);

  return new Response(out, {
    status: 200,
    headers: response.headers,
  });
}

function replaceBetween(html, startMarker, endMarker, replacement) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) return html;
  return (
    html.slice(0, start + startMarker.length) +
    replacement +
    html.slice(end)
  );
}

/** /sitemap.xml: static routes + one entry per live gift. */
async function serveSitemap() {
  let urls = [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/quiz`];
  try {
    const gifts = await fetchGifts();
    urls = urls.concat(
      gifts.filter(isLive).map((g) => `${SITE_ORIGIN}/gift/${g.row_id}`)
    );
  } catch (e) {
    // Gift fetch failed: serve the static routes rather than erroring.
  }
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`).join("\n") +
    `\n</urlset>\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
