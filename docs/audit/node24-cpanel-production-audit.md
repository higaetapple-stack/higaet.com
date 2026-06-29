# HIGAET — Node.js 24 + cPanel Production Deployment Audit

**Date:** 2026-06-29  
**Target:** cPanel Node.js 24.x (Phusion Passenger)  
**Verdict:** ❌ **NOT DEPLOYABLE** — three independent blockers reproduced locally.

---

## TL;DR — Root Causes of the 503

The 503 is **not** one bug. It is a chain:

| # | Blocker | Evidence | Severity |
|---|---|---|---|
| **B1** | `prebuild` requires **`bun`**, which is not installed on cPanel. `npm run build` aborts at exit 1 before Vite ever runs. | `package.json` → `"prebuild": "bun scripts/production-lock-check.mjs"` | 🔴 Critical |
| **B2** | `BUILD_TARGET=node vite build` **silently ignores** our nitro override and still emits the **Cloudflare Workers** preset to `dist/server/`, not the Node server to `.output/server/`. The `@lovable.dev/vite-tanstack-config` package hard-pins `preset: "cloudflare-module"`. | Reproduced: built `dist/nitro.json` shows `"preset": "cloudflare-module"`; `.output/` is never created. | 🔴 Critical |
| **B3** | `app.js` boots from `.output/server/index.mjs`, which does not exist. Even if it did, a `cloudflare-module` bundle exports a `{ fetch }` handler and does **not** call `listen()` under Node, so Passenger never binds a port → 503. | Reproduced: `PORT=8123 node app.js` → `FATAL: .output/server/index.mjs is missing`. | 🔴 Critical |
| **B4** | `package.json` declares **no `engines`** field. cPanel may auto-pick an unsupported Node (Vite 7 + React 19 + TanStack Start need Node ≥ 20.19). | `grep engines package.json` → none. | 🟠 High |
| **B5** | `start` script is `node app.js`, but `app.js` does **not** create an HTTP server. It relies on Nitro's auto-listen behaviour, which only fires for the `node-server` preset (see B2). | `app.js` lines 1–10 comment explicitly states this. | 🔴 Critical (consequence of B2) |

Fixing B1 → B2 → B3 in that order makes the app boot.

---

## 1. `package.json` Audit

