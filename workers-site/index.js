import {
  getAssetFromKV,
  serveSinglePageApp,
} from "@cloudflare/kv-asset-handler";
import { serveAnalytics } from "./analytics.js";
import { APPS_SCRIPT_URL, GIFT_PATH, GIFTS_KEY } from "./config.js";
import { POSTS, findPost, formatPostDate, parseInline, postShareImage, postsFeaturing, postTitleTag, relatedPosts, segmentHref } from "../src/data/posts.ts";

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
const GIFTS_ENDPOINT = `${APPS_SCRIPT_URL}?tab=Gifts`;

const SITE_ORIGIN = "https://giftpicker.io";
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

  // Dynamic sitemap: /, /brands, the blog, plus one URL per live gift.
  if (url.pathname === "/sitemap.xml") {
    return serveSitemap(event);
  }

  // Short link for the 2026 Product Hunt launch. PH cuts long URLs in comments
  // and notification emails to "https://www.producthunt.com/prod...".
  if (url.pathname.replace(/\/+$/, "") === "/ph") {
    return Response.redirect("https://www.producthunt.com/products/giftpicker-by-presently/launches/giftpicker", 302);
  }

  // Numbers for the Analytics tab in /review (GA4 data, password-gated).
  if (url.pathname === "/api/analytics") {
    return serveAnalytics(event.request, url);
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
    const giftMatch = url.pathname.match(GIFT_PATH);
    if (giftMatch) {
      try {
        const rewritten = await prerenderGiftPage(event, response, giftMatch[1]);
        if (rewritten) response = rewritten;
      } catch (e) {
        // fall through with the plain SPA shell
      }
    }

    // Blog index and posts: same idea, from the post data in src/data/posts.ts.
    // An unknown slug gets the SPA shell (React shows "not found") with a 404.
    const blogMatch = url.pathname.match(/^\/blog(?:\/([^/]+))?\/?$/);
    if (blogMatch) {
      try {
        response = await prerenderBlog(event, response, blogMatch[1]);
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

/** Shown on the site: Status Live AND Review status TRUE (Dalia approved it in /review). */
function isLive(row) {
  const reviewed = row["Review status"] === true || String(row["Review status"] || "").trim().toUpperCase() === "TRUE";
  return String(row.Status || "").trim().toLowerCase() === "live" && reviewed;
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
		<p><a href="${buyLink}" rel="sponsored noopener" style="color:#C4477E;">Buy this gift</a></p>${featuredInHtml(giftId)}
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

/** "Featured in" links to the blog posts that recommend a gift (empty when none do). */
function featuredInHtml(giftId) {
  const posts = postsFeaturing(giftId);
  if (!posts.length) return "";
  const links = posts
    .map((p) => `<a href="${SITE_ORIGIN}/blog/${p.slug}" style="color:#C4477E;">${escapeHtml(p.title)}</a>`)
    .join(", ");
  return `\n\t\t<p>Featured in: ${links}</p>`;
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
  const postDate = (p) => p.updated || p.published;
  const urls = [{ loc: `${SITE_ORIGIN}/` }, { loc: `${SITE_ORIGIN}/brands` }]
    .concat(POSTS.length ? [{ loc: `${SITE_ORIGIN}/blog`, lastmod: POSTS.map(postDate).sort().pop() }] : [])
    .concat(POSTS.map((p) => ({ loc: `${SITE_ORIGIN}/blog/${p.slug}`, lastmod: postDate(p) })))
    .concat((rows || []).map((g) => ({ loc: `${SITE_ORIGIN}/gift/${g.row_id}` })));
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url><loc>${escapeHtml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
      .join("\n") +
    `\n</urlset>\n`
  );
}

/** /sitemap.xml: static routes, the blog, and one entry per live gift, prebuilt in KV. */
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

/**
 * Blog: /blog and /blog/:slug get their own title, meta, canonical, OG tags,
 * JSON-LD, and a static copy of the page for crawlers, built from the post
 * data in src/data/posts.ts (the same file the React pages read).
 */

const BLOG_TITLE = "Gift guides · GiftPicker";
const BLOG_DESCRIPTION =
  "Gift guides from GiftPicker: practical advice for choosing gifts for coworkers, partners, family, and friends, with picks from our hand-curated catalog.";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png?v=20261003`;
const ORG = {
  "@type": "Organization",
  name: "GiftPicker",
  url: `${SITE_ORIGIN}/`,
  logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/logo512.png` },
};
const STATIC_WRAP =
  'style="max-width:720px;margin:0 auto;padding:48px 24px;font-family:Geist,system-ui,sans-serif;color:#231410;background:#FBF1E1;line-height:1.6;"';
const LINK_STYLE = 'style="color:#C4477E;"';

/** JSON for a <script> tag; "<" is escaped so text can never close the tag. */
function jsonLdScript(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

/** Several schema.org nodes as one JSON-LD graph. */
function jsonLdGraph(nodes) {
  return jsonLdScript({ "@context": "https://schema.org", "@graph": nodes });
}

function breadcrumbs(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  };
}

function blogMetaBlock({ title, description, url, type, image = DEFAULT_OG_IMAGE, imageAlt, extra = "", jsonLd }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const alt = escapeHtml(imageAlt || title);
  return `
	<meta name="description" content="${d}"/>
	<link rel="canonical" href="${url}"/>
	<meta name="robots" content="index, follow, max-image-preview:large"/>
	<meta property="og:type" content="${type}"/>
	<meta property="og:site_name" content="GiftPicker"/>
	<meta property="og:title" content="${t}"/>
	<meta property="og:description" content="${d}"/>
	<meta property="og:url" content="${url}"/>
	<meta property="og:image" content="${image}"/>
	<meta property="og:image:width" content="1200"/>
	<meta property="og:image:height" content="630"/>
	<meta property="og:image:alt" content="${alt}"/>${extra}
	<meta name="twitter:card" content="summary_large_image"/>
	<meta name="twitter:title" content="${t}"/>
	<meta name="twitter:description" content="${d}"/>
	<meta name="twitter:image" content="${image}"/>
	<meta name="twitter:image:alt" content="${alt}"/>
	${jsonLdGraph(jsonLd)}`;
}

/**
 * Post text to HTML. Gift links point at the gift page while the gift is live
 * (`live` is null when the catalog couldn't be read, and then links stay).
 */
function inlineHtml(text, live) {
  return parseInline(text)
    .map((s) => {
      const target = segmentHref(s, live);
      if (!target) return escapeHtml(s.text);
      const href = target.startsWith("/") ? `${SITE_ORIGIN}${target}` : target;
      return `<a href="${escapeHtml(href)}" ${LINK_STYLE}>${escapeHtml(s.text)}</a>`;
    })
    .join("");
}

function withPage(html, title, metaBlock, staticBlock) {
  let out = replaceBetween(html, "<!--gp-meta-->", "<!--/gp-meta-->", metaBlock);
  if (staticBlock) out = replaceBetween(out, "<!--gp-static-->", "<!--/gp-static-->", staticBlock);
  return out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

function blogIndexHtml(html) {
  const url = `${SITE_ORIGIN}/blog`;
  const blog = {
    "@type": "Blog",
    "@id": `${url}#blog`,
    name: "GiftPicker gift guides",
    description: BLOG_DESCRIPTION,
    url,
    publisher: ORG,
    blogPost: POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: `${url}/${p.slug}`,
      datePublished: p.published,
      dateModified: p.updated || p.published,
      image: `${SITE_ORIGIN}${postShareImage(p)}`,
    })),
  };
  const jsonLd = [blog, breadcrumbs([["Home", `${SITE_ORIGIN}/`], ["Gift guides", url]])];
  const items = POSTS.map(
    (p) => `
			<li style="margin:0 0 20px;"><a href="${url}/${p.slug}" ${LINK_STYLE}>${escapeHtml(p.title)}</a><br/>
			<span style="font-size:14px;color:#8a7a72;">${formatPostDate(p.published)}</span><br/>${escapeHtml(p.description)}</li>`
  ).join("");
  const staticBlock = `
	<div ${STATIC_WRAP}>
		<nav aria-label="Breadcrumb" style="font-size:14px;margin:0 0 16px;"><a href="${SITE_ORIGIN}/" ${LINK_STYLE}>Home</a> › Gift guides</nav>
		<h1 style="font-size:40px;line-height:1.1;margin:0 0 12px;">Gift guides</h1>
		<p>Practical advice for choosing a gift, with picks from the GiftPicker catalog.</p>
		<ul style="padding-left:20px;">${items}
		</ul>
		<p><a href="${SITE_ORIGIN}/quiz" ${LINK_STYLE}>Take the GiftPicker quiz</a> to get gift picks for the person you have in mind.</p>
	</div>`;
  return withPage(html, BLOG_TITLE, blogMetaBlock({ title: BLOG_TITLE, description: BLOG_DESCRIPTION, url, type: "website", jsonLd }), staticBlock);
}

