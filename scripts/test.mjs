// Runs scripts/logic.test.ts: bundles it with esbuild (installed with Vite)
// into a temp file, then lets node:test run it. Usage: npm test
import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "giftpicker-test-"));
const outfile = join(dir, "logic.test.mjs");
process.on("exit", () => rmSync(dir, { recursive: true, force: true }));

await build({
  entryPoints: [new URL("./logic.test.ts", import.meta.url).pathname],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile,
  // Vite fills import.meta.env at build time; here it is empty, so the default tag applies.
  define: { "import.meta.env": "{}" },
  logLevel: "warning",
});
await import(pathToFileURL(outfile).href);
