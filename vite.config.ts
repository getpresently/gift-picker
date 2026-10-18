import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build",
  },
  // /api/gifts is served by the Cloudflare Worker from KV. Locally there is no
  // worker, so the app fell back to the slow Apps Script feed (which fails about
  // 1 call in 3) and photos often never appeared; read the live endpoint instead.
  server: {
    proxy: { "/api/gifts": { target: "https://giftpicker.io", changeOrigin: true } },
  },
});
