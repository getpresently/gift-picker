#!/usr/bin/env node
/**
 * Makes one 1200x630 share image per blog post (public/blog/og/<slug>.jpg), used
 * as the post's og:image and twitter:image: the post title in the site's serif
 * on cream, beside four photos of live gifts the post recommends.
 *
 *   PUPPETEER=<path to puppeteer-core's puppeteer-core.js> CHROME=<path to a Chrome or
 *   headless shell binary> node scripts/make-share-images.mjs [slug ...]
 *
 * Run it again after adding a post or changing a post's gifts, then look at the
 * images before committing. Gift photos are fetched here and inlined, so hosts
 * that turn away headless browsers still work. Not part of npm test.
 */
import { build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
if (!process.env.PUPPETEER || !process.env.CHROME) {
  console.error("Set PUPPETEER (path to puppeteer-core.js) and CHROME (path to a Chrome binary).");
  process.exit(1);
}
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "share-images-"));
process.on("exit", () => fs.rmSync(dir, { recursive: true, force: true }));
const out = path.join(dir, "posts.mjs");
await build({ entryPoints: [path.join(root, "src/data/posts.ts")], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "error" });
const { POSTS } = await import(pathToFileURL(out).href);
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER).href);

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const rows = (await (await fetch("https://giftpicker.io/api/gifts")).json()).data;
const live = new Map(rows.map((r) => [String(r.row_id), r]));

async function photo(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Referer: "https://giftpicker.io/" }, signal: AbortSignal.timeout(20000) });
    const type = r.headers.get("content-type") ?? "";
    if (!r.ok || !type.startsWith("image/")) return null;
    return `data:${type.split(";")[0]};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const page = (title, photos) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@500;600&family=Instrument+Serif&display=block" rel="stylesheet">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body { background: #FBF1E1; font-family: Geist, sans-serif; color: #231410; position: relative; }
  .glow { position: absolute; border-radius: 50%; filter: blur(60px); }
  .text { position: absolute; left: 72px; top: 0; bottom: 0; width: 500px; display: flex; flex-direction: column; justify-content: center; }
  .kicker { font-size: 20px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(35,20,16,0.55); margin-bottom: 22px; }
  h1 { font-family: "Instrument Serif", serif; font-weight: 400; font-size: 60px; line-height: 1.04; letter-spacing: -0.02em; margin: 0; }
  .mark { position: absolute; left: 72px; bottom: 54px; font-size: 30px; font-weight: 600; letter-spacing: -0.02em; }
  .mark span { color: #C4477E; }
  .grid { position: absolute; right: 64px; top: 65px; display: grid; grid-template-columns: 240px 240px; gap: 20px; }
  .grid div { width: 240px; height: 240px; border-radius: 26px; background: #E8D7B8 center / cover no-repeat; box-shadow: 0 18px 36px -16px rgba(80,30,30,0.28); }
</style></head><body>
<div class="glow" style="width:520px;height:520px;left:-160px;top:-180px;background:rgba(255,150,120,0.45)"></div>
<div class="glow" style="width:560px;height:560px;right:-200px;bottom:-240px;background:rgba(196,71,126,0.32)"></div>
<div class="text"><div class="kicker">Gift guide</div><h1>${esc(title)}</h1></div>
<div class="mark">giftpicker<span>.</span></div>
<div class="grid">${photos.map((p) => `<div style="background-image:url('${p}')"></div>`).join("")}</div>
</body></html>`;

// Gifts whose photo stays out of share images: r612 (The Qi flower tea) shows blooms,
// and flowers never appear in marketing images.
const NO_SHARE_PHOTO = new Set(["r612"]);

const only = process.argv.slice(2);
const ogDir = path.join(root, "public/blog/og");
fs.mkdirSync(ogDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME, headless: true });
for (const post of POSTS) {
  if (only.length && !only.includes(post.slug)) continue;
  // Product photos first; gift cards (mostly logos) only if a post runs short.
  const all = [...new Set(post.body.flatMap((b) => (b.kind === "gifts" ? b.ids : [])))];
  const isCard = (id) => /gift card/i.test(live.get(id)?.Gift ?? "");
  const ids = [...all.filter((id) => !isCard(id)), ...all.filter(isCard)].filter((id) => !NO_SHARE_PHOTO.has(id));
  const photos = [];
  for (const id of ids) {
    const row = live.get(id);
    if (!row?.PhotoAddress) continue;
    const data = await photo(row.PhotoAddress);
    if (data) photos.push(data);
    if (photos.length === 4) break;
  }
  const tab = await browser.newPage();
  await tab.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await tab.setContent(page(post.title, photos), { waitUntil: "networkidle0" });
  await tab.evaluate(() => document.fonts.ready);
  const file = path.join(ogDir, `${post.slug}.jpg`);
  await tab.screenshot({ path: file, type: "jpeg", quality: 86 });
  await tab.close();
  console.log(`${post.slug}.jpg (${photos.length} photos, ${Math.round(fs.statSync(file).size / 1024)} KB)`);
}
await browser.close();