function blogPostHtml(html, post, gifts) {
  const url = `${SITE_ORIGIN}/blog/${post.slug}`;
  const title = postTitleTag(post);
  const modified = post.updated || post.published;
  const image = `${SITE_ORIGIN}${postShareImage(post)}`;
  const imageAlt = `${post.title}: a GiftPicker gift guide, with photos of gifts it recommends`;
  const byId = gifts ? new Map(gifts.map((g) => [g.row_id, g])) : null;
  const live = byId ? new Set(byId.keys()) : null;

  const body = post.body
    .map((b) => {
      if (b.kind === "h2") return `<h2 style="font-size:26px;line-height:1.2;margin:32px 0 8px;">${escapeHtml(b.text)}</h2>`;
      if (b.kind === "p") return `<p>${inlineHtml(b.text, live)}</p>`;
      if (b.kind === "list") return `<ul>${b.items.map((item) => `<li>${inlineHtml(item, live)}</li>`).join("")}</ul>`;
      // Gift rows need the catalog for names and prices; without it the prose still links each gift.
      const rows = byId ? b.ids.map((id) => byId.get(id)).filter(Boolean) : [];
      if (!rows.length) return "";
      const lis = rows.map((g) => {
        const label = priceLabel(g);
        return `<li><a href="${SITE_ORIGIN}/gift/${escapeHtml(g.row_id)}" ${LINK_STYLE}>${escapeHtml(g.Gift)}</a>${g.Brand ? ` by ${escapeHtml(g.Brand)}` : ""}${label ? `, ${escapeHtml(label)}` : ""}</li>`;
      });
      return `<ul>${lis.join("")}</ul>`;
    })
    .join("\n\t\t\t");

  // The gifts the post links to that are live right now, in reading order.
  const linked = byId
    ? [...new Set(post.body.flatMap((b) => (b.kind === "gifts" ? b.ids : [])))].map((id) => byId.get(id)).filter(Boolean)
    : [];
  const jsonLd = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.description,
      image: [image],
      datePublished: post.published,
      dateModified: modified,
      author: { "@type": "Organization", name: "GiftPicker", url: `${SITE_ORIGIN}/` },
      publisher: ORG,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      isPartOf: { "@type": "Blog", "@id": `${SITE_ORIGIN}/blog#blog`, name: "GiftPicker gift guides" },
      url,
    },
    breadcrumbs([["Home", `${SITE_ORIGIN}/`], ["Gift guides", `${SITE_ORIGIN}/blog`], [post.title, url]]),
  ];
  if (linked.length) {
    jsonLd.push({
      "@type": "ItemList",
      name: `Gifts in "${post.title}"`,
      numberOfItems: linked.length,
      itemListElement: linked.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_ORIGIN}/gift/${g.row_id}`,
        name: g.Brand ? `${g.Gift} by ${g.Brand}` : String(g.Gift),
      })),
    });
  }
  const related = relatedPosts(post)
    .map((p) => `<li><a href="${SITE_ORIGIN}/blog/${p.slug}" ${LINK_STYLE}>${escapeHtml(p.title)}</a></li>`)
    .join("");
  const extra = `
	<meta property="article:published_time" content="${post.published}"/>
	<meta property="article:modified_time" content="${modified}"/>`;
  const staticBlock = `
	<div ${STATIC_WRAP}>
		<nav aria-label="Breadcrumb" style="font-size:14px;margin:0 0 16px;"><a href="${SITE_ORIGIN}/" ${LINK_STYLE}>Home</a> › <a href="${SITE_ORIGIN}/blog" ${LINK_STYLE}>Gift guides</a></nav>
		<article>
			<h1 style="font-size:36px;line-height:1.1;margin:0 0 12px;">${escapeHtml(post.title)}</h1>
			<p style="font-size:14px;color:#8a7a72;">By GiftPicker · <time datetime="${post.published}">${formatPostDate(post.published)}</time></p>
			${post.intro.map((p) => `<p>${inlineHtml(p, live)}</p>`).join("\n\t\t\t")}
			${body}
			<p>${escapeHtml(post.cta)} <a href="${SITE_ORIGIN}/quiz" ${LINK_STYLE}>Take the GiftPicker quiz</a>.</p>
		</article>
		<h2 style="font-size:22px;margin:32px 0 8px;">More gift guides</h2>
		<ul>${related}</ul>
		<p style="font-size:12px;color:#8a7a72;">As an Amazon Associate, GiftPicker earns from qualifying purchases.</p>
	</div>`;
  return withPage(html, title, blogMetaBlock({ title, description: post.description, url, type: "article", image, imageAlt, extra, jsonLd }), staticBlock);
}

async function prerenderBlog(event, response, slug) {
  const post = slug ? findPost(slug) : null;
  // Read the catalog before the body, so nothing can fail after the body is consumed.
  const gifts = post ? await loadGifts(event) : null;
  const html = await response.text();
  let out = html;
  let status = response.status;
  try {
    if (!slug) out = blogIndexHtml(html);
    else if (post) out = blogPostHtml(html, post, gifts);
    else {
      status = 404;
      out = withPage(html, "Article not found · GiftPicker", `\n\t<meta name="robots" content="noindex"/>`);
    }
  } catch (e) {
    out = html;
  }
  return new Response(out, { status, headers: response.headers });
}
