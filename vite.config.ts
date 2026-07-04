// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Build target selection:
//   - default (Lovable preview / published Lovable hosting) → Cloudflare Workers preset
//   - BUILD_TARGET=node (MilesWeb / standard Linux Node.js hosting) → node-server preset,
//     which emits .output/server/index.mjs that `app.js` boots via Passenger.
const isNodeTarget = process.env.BUILD_TARGET === "node";

// Sentry sourcemap upload only runs when the CI-provided auth token is present.
// Locally and in preview the plugin is skipped so builds stay fast and quiet.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryEnv = process.env.VITE_SENTRY_ENV ?? "development";
const gitSha = process.env.GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
const sentryEnabled = Boolean(sentryAuthToken && gitSha);
//     which emits .output/server/index.mjs that `app.js` boots via Passenger.

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
          output: {
            dir: ".output",
            serverDir: ".output/server",
            publicDir: ".output/public",
          },
        },
      }
    : {}),

  vite: {
    plugins: [
      mcpPlugin(),
      ...(sentryEnabled
        ? [
            sentryVitePlugin({
              org: process.env.SENTRY_ORG ?? "higaet-5y",
              project: process.env.SENTRY_PROJECT ?? "javascript-react",
              authToken: sentryAuthToken,
              release: { name: `${sentryEnv}-${gitSha}` },
              sourcemaps: { assets: "./dist/**" },
              telemetry: false,
            }),
          ]
        : []),
    ],
    build: {
      // Sourcemaps only when Sentry upload is active — otherwise skip to cut peak heap.
      sourcemap: sentryEnabled ? "hidden" : false,
      minify: "esbuild",
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
    },
  },
});
