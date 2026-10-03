#!/usr/bin/env node
/**
 * Ranking eval: runs a fixed set of quiz answers through rankGifts on the
 * live catalog and prints the result count plus the top 8 for each query,
 * once with a baseline gifts.ts read from git and once with the working tree.
 *
 *   node scripts/eval-ranking.mjs                 # baseline = HEAD
 *   node scripts/eval-ranking.mjs --base main     # any git revision
 *   node scripts/eval-ranking.mjs --refresh       # refetch the catalog
 *   node scripts/eval-ranking.mjs --drops         # also list gifts that stop showing
 *   node scripts/eval-ranking.mjs --runs          # longest same-kind run in the top 24
 *
 * The catalog comes from https://giftpicker.io/api/gifts and is cached in the
 * OS temp dir for 12 hours. Rows go through the site's own adaptRow parser,
 * and both versions of gifts.ts are bundled with the esbuild that ships with
 * Vite, so nothing extra needs installing.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_URL = "https://giftpicker.io/api/gifts";
const CACHE_FILE = path.join(os.tmpdir(), "giftpicker-gifts.json");
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const TOP_N = Number(process.env.TOP_N || 8);

const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const BASE_REV = argValue("--base", "HEAD");
const REFRESH = args.includes("--refresh");

/** recipient / age / occasion / interests / vibe / budget, in quiz codes. */
const QUERIES = [
  ["self", "adult", "jb", "apparel,wellness,selfcare", "practical", 120],
  ["friend", "adult", "other", "best,food,wellness", "fun,luxurious", 80],
  ["sibling", "adult", "jb", "travel,rest,outdoors", "fun", 120],
  ["sibling", "teen", "bday", "creative,learn,fitness", "practical", 15],
  ["self", "adult", "holi", "cooking,gaming,food", "luxurious,practical", 500],
  ["coworker", "twenty", "appreciate", "learn,organize", "luxurious", 120],
  ["sibling", "adult", "bday", "selfcare,home,food", "fun,sentimental", 60],
  ["friend", "adult", "bday", "cooking,food,home", "fun,sentimental", 120],
  ["partner", "adult", "anni", "home,personal", "sentimental,luxurious", 200],
  ["parent", "senior", "holi", "food,home", "sentimental", 100],
  ["friend", "twenty", "housewarm", "home,food", "fun", 50],
  ["coworker", "adult", "thank", "food", "practical", 25],
  ["partner", "adult", "bday", "cooking,home,food", "sentimental", 150],
].map(([recipient, age, occasion, interests, vibe, budget]) => ({
  recipient,
  age,
  occasion,
  ...(occasion === "other" ? { occasionOther: "Graduation" } : {}),
  interests: interests.split(","),
  vibe: vibe.split(","),
  budget,
}));

async function loadCatalog() {
  const fresh =
    !REFRESH && fs.existsSync(CACHE_FILE) && Date.now() - fs.statSync(CACHE_FILE).mtimeMs < CACHE_MAX_AGE_MS;
  if (!fresh) {
    const r = await fetch(CATALOG_URL);
    if (!r.ok) throw new Error(`${CATALOG_URL} responded ${r.status}`);
    fs.writeFileSync(CACHE_FILE, await r.text());
  }
  const payload = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  if (!Array.isArray(payload?.data)) throw new Error(`Unexpected catalog shape in ${CACHE_FILE}`);
  return { rows: payload.data, cachedAt: fs.statSync(CACHE_FILE).mtime };
}