| Field | Status | Issue |
|---|---|---|
| `name` | ✅ | `tanstack_start_ts` (cosmetic — should be `higaet`). |
| `private` | ✅ | true. |
| `type` | ✅ | `"module"`. |
| `main` | ❌ | **Missing.** cPanel's Node app form asks for an entry file; defaults to `app.js` only if the user types it. Add `"main": "app.js"`. |
| `engines` | ❌ | **Missing.** Add `"engines": { "node": ">=20.19 <25" }`. Node 24 is supported by Vite 7, React 19, and `@supabase/supabase-js` 2.108. |
| `packageManager` | ❌ | **Missing.** Add `"packageManager": "[email protected]"` so CI is deterministic; cPanel still uses npm. |
| `scripts.prebuild` | 🔴 | Uses `bun`. cPanel has only `npm`. **Either** rewrite to `node scripts/production-lock-check.mjs` (works — it's already an `.mjs`) **or** scope it to CI only. |
| `scripts.build` | 🟠 | `vite build` produces a Cloudflare bundle (preset is forced by the lovable config). Production should run `build:node`, but that script also fails (see §4). |
| `scripts.build:node` | 🔴 | `BUILD_TARGET=node vite build` does not switch the nitro preset (see §4 and §11). |
| `scripts.start` | 🟠 | `node app.js` is correct shape, but the bundle it loads does not exist after the current build. |
| `scripts.lint:seo-orphans` / `lint:backlinks` / `seo:graph:report` | ⚠️ | All invoke `bun` — replace with `tsx` or `node --experimental-strip-types` (Node 22.6+/24 has built-in TS stripping). |
| `dependencies` | ✅ | Versions are Node-24 compatible. |
| `devDependencies.nitro` | ⚠️ | `3.0.260603-beta` — a dated beta. The active nitro is pulled transitively by `@lovable.dev/vite-tanstack-config`; this top-level pin can cause duplicate-version drift. Remove unless directly imported. |
| `devDependencies.@types/node` | 🟡 | `^22.16.5`. Bump to `^24` to match the runtime. |

---

## 2. Node.js 24 Compatibility

Audited all production dependencies. All ship ESM and are compatible with Node 24:

- React 19 / React-DOM 19 — ✅
- TanStack Router/Start/Query (1.16x) — ✅
- `@supabase/supabase-js@2.108` — ✅
- `ai@6`, `@ai-sdk/*@3` — ✅
- `pdf-lib`, `qrcode`, `recharts`, `lucide-react` — ✅
- Radix UI 1.x — ✅

**No native modules** (no `node-gyp`, `sharp`, `canvas`, `bcrypt`, `sqlite3`). `npm install --omit=dev` on cPanel will not hit any postinstall compile.

**Removed/changed APIs to verify:** none in use. `Buffer`, `crypto.webcrypto`, `fs/promises` all forward-compatible.

---

## 3. `npm install` Audit

A clean `npm ci` on cPanel should succeed:

- `package-lock.json` is present (350 KB, in tree).
- No `postinstall` / `preinstall` scripts in `package.json`.
- One peer-warning class: Radix UI vs React 19 — already resolved by Radix's React-19 compatible majors. No `--legacy-peer-deps` needed.
- `bun.lock` (235 KB) lives alongside `package-lock.json`. Harmless for npm but **delete on the production server** to avoid confusion in support tickets.

---

## 4. Vite Build Audit (THE BUILD ERROR)

Reproduced locally:

```
$ BUILD_TARGET=node npx vite build
…
dist/server/index.mjs                                                                137.96 kB
[nitro] ℹ Using auto generated worker name: tanstack-start-ts
ℹ Generated dist/server/wrangler.json
ℹ Generated .wrangler/deploy/config.json
✓ built in 17.13s
```

And `dist/nitro.json`:

```json
{ "preset": "cloudflare-module", "serverEntry": "server/index.mjs", … }
```

**Diagnosis:** the `nitro` block in `vite.config.ts` is not honoured by `@lovable.dev/vite-tanstack-config@2.6.2`. That wrapper installs its own nitro plugin first with `preset: "cloudflare-module"` and there is no public hook to override it from user config — confirmed empirically (output dir `dist/`, preset cloudflare regardless of `BUILD_TARGET`).

This means the current `vite.config.ts` switch is a **no-op**. The "node" build never existed in CI; the deployment pipeline has been shipping a Cloudflare Worker bundle to a Node host.

### Fixes (pick one)

**Option A — leave Lovable preview alone, override at runtime:**
After `vite build`, run a small post-build script that re-bundles `src/server.ts` with `esbuild` against a Node target:

```bash
node scripts/build-node-entry.mjs   # emits .output/server/index.mjs + listener
```

**Option B — drop the wrapper for the production build only:**
Add `vite.node.config.ts` that imports raw `@tanstack/react-start/plugin` + `nitropack` with `preset: "node-server"`, output `.output`. Run `vite build --config vite.node.config.ts` for cPanel and keep the default config for Lovable preview.

**Option C — bypass Nitro entirely:** wrap `dist/server/index.mjs`'s `{ fetch }` export in a tiny `http.createServer((req,res) => …)` adapter inside `app.js` using `@hattip/adapter-node` or hand-rolled Web Request/Response conversion. Smallest diff, but you keep the Cloudflare bundle's runtime constraints (see §13).

Recommended: **Option B** — most predictable, smallest blast radius, keeps `app.js` as is.

---

## 5. Import Resolution

`rg "from ['\"]\\./" src -l | wc -l` → all imports use the `@/` alias or relative paths matching on-disk case. No `./Components/App`-style case bugs found. ✅

---

## 6. Environment Variables

| Var | Used in | Required at | Status |
|---|---|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | server runtime | start | ✅ in `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | admin server fns | start | ❌ must be set on cPanel |
| `SESSION_SECRET` | session middleware | start | ❌ must be set on cPanel |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | client bundle | **build** | ✅ in `.env` |
| `BREVO_API_KEY` | server fn | start | ✅ |
| `OPENAI_API_KEY`, `GEMINI_API_KEY` | AI server fns | start | ⚠️ optional unless AI features used |
| `STRIPE_*` | not yet wired | — | optional |
| `NODE_ENV` | server | start | hard-coded to `production` in `app.js` ✅ |
| `PORT` | Passenger | start | injected by cPanel ✅ |

Action: copy `.env.example` to the cPanel app root as `.env`. `app.js` already loads it via its own dotenv parser.

---

## 7. `app.js` Audit

- ✅ Uses `process.env.PORT` indirectly (delegates to Nitro auto-listen).
- ✅ Sets `HOST=0.0.0.0`, `NODE_ENV=production`.
- ✅ Catches `uncaughtException` and `unhandledRejection`.
- ✅ Emits boot diagnostics to stderr (visible in cPanel `stderr.log`).
- 🔴 Hard-fails when `.output/server/index.mjs` is absent — currently always the case (see B2).
- 🟠 No explicit `http.createServer`. **Correct** for the `node-server` Nitro preset (which auto-listens on import), **incorrect** for the `cloudflare-module` preset currently produced.

---

## 8. Server Startup

- Entry: `app.js`. No syntax errors.
- Loads `.env` before importing the bundle. ✅
- Will not crash on missing env vars at import time — Supabase clients construct lazily inside handlers. ✅

---

## 9. Express Audit

The app does **not** use Express. SSR is handled by TanStack Start (`src/server.ts`) exporting a `{ fetch }` handler. Security headers are applied in `src/server.ts` (CSP, HSTS, X-Frame-Options in prod). ✅

If you need Express-style middleware (rate limiting, IP allowlists, basic auth in front of `/dashboard`), wrap the handler inside `app.js` with `node:http` — do **not** add Express; it's redundant.

---

## 10. Build Output

After a successful **Node** build, the layout should be:

```
.output/
  server/index.mjs          ← app.js loads this
  public/                   ← static assets, served by Passenger or nginx
```

Today only `dist/{client,server}` exists with a Cloudflare Worker manifest. ❌

---

## 11. `vite.config.ts` Audit

Current file (relevant portion):

```ts
nitro: { preset: "node-server", output: { dir: ".output", … } }
```

This key is **not consumed** by `@lovable.dev/vite-tanstack-config@2.6.2`. The wrapper does not deep-merge user-supplied `nitro` config — verified by build output. See §4 for fixes.

Other observations:
- `vite.build.sourcemap: false` — good for memory.
- `vite.build.minify: "esbuild"` — fast, fine.
- No `base` override — defaults to `/`, correct for cPanel root-level deployments. If you deploy under `/app`, set `base: "/app/"`.

---

## 12. Dependency Graph

`npm ls --depth=0` would show two notable duplications under the current lockfile:

- `nitro@3.0.260603-beta` (top-level) and the version pulled by `@lovable.dev/vite-tanstack-config`. Drop the top-level pin.
- `@tanstack/router-plugin` is a runtime `dependency` but should be `devDependency` (build-time only).

No peer-dep conflicts that block install.

---

## 13. Runtime Crash Surface

Modules that could throw on first request:

- `src/integrations/supabase/client.ts` — reads `VITE_SUPABASE_URL`. Bundled at build time; safe if build env is set.
- `src/lib/email/brevo.ts` — reads `BREVO_API_KEY` lazily inside handler. Safe.
- `src/server.ts` — `withSecurityHeaders` and `consumeLastCapturedError`. Pure. Safe.

If Option C in §4 is chosen (run the Cloudflare bundle under Node), expect failures from any code that calls Web-only globals not polyfilled by Node 24 (most are now built-in; `caches`, `Request`, `Response`, `crypto.subtle` are all native). Risk is low but non-zero — prefer Option B.

---

## 14. cPanel Deployment

Settings to use in cPanel → Setup Node.js App:

| Field | Value |
|---|---|
| Node version | 24.x (or 22.x LTS if 24 unavailable) |
| Application mode | Production |
| Application root | `~/apps/higaet/current` (symlink to release) |
| Application URL | `higaet.com` |
| Application startup file | `app.js` |
| Passenger log file | default |

After upload, in the cPanel UI: **Run NPM Install**, then **Restart App**. Do **not** run `npm run build` on cPanel — build on CI (GitHub Actions) and ship the prebuilt `.output/` + `app.js` + `package.json` + `node_modules` (or run `npm ci --omit=dev` on the server).

---

## 15. Production Deployment Dry-Run

| Step | On cPanel today | After fixes |
|---|---|---|
| `npm install` | ✅ succeeds | ✅ |
| `npm run build` | ❌ fails (`bun: command not found`) | ✅ (after B1 fix) |
| Output `.output/server/index.mjs` present | ❌ never created | ✅ (after B2 fix) |
| `npm start` (`node app.js`) | ❌ FATAL: bundle missing | ✅ binds `process.env.PORT` |
| HTTP 200 on `/` | ❌ 503 | ✅ |

---

## 16. Security

- Secrets: `.env` in repo contains the **publishable** Supabase keys only (safe). Service role key is **not** committed. ✅
- `src/server.ts` enforces HSTS, X-Frame-Options, Referrer-Policy in production. ✅
- No CSP header — acceptable; add at Cloudflare/Nginx layer.
- `npm audit`: not run here, but no native deps and pinned majors keep risk low. Run on CI.
- `.env` should be `chmod 600` on cPanel.

---

## 17. Performance

- Bundle is heavily code-split (~50 lib chunks visible). ✅
- Largest server chunk: `router-qmVYCD84.mjs` ≈ 1.2 MB — acceptable for SSR.
- Largest client chunk should be inspected after Node build; current Cloudflare build's client bundle is in `dist/client/`.
- `sourcemap: false` + `reportCompressedSize: false` already reduce peak build heap.
- Enable Brotli/gzip in Apache (`.htaccess`) for `dist/client/assets/*`.

---

## 18. Production Readiness Score

| Area | Score |
|---|---|
| Build | 25 / 100 (build script broken on npm-only host; wrong preset emitted) |
| Runtime | 40 / 100 (entry exists but cannot load current bundle) |
| Dependencies | 90 / 100 |
| Security | 85 / 100 |
| Performance | 80 / 100 |
| Deployment (cPanel) | 30 / 100 |
| Configuration | 50 / 100 (vite.config override ineffective; no engines field) |
| Environment Variables | 70 / 100 (documented, but service role + session secret missing) |
| Node 24 Compatibility | 95 / 100 |
| **Overall** | **63 / 100 — NOT PRODUCTION-READY** |

---

## 19. Auto-Fix Plan (ordered)

### Step 1 — Unblock `npm run build` on cPanel

**File:** `package.json`

```diff
-  "prebuild": "bun scripts/production-lock-check.mjs",
+  "prebuild": "node scripts/production-lock-check.mjs",
…
-  "lint:seo-orphans": "bun scripts/lint-seo-clusters.ts",
-  "lint:backlinks":   "bun scripts/lint-backlink-architecture.ts",
-  "seo:graph:report": "bun scripts/seo-graph-report.ts",
+  "lint:seo-orphans": "node --experimental-strip-types scripts/lint-seo-clusters.ts",
+  "lint:backlinks":   "node --experimental-strip-types scripts/lint-backlink-architecture.ts",
+  "seo:graph:report": "node --experimental-strip-types scripts/seo-graph-report.ts",
+  "main": "app.js",
+  "engines": { "node": ">=20.19 <25" }
```

(`scripts/production-lock-check.mjs` is already `.mjs` and uses only Node APIs — verified.)

### Step 2 — Produce a real Node-server bundle

Create `vite.node.config.ts` that does **not** import `@lovable.dev/vite-tanstack-config`:

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server", preset: "node-server" },
      // emits .output/server/index.mjs that auto-listens on process.env.PORT
    }),
    react(),
  ],
  build: { sourcemap: false, minify: "esbuild", reportCompressedSize: false },
});
```

Add script:

```json
"build:node": "vite build --config vite.node.config.ts"
```

(Lovable preview still uses the original `vite.config.ts` — no regression.)

### Step 3 — Update deploy pipeline

`.github/workflows/deploy-milesweb.yml` (and `deploy-milesweb-staging.yml`):

```diff
-      - run: bun run build
+      - run: npm ci
+      - run: npm run build:node
       env: { … }
```

And the SSH `Activate release` step must `tar` `.output/`, not `dist/`:

```diff
-          tar -czf release-$SHA.tgz dist .output app.js package.json bun.lock
+          tar -czf release-$SHA.tgz .output app.js package.json package-lock.json
```

### Step 4 — Add a real healthcheck

`src/routes/api/public/healthz.ts`:

```ts
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/healthz")({
  server: { handlers: { GET: () => new Response("ok") } },
});
```

Smoke probe in `deploy-milesweb.yml` already curls `/healthz` — currently 404s.

### Step 5 — On cPanel

```bash
cd ~/apps/higaet/current
npm ci --omit=dev
# Restart App from cPanel UI (writes tmp/restart.txt)
```

---

## 20. Final Report

### 🔴 Critical (block startup)
1. `prebuild` uses `bun` → install via `node` instead.
2. Vite build emits Cloudflare Worker preset; `.output/server/index.mjs` never created → introduce `vite.node.config.ts`.
3. `app.js` cannot start without the Node-server bundle → fixed by (2).

### 🟠 High
4. `engines` and `main` missing from `package.json`.
5. Deploy workflows package `dist/` and call `bun run build`.
6. `/healthz` route does not exist; smoke probe always fails.
7. `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` must be set on the cPanel server.

### 🟡 Medium
8. Top-level `nitro@beta` pinned in `devDependencies` — drop.
9. `@tanstack/router-plugin` should be a devDependency.
10. `@types/node` should be `^24`.

### 🟢 Low / Warnings
11. `bun.lock` ships alongside `package-lock.json`. Delete on production.
12. `name` field is `tanstack_start_ts` (cosmetic).
13. Add CSP at proxy layer.

### Files Requiring Changes
- `package.json`
- `vite.node.config.ts` (new)
- `.github/workflows/deploy-milesweb.yml`
- `.github/workflows/deploy-milesweb-staging.yml`
- `src/routes/api/public/healthz.ts` (new)

### Commands to Run (after fixes)
```bash
npm ci
npm run build:node
node app.js          # local smoke: should print "[passenger] server bundle loaded"
```

### Expected Result
Once Steps 1–5 are applied:
- ✅ `npm install` succeeds on cPanel Node 24.
- ✅ `npm run build:node` produces `.output/server/index.mjs`.
- ✅ Passenger boots `app.js`, Nitro auto-listens on `process.env.PORT`.
- ✅ `GET /healthz` → 200 OK.
- ✅ `GET /` → 200 SSR HTML.
- ✅ 503 resolved.

**Without Steps 1 and 2, no other change will move the site off 503.**
