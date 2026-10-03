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
 * Gift database endpoint (same Apps Script web app the client uses). It takes
 * 18-40s to answer, so pages never wait on it: the cron below copies the live
 * rows into the GIFTS_CACHE KV namespace and requests read from there.
 */
const GIFTS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwPuaXtXuurdqNg94_mGoOR1YHXqKrJyZrkxkt09oFbGGZtS_KdH44vhJNn4qLzeJqhuQ/exec?tab=Gifts";

const SITE_ORIGIN = "https://giftpicker.io";
const GIFTS_KEY = "gifts:live:v1";
const SITEMAP_KEY = "sitemap:xml:v1";
// Full live rows for the quiz results page, served at /api/gifts.
const FULL_KEY = "gifts:full:v1";
// How long a page request will wait on the origin when KV is empty (first deploy).
const COLD_WAIT_MS = 2500;
// Only the fields prerendering and the sitemap need; keeps the KV value small
// so parsing it stays well inside the per-request CPU budget.
const SLIM_FIELDS = ["row_id", "Gift", "Brand", "Description", "PhotoAddress", "Link",
                     "AmazonAltLink", "Price", "PriceMax", "BillingPeriod"];

const AMAZON_TAG = "dalia0f8-20";
const ASIN_RE = /\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN|o\/ASIN)\/([A-Z0-9]{10})(?:[/?&#]|$)/i;

addEventListener("scheduled", (event) => {
  event.waitUntil(refreshGifts());
});

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
    return serveSitemap(event);
  }

  // Live catalog for the results page, straight from KV (the site falls
  // back to Apps Script if this ever answers with an error).
  if (url.pathname === "/api/gifts") {
    return serveGiftsApi();
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
        const rewritten = await prerenderGiftPage(event, response, giftMatch[1]);
        if (rewritten) response = rewritten;
      } catch (e) {
        // fall through with the plain SPA shell
      }
    }

    const staticPage = STATIC_PAGES[url.pathname.replace(/\/+$/, "") || "/"];
    if (staticPage) {
      try {
        response = await prerenderStaticPage(response, url.pathname.replace(/\/+$/, ""), staticPage);
      } catch (e) {
        // fall through with the plain SPA shell
      }
    }

    // The internal review tool must never be indexed.
    if (url.pathname.startsWith("/review")) {
      try {
        const html = await response.text();
        const out = replaceBetween(html, "<!--gp-meta-->", "<!--/gp-meta-->", `\n\t<meta name="robots" content="noindex, nofollow"/>`)
          .replace(/<title>[^<]*<\/title>/, "<title>GiftPicker</title>");
        response = new Response(out, { status: response.status, headers: response.headers });
      } catch (e) {
        // fall through with the plain SPA shell; the header below still applies
      }
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      response.headers.set("Cache-Control", "no-store");
    }
    // Results are per-visitor quiz output: previews still work, search skips them.
    if (url.pathname.startsWith("/results")) {
      response.headers.set("X-Robots-Tag", "noindex, follow");
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

function isLive(row) {
  return String(row.Status || "").trim().toLowerCase() === "live";
}

/**
 * Pull the catalog from Apps Script and store the live rows (slimmed) plus a
 * ready-made sitemap in KV. Runs from the cron; never overwrites good data
 * with an empty or failed response.
 */
async function refreshGifts() {
  const res = await fetch(GIFTS_ENDPOINT, { redirect: "follow" });
  if (!res.ok) throw new Error(`gifts fetch ${res.status}`);
  const json = await res.json();
  const all = Array.isArray(json.data) ? json.data : [];
  const rows = all.filter(isLive).map((r) => {
    const slim = {};
    for (const k of SLIM_FIELDS) if (r[k] !== undefined && r[k] !== "") slim[k] = r[k];
    return slim;
  });
  if (!rows.length) throw new Error("gifts fetch returned no live rows");
  await GIFTS_CACHE.put(FULL_KEY, JSON.stringify({ data: all.filter(isLive) }));
  await GIFTS_CACHE.put(GIFTS_KEY, JSON.stringify({ at: Date.now(), rows }));
  await GIFTS_CACHE.put(SITEMAP_KEY, buildSitemap(rows));
  return rows;
}

/**
 * Live gift rows for a request. Normally an instant KV read. If KV is empty
 * (first deploy), race the origin against a short timeout so the page is never
 * held hostage by Apps Script; the refresh keeps going in the background.
 */
async function loadGifts(event) {
  try {
    const cached = await GIFTS_CACHE.get(GIFTS_KEY, { type: "json" });
    if (cached && Array.isArray(cached.rows)) return cached.rows;
  } catch (e) {}
  const refresh = refreshGifts();
  event.waitUntil(refresh.catch(() => {}));
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), COLD_WAIT_MS));
  return Promise.race([refresh.catch(() => null), timeout]);
}

