#!/usr/bin/env node
/**
 * Checks the blog against the live catalog: every gift a post references
 * (src/data/posts.ts) must be live on the site (Status Live and Review status
 * TRUE), and each post, rendered with the real page component, must show every
 * one of those gifts as a link to its /gift/:id page and as a gift card.
 * Gifts still waiting for a catalog row (`new-<key>` in PENDING_GIFTS) are
 * reported as pending, not failed, and must render as plain text.
 *
 *   node scripts/check-posts.mjs
 *
 * Needs network access: it reads https://giftpicker.io/api/gifts (the edge
 * copy of the live rows) and falls back to the Apps Script feed. Bundles with
 * the esbuild that ships with Vite. Exits 1 if any check fails.
 */
import { build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-posts-"));
const out = path.join(dir, "check-posts.mjs");
process.on("exit", () => fs.rmSync(dir, { recursive: true, force: true }));

await build({
  stdin: {
    contents: `
      export { createElement } from "react";
      export { renderToString } from "react-dom/server";
      export { MemoryRouter } from "react-router-dom";
      export { BlogPostView } from "./src/components/Blog";
      export { POSTS, postGiftIds, isPendingGift, PENDING_GIFTS } from "./src/data/posts";
      export { adaptRow, isShownOnSite, API_ENDPOINT } from "./src/data/giftsApi";
    `,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  jsx: "automatic",
  outfile: out,
  // react-dom/server is CommonJS and requires Node built-ins; give the ESM bundle a require().
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
  // Vite fills import.meta.env at build time; here it is empty, so defaults apply.
  define: { "import.meta.env": "{}", "process.env.NODE_ENV": '"production"' },
  logLevel: "error",
});
const M = await import(pathToFileURL(out).href);

async function liveRows() {
  try {
    const r = await fetch("https://giftpicker.io/api/gifts", { signal: AbortSignal.timeout(20000) });
    const body = await r.json();
    if (r.ok && Array.isArray(body?.data) && body.data.length) return body.data.filter(M.isShownOnSite);
  } catch {
    // fall through to the origin feed
  }
  const r = await fetch(`${M.API_ENDPOINT}?tab=Gifts`, { signal: AbortSignal.timeout(90000) });
  const body = await r.json();
  return (body.data ?? []).filter(M.isShownOnSite);
}

let rows;
try {
  rows = await liveRows();
} catch (err) {
  console.error(`check-posts: could not read the live catalog (${err}). This check needs network access.`);
  process.exit(1);
}
if (!rows.length) {
  console.error("check-posts: the live catalog came back empty.");
  process.exit(1);
}

const gifts = rows.map(M.adaptRow);
const byId = new Map(gifts.map((g) => [g.id, g]));
const live = new Set(byId.keys());
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

let failed = 0;
const pendingAll = new Set();
for (const post of M.POSTS) {
  const html = M.renderToString(
    M.createElement(M.MemoryRouter, null, M.createElement(M.BlogPostView, { post, byId, loading: false, live })),
  );
  const problems = [];
  const pending = M.postGiftIds(post).filter(M.isPendingGift);
  for (const id of pending) {
    pendingAll.add(id);
    if (html.includes(`/gift/${id}"`)) problems.push(`${id} is pending but rendered as a link`);
  }
  for (const id of M.postGiftIds(post).filter((id) => !M.isPendingGift(id))) {
    const gift = byId.get(id);
    if (!gift) {
      problems.push(`${id} is not live on the site`);
      continue;
    }
    if (!html.includes(`href="/gift/${id}"`)) problems.push(`${id} (${gift.name}) is not rendered as a link`);
    if (!html.includes(esc(gift.name))) problems.push(`${id} (${gift.name}) has no gift card`);
  }
  if (problems.length) {
    failed++;
    console.log(`FAIL  ${post.slug}\n      ${problems.join("\n      ")}`);
  } else {
    const live = M.postGiftIds(post).length - pending.length;
    console.log(`ok    ${post.slug}: ${live} gifts live, linked, and carded${pending.length ? `; ${pending.length} pending (${pending.join(", ")})` : ""}`);
  }
}
if (pendingAll.size) {
  console.log(`\nPending catalog rows (not failures): ${[...pendingAll].map((k) => `${k} (${M.PENDING_GIFTS[k]?.name ?? "?"})`).join("; ")}`);
}
console.log(failed ? `\n${failed} post(s) failed` : `\nAll posts check out against ${gifts.length} live gifts`);
process.exit(failed ? 1 : 0);
