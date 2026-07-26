// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// ─── Production runtime: Node SSR (canonical) ───────────────────────────────
// The ONLY supported production runtime is Nitro's `node-server` preset,
// booted by app.js under MilesWeb cPanel + Passenger on Node.js 22.
//
//   BUILD_TARGET=node  → node-server preset, emits .output/server/index.mjs
//   (unset)            → Lovable preview/dev only; never deployed to MilesWeb.
//
// IMPORTANT: @lovable.dev/vite-tanstack-config detects the Lovable sandbox via
// LOVABLE_SANDBOX / DEV_SERVER__PROJECT_PATH and, when detected, force-sets
// `preset: "cloudflare-module"` with output in dist/, overriding the nitro
// options below. `npm run build:node` strips those two variables (via `env -u`)
// so the node-server preset always wins. The guard below makes an accidental
// bare `BUILD_TARGET=node vite build` fail loudly instead of silently shipping
// a Cloudflare bundle that Passenger cannot boot.
const isNodeTarget = process.env.BUILD_TARGET === "node";

if (isNodeTarget) {
  const sandboxSignals = ["LOVABLE_SANDBOX", "DEV_SERVER__PROJECT_PATH"].filter(
    (name) => process.env[name],
  );
  if (sandboxSignals.length > 0) {
    throw new Error(
      `[higaet] BUILD_TARGET=node was requested, but the Lovable sandbox signal(s) ` +
        `${sandboxSignals.join(", ")} are set. The Lovable Vite wrapper would override ` +
        `the Nitro preset to "cloudflare-module" and emit dist/ instead of ` +
        `.output/server/index.mjs, which Passenger cannot boot.\n` +
        `Run \`npm run build:node\` (it clears those variables) instead of calling vite directly.`,
    );
  }
}

// Sentry sourcemap upload only runs when the CI-provided auth token is present.
// Locally and in preview the plugin is skipped so builds stay fast and quiet.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryEnv = process.env.VITE_SENTRY_ENV ?? "development";
const gitSha = process.env.GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
const sentryEnabled = Boolean(sentryAuthToken && gitSha);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Colocated test files under src/routes/**/__tests__/ are not routes.
    tsr: { routeFileIgnorePattern: "(__tests__|\\.test\\.|\\.spec\\.)" },
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
