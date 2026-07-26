# HIGAET — Node SSR Production Architecture Stabilization

Status: **implemented**. This document records the root cause, the corrective
changes, the verification procedure and the residual risks of collapsing the
repository onto a single canonical production runtime.

---

## 1. Root cause analysis

### 1.1 Primary — Cloudflare preset override (build system)

`@lovable.dev/vite-tanstack-config@2.7.7` decides the Nitro preset from the
environment, not only from user config
(`dist/index.js:80-83`, `:552-570`):

```js
const isSandbox = process.env.LOVABLE_SANDBOX === "1" || !!process.env.DEV_SERVER__PROJECT_PATH;
...
const nitroOpts = { defaultPreset: "cloudflare-module", ...userNitroOpts };
if (isSandbox) {
  delete nitroOpts.defaultPreset;
  nitroOpts.preset = "cloudflare-module";
  nitroOpts.output = { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" };
}
```

When either variable is present, the explicit `nitro.preset: "node-server"` and
`output.dir: ".output"` in `vite.config.ts` are discarded. The build then emits
a Cloudflare Workers bundle in `dist/`, `.output/server/index.mjs` is never
created, Passenger's `app.js` cannot import its entry, and the site returns
**503**. There is no configuration flag to disable this branch; the only lever
is the environment.

### 1.2 Secondary — dual package managers

CI installed with `bun install --frozen-lockfile` while production installs with
`npm ci --omit=dev`. Two resolvers, two lockfiles (`bun.lock`,
`package-lock.json`), one runtime — CI could pass against a dependency graph
that production never installs.

### 1.3 Tertiary — duplicated deployment logic

`deploy.yml` and `deploy-and-verify.yml` both built and deployed through the
same kernel with different inputs, and the kernel still accepted `staging` and
`brevo` targets that no longer exist. Multiple entry points meant no single
enforceable contract.

### 1.4 Quaternary — ambiguous release payload

The CI artifact shipped `dist/` (browser/Cloudflare output) and `bun.lock`
alongside `.output/`, so a Cloudflare bundle could reach the production host
even when the Node bundle was correct.

---

## 2. Corrective changes

| # | File | Change |
| --- | --- | --- |
| 1 | `vite.config.ts` | Hard guard: `BUILD_TARGET=node` with `LOVABLE_SANDBOX` / `DEV_SERVER__PROJECT_PATH` set now throws with a remediation message instead of silently producing a Cloudflare bundle. |
| 2 | `scripts/verify-node-build.mjs` (new) | Asserts `.output/server/index.mjs` exists and is >1 KB, that `nitro.json` reports a non-Cloudflare preset, and that no `wrangler.json` / `_worker.js` leaked in. |
| 3 | `package.json` | `prebuild:node` (lockfile check) and `postbuild:node` (verifier) hooks; `verify:build` script; verifier also hooked to the constrained build. |
| 4 | `.github/actions/setup-node/` (replaces `setup-node-bun/`) | Node 22 + `npm ci` + npm cache. Bun removed from CI entirely. |
| 5 | All workflows | `bun run` → `npm run`, `bunx` → `npx`, `bun install --frozen-lockfile` → `npm ci`, `bun script.ts` → `node --experimental-strip-types`; standalone `oven-sh/setup-bun` steps replaced with the shared action. |
| 6 | `_ci-kernel.yml` | Defaults changed to `build-command: npm run build:node` / `build-target: node`; artifact check runs the verifier; `dist/` and `bun.lock` removed from the uploaded payload. |
| 7 | `deploy.yml` | Rewritten as the single production pipeline: preflight → build → deploy → verify. Staging/brevo choices removed. |
| 8 | `deploy-and-verify.yml` | Deleted (duplicate). |
| 9 | `_deploy-kernel.yml` | Accepts `production` only; rejects Cloudflare artifacts in the payload; installs host dependencies automatically with `npm ci --omit=dev`. |
| 10 | `.env.example` | Restructured into required-production / site / optional / CI-only / development-only scopes with `[CLIENT]` vs `[SERVER]` markers. |
| 11 | `docs/infrastructure/milesweb-deployment-guide.md` | Rewritten to match the actual release/symlink model and the single pipeline. |

`/healthz` (`src/routes/healthz.ts`) and `/readyz` (`src/routes/readyz.ts`)
already existed as Nitro server-route handlers and are Node-runtime compatible;
they are unchanged and are now asserted by the post-deploy smoke stage.

---

## 3. Build verification procedure

```bash
npm ci
npm run build:node        # verifier runs automatically via postbuild:node
npm run verify:build      # re-check an existing .output/ at any time
```

Expected verifier output:

```text
── Node SSR build verification ─────────────────────────────
  ✓ server entry: .output/server/index.mjs (≈121000 bytes)
  ✓ nitro preset: node-server
  ✓ canonical Node SSR output verified
```

Negative control — this must fail:

```bash
LOVABLE_SANDBOX=1 BUILD_TARGET=node npx vite build   # throws from vite.config.ts
```

Guarantee chain for `.output/server/index.mjs`:

1. `vite.config.ts` refuses to build a Node target under sandbox signals.
2. `postbuild:node` fails the build if the entry is missing or Cloudflare-shaped.
3. `_ci-kernel.yml` re-runs the verifier and refuses to upload a bad artifact.
4. `_deploy-kernel.yml` refuses to deploy an artifact without the entry.
5. Remote layout check re-verifies the file after rsync, before the symlink swap.
6. Post-deploy smoke fails the run if `/healthz` and `/readyz` do not answer.

---

## 4. Deployment procedure

GitHub → Actions → **Deploy (Production — Node SSR → MilesWeb)** → Run workflow.
Full operator detail in `docs/infrastructure/milesweb-deployment-guide.md`.

---

## 5. Risk assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Lovable changes sandbox detection in a future wrapper release | Medium | High | Build runs in CI where the variables are absent; the guard plus verifier fail loudly rather than shipping a Cloudflare bundle |
| `bun.lock` and `package-lock.json` drift | Medium | Medium | `pr-checks.yml` lockfile-sync job compares top-level resolutions; only `package-lock.json` reaches CI and production |
| Host `npm ci --omit=dev` hits CloudLinux LVE limits | Low | Medium | Install only (no compilation); `install-production.sh` ships in the release for a manual retry |
| Passenger app root not pointed at `$DEPLOY_DIR/current` | Low | High | Documented in the cPanel settings table; a stale root serves an old release rather than failing |
| Removal of `dist/` from the artifact breaks a downstream consumer | Low | Low | Sentry sourcemap workflow already prefers `.output/`; other consumers rebuild |

Residual: Lovable Preview still builds with the Cloudflare preset internally.
That path is development-only, is never deployed, and is intentionally left
untouched.

---

## 6. Success criteria

| Criterion | Status |
| --- | --- |
| One production runtime (Node 22 SSR) | met |
| One production build (`npm run build:node`) | met |
| One deployment pipeline (`deploy.yml`) | met |
| One package manager in CI + production (npm) | met |
| Deterministic SSR output | met — verified at six checkpoints |
| cPanel / Passenger / MilesWeb compatibility | met |
