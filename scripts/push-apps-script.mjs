#!/usr/bin/env node
/**
 * Push the Apps Script (docs/apps-script.gs plus the pending edits in
 * apps-script/edits.json) with clasp, deploy it to the existing web app
 * deployment so the URL never changes, and optionally apply the edits.
 *
 *   node scripts/push-apps-script.mjs            # push + deploy
 *   node scripts/push-apps-script.mjs --apply    # ...then apply pending edits
 *
 * One-time setup (Dalia): turn on the Apps Script API at
 * https://script.google.com/home/usersettings and run `npx @google/clasp login`.
 * apps-script/.clasp.json holds the script id; DEPLOYMENT_ID is the live web app.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "apps-script");
const SRC = path.join(DIR, "src");
const DEPLOYMENT_ID = "AKfycbwPuaXtXuurdqNg94_mGoOR1YHXqKrJyZrkxkt09oFbGGZtS_KdH44vhJNn4qLzeJqhuQ";
const EXEC_URL = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

const clasp = (...args) => execFileSync("npx", ["-y", "@google/clasp", ...args], { cwd: DIR, stdio: "inherit" });

fs.mkdirSync(SRC, { recursive: true });
fs.copyFileSync(path.join(ROOT, "docs/apps-script.gs"), path.join(SRC, "Code.js"));
const { edits } = JSON.parse(fs.readFileSync(path.join(DIR, "edits.json"), "utf8"));
fs.writeFileSync(
  path.join(SRC, "edits.js"),
  `/** Generated from apps-script/edits.json by scripts/push-apps-script.mjs; do not edit here. */\nconst PENDING_EDITS = ${JSON.stringify(edits, null, 1)};\n`,
);
if (!fs.existsSync(path.join(SRC, "appsscript.json"))) {
  console.error("Missing apps-script/src/appsscript.json: run `npx @google/clasp pull` in apps-script/ once first.");
  process.exit(1);
}

clasp("push", "--force");
clasp("deploy", "--deploymentId", DEPLOYMENT_ID, "--description", `push ${new Date().toISOString()}`);

if (process.argv.includes("--apply")) {
  // Apps Script answers about 1 in 3 calls with an HTML error page; retry.
  for (let i = 1; i <= 5; i++) {
    const res = await fetch(`${EXEC_URL}?tab=Gifts&edits=1&t=${Date.now()}`, { redirect: "follow" });
    const text = await res.text();
    if (res.ok && text.startsWith("{")) {
      console.log(`Edits applied (catalog read ${JSON.parse(text).data?.length ?? "?"} rows). See the Edit log tab.`);
      break;
    }
    console.log(`Apply attempt ${i} failed (${res.status}), retrying`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
