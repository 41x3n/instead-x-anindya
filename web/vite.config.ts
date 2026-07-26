import { defineConfig } from "vite";
import { resolve } from "node:path";

// The app lives in web/ but reuses the renderer, annotations and blank PDFs from
// the repo root, so allow the bundler/dev-server to reach one level up.
export default defineConfig({
  base: "./",
  publicDir: resolve(__dirname, "../forms"), // serves f1040.pdf / f1040sc.pdf at /
  server: { fs: { allow: [resolve(__dirname, "..")] } },
  build: { outDir: "dist", emptyOutDir: true },
});