/** Bundle the site's parser plus both versions of gifts.ts into one module. */
async function loadModules() {
  const baselineSource = execFileSync("git", ["show", `${BASE_REV}:src/data/gifts.ts`], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const outfile = path.join(os.tmpdir(), `giftpicker-eval-${process.pid}.mjs`);
  await build({
    stdin: {
      contents: [
        'export { adaptRow } from "./src/data/giftsApi";',
        'export { rankGifts as rankAfter, INTEREST_LABELS } from "./src/data/gifts";',
        'export { rankGifts as rankBefore } from "baseline:gifts";',
        'export { productType } from "./src/data/similarity";',
        'export { giftKind } from "./src/data/gifts";',
      ].join("\n"),
      resolveDir: ROOT,
      loader: "ts",
      sourcefile: "eval-entry.ts",
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "error",
    // giftsApi reads a Vite env var at module load.
    define: { "import.meta.env.VITE_GIFTS_ENDPOINT": "undefined" },
    plugins: [
      {
        name: "baseline-gifts",
        setup(b) {
          b.onResolve({ filter: /^baseline:gifts$/ }, () => ({ path: "gifts.ts", namespace: "baseline" }));
          b.onLoad({ filter: /.*/, namespace: "baseline" }, () => ({
            contents: baselineSource,
            loader: "ts",
            resolveDir: path.join(ROOT, "src/data"),
          }));
        },
      },
    ],
  });
  try {
    return await import(pathToFileURL(outfile).href);
  } finally {
    fs.rmSync(outfile, { force: true });
  }
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Which of the shopper's interest codes a gift carries (display only). */
function interestHits(gift, picks, labels) {
  const tags = gift.interests.map(norm);
  return picks.filter((code) =>
    (labels[code] ?? []).some((l) => tags.some((t) => t === norm(l) || t.includes(norm(l)) || norm(l).includes(t))),
  );
}

function describe(q) {
  const occ = q.occasion === "other" ? `other ("${q.occasionOther}")` : q.occasion;
  return `${q.recipient} / ${q.age} / ${occ} / ${q.interests.join(",")} / ${q.vibe.join(",")} / $${q.budget}`;
}

/**
 * Summary of one ranked list. `mix` "2:5 1:20 0:3" = how many results match
 * 2, 1, or 0 of the picked interests; `inversions` = pairs where a gift
 * matching fewer interests ranks above one matching more.
 */
function stats(ranked, q, labels) {
  const hits = ranked.map((g) => interestHits(g, q.interests, labels).length);
  const mix = {};
  for (const h of hits) mix[h] = (mix[h] ?? 0) + 1;
  let inversions = 0;
  for (let i = 0; i < hits.length; i++) for (let j = i + 1; j < hits.length; j++) if (hits[i] < hits[j]) inversions++;
  const mixText = Object.keys(mix)
    .sort((a, b) => b - a)
    .map((h) => `${h}:${mix[h]}`)
    .join(" ");
  const lowest = ranked.length ? ranked[ranked.length - 1].matchScore : "-";
  return {
    count: ranked.length,
    inversions,
    text: `${ranked.length} results, lowest score ${lowest}, by hits ${mixText || "-"}, inversions ${inversions}`,
  };
}

function topLines(ranked, q, labels) {
  if (!ranked.length) return ["    (no results)"];
  return ranked.slice(0, TOP_N).map((g) => {
    const hits = interestHits(g, q.interests, labels);
    const hitText = `${hits.length}/${q.interests.length}${hits.length ? ` ${hits.join(",")}` : ""}`;
    const price = g.isYourChoice ? "Your choice" : g.priceLabel || "$0";
    return `    ${String(g.matchScore).padStart(3)} | ${price.padEnd(13)} | ${hitText.padEnd(28)} | ${g.name}`;
  });
}

const { rows, cachedAt } = await loadCatalog();
const mod = await loadModules();
const gifts = rows.map(mod.adaptRow);
const labels = mod.INTEREST_LABELS;

const out = [];
out.push(`Catalog: ${gifts.length} rows from ${CATALOG_URL} (cached ${cachedAt.toISOString()})`);
out.push(`Before = ${BASE_REV}:src/data/gifts.ts   After = working tree`);
out.push(`Columns: score | price | interest hits | name`);

const summary = [];
QUERIES.forEach((q, i) => {
  const before = mod.rankBefore(gifts, q);
  const after = mod.rankAfter(gifts, q);
  const sb = stats(before, q, labels);
  const sa = stats(after, q, labels);
  summary.push({ n: i + 1, d: describe(q), sb, sa });
  out.push("");
  out.push(`Q${i + 1}. ${describe(q)}`);
  out.push(`  BEFORE: ${sb.text}`);
  out.push(...topLines(before, q, labels));
  out.push(`  AFTER:  ${sa.text}`);
  out.push(...topLines(after, q, labels));
  if (args.includes("--runs")) {
    // Longest stretch of back-to-back gifts of the same kind in the first 24
    // (same product type, or same primary interest when no type is known).
    // Same product kind (giftKind), or same primary interest when no kind is known.
    const kind = (g) => mod.giftKind(g) || `primary:${g.primaryInterest || "?"}`;
    const longest = (list) => {
      const top = list.slice(0, 24).map(kind);
      let best = { len: 0, kind: "", at: 0 };
      for (let i = 0, j = 0; i < top.length; i = j) {
        for (j = i; j < top.length && top[j] === top[i]; j++);
        if (j - i > best.len) best = { len: j - i, kind: top[i], at: i + 1 };
      }
      return `${best.len} x ${best.kind} at #${best.at}`;
    };
    const brandRepeats = (list) => list.slice(0, 24).filter((g, i, a) => i > 0 && g.brand && a[i - 1].brand === g.brand).length;
    out.push(`  RUNS in top 24: before ${longest(before)}, brand repeats ${brandRepeats(before)} | after ${longest(after)}, brand repeats ${brandRepeats(after)}`);
  }
  if (args.includes("--drops")) {
    // Gifts shown before but not after, with their old score.
    const kept = new Set(after.map((g) => g.id));
    const dropped = before.filter((g) => !kept.has(g.id));
    out.push(`  DROPPED (${dropped.length}):`);
    for (const g of dropped) {
      const hits = interestHits(g, q.interests, labels);
      out.push(`    ${String(g.matchScore).padStart(3)} | ${(g.priceLabel || "$0").padEnd(13)} | ${`${hits.length}/${q.interests.length}`.padEnd(4)} | ${g.name}`);
    }
  }
});

out.push("");
out.push("Result counts and interest inversions (before -> after):");
for (const { n, d, sb, sa } of summary) {
  const pct = sb.count ? Math.round(((sa.count - sb.count) / sb.count) * 100) : 0;
  const counts = `${String(sb.count).padStart(4)} -> ${String(sa.count).padEnd(4)} (${pct >= 0 ? "+" : ""}${pct}%)`;
  const inv = `inv ${String(sb.inversions).padStart(4)} -> ${String(sa.inversions).padEnd(4)}`;
  out.push(`  Q${String(n).padEnd(3)} ${counts.padEnd(22)} ${inv}  ${d}`);
}
console.log(out.join("\n"));
