// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Build target selection:
//   - default (Lovable preview / published Lovable hosting) → Cloudflare Workers preset
//   - BUILD_TARGET=node (MilesWeb / standard Linux Node.js hosting) → node-server preset,
//     which emits .output/server/index.mjs that `app.js` boots via Passenger.
const isNodeTarget = process.env.BUILD_TARGET === "node";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  ...(isNodeTarget
    ? {
        nitro: {
          preset: "node-server",
        },
      }
    : {}),
});
