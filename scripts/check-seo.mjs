#!/usr/bin/env node
/**
 * Checks what crawlers get for the blog. Bundles the Cloudflare worker
 * (workers-site/index.js) with stand-ins for its static assets (index.html) and
 * its gift cache (filled from the live catalog), then requests /blog, every
 * post, an unknown post, and /sitemap.xml as Googlebot. For each post it checks:
 * the title tag and meta description; canonical, robots, Open Graph and Twitter
 * tags; JSON-LD that parses into a BlogPosting, a BreadcrumbList, and an ItemList
 * of linked gifts; one H1 and an H2 per section; every paragraph, list item, and
 * live gift name in the static HTML; related posts and the quiz linked.
 *
 *   node scripts/check-seo.mjs
 *
 * Needs network access for the live catalog. Exits 1 if any check fails.
 */
import { build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-seo-"));
process.on("exit", () => fs.rmSync(dir, { recursive: true, force: true }));

// The worker's static-asset handler, replaced by one that serves index.html for every page.
const stub = path.join(dir, "kv-asset-handler.mjs");
fs.writeFileSync(
  stub,
  `export function serveSinglePageApp(req) { return req; }
   export async function getAssetFromKV() {
     return new Response(globalThis.__SHELL__, { headers: { "Content-Type": "text/html; charset=utf-8" } });
   }`,
);
const workerOut = path.join(dir, "worker.mjs");
await build({
  entryPoints: [path.join(root, "workers-site/index.js")],
  bundle: true,
  format: "esm",
  platform: "node",
  alias: { "@cloudflare/kv-asset-handler": stub },
  outfile: workerOut,
  logLevel: "error",
});
const postsOut = path.join(dir, "posts.mjs");
await build({ entryPoints: [path.join(root, "src/data/posts.ts")], bundle: true, format: "esm", platform: "node", outfile: postsOut, logLevel: "error" });
const P = await import(pathToFileURL(postsOut).href);

let rows;
try {
  rows = (await (await fetch("https://giftpicker.io/api/gifts", { signal: AbortSignal.timeout(20000) })).json()).data;
} catch (err) {
  console.error(`check-seo: could not read the live catalog (${err}). This check needs network access.`);
  process.exit(1);
}
const live = new Map(rows.map((r) => [String(r.row_id), r]));
const kv = { "gifts:live:v1": JSON.stringify({ at: Date.now(), rows }) };
globalThis.__SHELL__ = fs.readFileSync(path.join(root, "index.html"), "utf8");
globalThis.GIFTS_CACHE = {
  async get(key, opts) {
    const v = kv[key];
    if (v == null) return null;
    return opts?.type === "json" ? JSON.parse(v) : v;
  },
  async put(key, val) {
    kv[key] = val;
  },
};
let handler;
globalThis.addEventListener = (type, fn) => {
  if (type === "fetch") handler = fn;
};
await import(pathToFileURL(workerOut).href);

const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
async function get(pathname) {
  let res;
  handler({
    request: new Request(`https://giftpicker.io${pathname}`, { headers: { "User-Agent": GOOGLEBOT } }),
    respondWith: (r) => (res = r),
    waitUntil() {},
  });
  const r = await res;
  return { status: r.status, html: await r.text() };
}

const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const meta = (html, attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];
const staticBlock = (html) => html.match(/<!--gp-static-->([\s\S]*?)<!--\/gp-static-->/)?.[1] ?? "";
// Inline tags (links, dates) vanish without a space; block tags become one.
const visibleText = (html) => decode(html.replace(/<\/?(a|time|span|strong|em)\b[^>]*>/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
const plain = (text) => P.parseInline(text).map((s) => s.text).join("").replace(/\s+/g, " ");
function jsonLd(html) {
  const nodes = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const data = JSON.parse(m[1]); // throws if it doesn't parse
    nodes.push(...(data["@graph"] ?? [data]));
  }
  return nodes;
}

let failed = 0;
function report(name, problems) {
  if (problems.length) {
    failed++;
    console.log(`FAIL  ${name}\n      ${problems.join("\n      ")}`);
  } else console.log(`ok    ${name}`);
}

// Blog index
{
  const { status, html } = await get("/blog");
  const problems = [];
  if (status !== 200) problems.push(`status ${status}`);
  if (/noindex/i.test(html)) problems.push("noindex present");
  if (!html.includes('<link rel="canonical" href="https://giftpicker.io/blog"/>')) problems.push("canonical");
  const nodes = jsonLd(html);
  const blog = nodes.find((n) => n["@type"] === "Blog");
  if (!blog || blog.blogPost?.length !== P.POSTS.length) problems.push("Blog JSON-LD missing or incomplete");
  if (!nodes.some((n) => n["@type"] === "BreadcrumbList")) problems.push("no BreadcrumbList");
  const block = staticBlock(html);
  for (const post of P.POSTS) if (!block.includes(`https://giftpicker.io/blog/${post.slug}"`)) problems.push(`index does not link ${post.slug}`);
  report("/blog", problems);
}

// Every post
for (const post of P.POSTS) {
  const url = `https://giftpicker.io/blog/${post.slug}`;
  const { status, html } = await get(`/blog/${post.slug}`);
  const problems = [];
  if (status !== 200) problems.push(`status ${status}`);
  if (/noindex/i.test(html)) problems.push("noindex present");
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  if (title !== P.postTitleTag(post)) problems.push(`title tag "${title}"`);
  if (title.length > 60) problems.push(`title tag ${title.length} characters`);
  const description = decode(meta(html, "name", "description") ?? "");
  if (description !== post.description || description.length > 155) problems.push(`meta description (${description.length} characters)`);
  if (!html.includes(`<link rel="canonical" href="${url}"/>`)) problems.push("canonical");
  const image = `https://giftpicker.io${P.postShareImage(post)}`;
  for (const [attr, name, want] of [
    ["property", "og:type", "article"],
    ["property", "og:url", url],
    ["property", "og:image", image],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:image", image],
  ]) {
    if (meta(html, attr, name) !== want) problems.push(`${name} should be ${want}`);
  }
  for (const [attr, name] of [["property", "og:title"], ["property", "og:description"], ["property", "og:image:alt"], ["name", "twitter:title"], ["name", "twitter:description"], ["name", "twitter:image:alt"]]) {
    if (!meta(html, attr, name)) problems.push(`${name} missing`);
  }
  if (!fs.existsSync(path.join(root, "public", P.postShareImage(post)))) problems.push("share image file missing");

  let nodes = [];
  try {
    nodes = jsonLd(html);
  } catch (err) {
    problems.push(`JSON-LD does not parse: ${err.message}`);
  }
  const article = nodes.find((n) => n["@type"] === "BlogPosting");
  if (!article) problems.push("no BlogPosting");
  else {
    for (const key of ["headline", "description", "datePublished", "dateModified", "image", "author", "publisher", "mainEntityOfPage"]) {
      if (!article[key]) problems.push(`BlogPosting.${key} missing`);
    }
    if (!article.publisher?.logo?.url) problems.push("publisher logo missing");
    if (article.datePublished !== post.published) problems.push("datePublished");
  }
  const crumbs = nodes.find((n) => n["@type"] === "BreadcrumbList");
  if (crumbs?.itemListElement?.length !== 3 || crumbs.itemListElement[2].item !== url) problems.push("BreadcrumbList should be Home > Gift guides > post");
  const linkedLive = [...new Set(post.body.flatMap((b) => (b.kind === "gifts" ? b.ids : [])))].filter((id) => live.has(id));
  const list = nodes.find((n) => n["@type"] === "ItemList");
  const listed = (list?.itemListElement ?? []).map((i) => i.url);
  for (const id of linkedLive) if (!listed.includes(`https://giftpicker.io/gift/${id}`)) problems.push(`ItemList is missing ${id}`);

  const block = staticBlock(html);
  const text = visibleText(block);
  if ((block.match(/<h1[\s>]/g) ?? []).length !== 1) problems.push("needs exactly one H1");
  if (!text.includes(post.title)) problems.push("H1 text");
  for (const b of post.body) {
    if (b.kind === "h2" && !block.includes(`>${b.text.replace(/&/g, "&amp;").replace(/'/g, "&#39;")}</h2>`)) problems.push(`H2 "${b.text}"`);
    const texts = b.kind === "p" ? [b.text] : b.kind === "list" ? b.items : [];
    for (const t of texts) if (!text.includes(plain(t))) problems.push(`text missing: "${plain(t).slice(0, 60)}..."`);
  }
  for (const t of post.intro) if (!text.includes(plain(t))) problems.push(`intro missing: "${plain(t).slice(0, 60)}..."`);
  for (const id of linkedLive) if (!text.includes(String(live.get(id).Gift).replace(/\s+/g, " "))) problems.push(`gift name missing for ${id}`);
  const related = P.relatedPosts(post);
  for (const r of related) if (!block.includes(`https://giftpicker.io/blog/${r.slug}"`)) problems.push(`related post ${r.slug} not linked`);
  if (!block.includes('href="https://giftpicker.io/quiz"')) problems.push("quiz not linked");
  report(`/blog/${post.slug} (${title.length}-char title, ${linkedLive.length} gifts in ItemList, ${related.length} related)`, problems);
}

// Unknown post and sitemap
{
  const { status, html } = await get("/blog/no-such-post");
  report("/blog/no-such-post is a 404 with noindex", status === 404 && /noindex/.test(html) ? [] : [`status ${status}`]);
  for (const path of ["/zzz-nope", "/quiz/extra", "/gift/r999999"]) {
    const r = await get(path);
    report(`${path} is a 404 with noindex`, r.status === 404 && /noindex/.test(r.html) ? [] : [`status ${r.status}`]);
  }
  for (const path of ["/", "/quiz", "/results", "/privacy", "/terms", "/thanks", "/brands", "/review", "/blog/", "/gift/r2"]) {
    const r = await get(path);
    report(`${path} answers 200`, r.status === 200 ? [] : [`status ${r.status}`]);
  }
  const sitemap = (await get("/sitemap.xml")).html;
  const problems = [];
  for (const post of P.POSTS) {
    if (!new RegExp(`<loc>https://giftpicker.io/blog/${post.slug}</loc><lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod>`).test(sitemap)) problems.push(`sitemap is missing ${post.slug} with lastmod`);
  }
  if (!sitemap.includes("<loc>https://giftpicker.io/blog</loc>")) problems.push("sitemap is missing /blog");
  report("/sitemap.xml lists the blog and every post with lastmod", problems);
}

console.log(failed ? `\n${failed} check(s) failed` : "\nAll SEO checks passed");
process.exit(failed ? 1 : 0);