async function serveGiftsApi() {
  let body = null;
  try {
    body = await GIFTS_CACHE.get(FULL_KEY);
  } catch (e) {}
  if (!body) {
    return new Response(JSON.stringify({ error: "unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60" },
  });
}

/** Amazon links carry the Associates tag; everything else passes through. */
function affiliateUrl(url) {
  try {
    const u = new URL(url);
    if (!/(^|\.)amazon\.com$/i.test(u.hostname)) return url;
    const m = u.pathname.match(ASIN_RE);
    if (m) return `https://www.amazon.com/dp/${m[1].toUpperCase()}?tag=${AMAZON_TAG}`;
    u.searchParams.set("tag", AMAZON_TAG);
    return u.toString();
  } catch (e) {
    return url;
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Human price label from the raw sheet row (display only), rounded to whole
 *  dollars like the app; the JSON-LD offer below keeps the exact price. */
function priceLabel(row) {
  const exact = Number(row.Price);
  if (!Number.isFinite(exact) || exact <= 0) return "";
  const price = Math.round(exact);
  const per =
    String(row.BillingPeriod || "").trim() === "monthly"
      ? "/mo"
      : String(row.BillingPeriod || "").trim() === "weekly"
        ? "/wk"
        : "";
  const max = row.PriceMax;
  if (String(max).trim().toLowerCase() === "open") return `$${price}+${per}`;
  const maxNum = Math.round(Number(max));
  if (Number.isFinite(maxNum) && maxNum > price) return `$${price}-$${maxNum}${per}`;
  return `$${price}${per}`;
}

/**
 * Swap the gp-meta and gp-static marker blocks in the SPA shell for
 * gift-specific content. Returns null if the gift isn't found (the
 * plain shell is served and React shows its not-found state).
 */
async function prerenderGiftPage(event, response, giftId) {
  const gifts = await loadGifts(event);
  if (!gifts) return null;
  // KV only holds live rows, so a miss means retired, rejected, or unknown.
  const row = gifts.find((g) => g.row_id === giftId);
  if (!row) return null;

  const html = await response.text();

  const name = escapeHtml(row.Gift);
  const brand = escapeHtml(row.Brand);
  const desc = escapeHtml(String(row.Description || "").slice(0, 300));
  const image = escapeHtml(row.PhotoAddress || `${SITE_ORIGIN}/logo512.png`);
  const label = priceLabel(row);
  const pageUrl = `${SITE_ORIGIN}/gift/${giftId}`;
  // Built from the raw values and escaped once; name/brand above are already escaped.
  const title = escapeHtml(row.Brand ? `${row.Gift} by ${row.Brand} · GiftPicker` : `${row.Gift} · GiftPicker`);
  const metaDesc = desc || `${name}${brand ? ` from ${brand}` : ""}, a hand-curated gift pick on GiftPicker.`;
  const buyLink = escapeHtml(affiliateUrl(row.AmazonAltLink || row.Link || `${SITE_ORIGIN}/quiz`));

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
	<meta property="og:title" content="${title}"/>
	<meta property="og:description" content="${metaDesc}"/>
	<meta property="og:url" content="${pageUrl}"/>
	<meta property="og:image" content="${image}"/>
	<meta name="twitter:card" content="summary_large_image"/>
	<meta name="twitter:title" content="${title}"/>
	<meta name="twitter:description" content="${metaDesc}"/>
	<meta name="twitter:image" content="${image}"/>
	<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  const staticBlock = `
	<div style="max-width:720px;margin:0 auto;padding:48px 24px;font-family:Geist,system-ui,sans-serif;color:#231410;background:#FBF1E1;line-height:1.6;">
		${brand ? `<p style="text-transform:uppercase;letter-spacing:0.14em;font-size:12px;margin:0 0 8px;">${brand}</p>` : ""}
		<h1 style="font-size:36px;line-height:1.1;margin:0 0 12px;">${name}</h1>
		${label ? `<p style="font-size:20px;margin:0 0 12px;">${escapeHtml(label)}</p>` : ""}
		${desc ? `<p>${desc}</p>` : ""}
		<p><a href="${buyLink}" rel="sponsored noopener" style="color:#C4477E;">Buy this gift</a></p>
		<p>This is a hand-curated gift pick on <a href="${SITE_ORIGIN}/" style="color:#C4477E;">GiftPicker</a>, a free 30-second quiz that recommends genuinely good gifts from 300+ brands. <a href="${SITE_ORIGIN}/quiz" style="color:#C4477E;">Take the quiz</a> to get picks tailored to your recipient.</p>
		<p style="font-size:12px;color:#8a7a72;">As an Amazon Associate, GiftPicker earns from qualifying purchases.</p>
	</div>`;

  let out = replaceBetween(html, "<!--gp-meta-->", "<!--/gp-meta-->", metaBlock);
  out = replaceBetween(out, "<!--gp-static-->", "<!--/gp-static-->", staticBlock);
  // Swap the tab title too (it lives outside the meta markers).
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

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

/**
 * Non-gift pages that should be indexed under their own URL. Without this,
 * they'd inherit the home page's canonical, title, and description.
 */
const STATIC_PAGES = {
  "/brands": {
    title: "For brands: submit a gift for review · GiftPicker",
    description:
      "Submit your product to GiftPicker's hand-curated gift catalog for a free editorial review, or ask about a clearly labeled sponsored placement.",
    body:
      "Brands can submit a product for a free editorial review. Our team reviews it the same way we review every gift in the catalog, and if it fits, we add it and match it to the shoppers it suits. Approved products can also be promoted with a sponsored placement, which is always labeled and only appears for shoppers whose answers it fits.",
  },
  "/privacy": {
    title: "Privacy Policy · GiftPicker",
    description: "How GiftPicker handles your data: no account, no selling of personal information, and minimal analytics.",
  },
  "/terms": {
    title: "Terms of Use · GiftPicker",
    description: "The terms for using GiftPicker, a free gift recommendation quiz with hand-curated picks from independent merchants.",
  },
};

async function prerenderStaticPage(response, path, page) {
  const html = await response.text();
  const pageUrl = `${SITE_ORIGIN}${path}`;
  const title = escapeHtml(page.title);
  const desc = escapeHtml(page.description);
  const metaBlock = `
	<meta name="description" content="${desc}"/>
	<link rel="canonical" href="${pageUrl}"/>
	<meta property="og:type" content="website"/>
	<meta property="og:site_name" content="GiftPicker"/>
	<meta property="og:title" content="${title}"/>
	<meta property="og:description" content="${desc}"/>
	<meta property="og:url" content="${pageUrl}"/>
	<meta property="og:image" content="${SITE_ORIGIN}/og-image.png?v=20261003"/>
	<meta property="og:image:width" content="1200"/>
	<meta property="og:image:height" content="630"/>
	<meta name="twitter:card" content="summary_large_image"/>
	<meta name="twitter:title" content="${title}"/>
	<meta name="twitter:description" content="${desc}"/>
	<meta name="twitter:image" content="${SITE_ORIGIN}/og-image.png?v=20261003"/>`;
  let out = replaceBetween(html, "<!--gp-meta-->", "<!--/gp-meta-->", metaBlock);
  if (page.body) {
    const staticBlock = `
	<div style="max-width:720px;margin:0 auto;padding:48px 24px;font-family:Geist,system-ui,sans-serif;color:#231410;background:#FBF1E1;line-height:1.6;">
		<h1 style="font-size:36px;line-height:1.1;margin:0 0 12px;">${escapeHtml(page.title.split(" · ")[0])}</h1>
		<p>${escapeHtml(page.body)}</p>
		<p><a href="${SITE_ORIGIN}/" style="color:#C4477E;">GiftPicker</a> is a free 30-second gift quiz with hand-curated picks from 300+ brands.</p>
	</div>`;
    out = replaceBetween(out, "<!--gp-static-->", "<!--/gp-static-->", staticBlock);
  }
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  return new Response(out, { status: response.status, headers: response.headers });
}

function buildSitemap(rows) {
  const urls = [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/brands`].concat(
    (rows || []).map((g) => `${SITE_ORIGIN}/gift/${g.row_id}`)
  );
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`).join("\n") +
    `\n</urlset>\n`
  );
}

/** /sitemap.xml: static routes + one entry per live gift, prebuilt in KV. */
async function serveSitemap(event) {
  let body = null;
  try {
    body = await GIFTS_CACHE.get(SITEMAP_KEY);
  } catch (e) {}
  if (!body) body = buildSitemap(await loadGifts(event));
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
