# HIGAET — Production Deployment Guide (Node SSR → MilesWeb)

Canonical operator runbook. One runtime, one build, one pipeline, one package
manager.

```text
Lovable  →  GitHub (main)  →  GitHub Actions "Deploy (Production — Node SSR → MilesWeb)"
                                   │
                                   ├─ npm ci                  (deterministic install)
                                   ├─ npm run build:node      (Nitro node-server preset)
                                   ├─ verify .output/server/index.mjs
                                   ├─ rsync release → MilesWeb
                                   ├─ npm ci --omit=dev on host
                                   ├─ symlink swap + Passenger restart
                                   └─ healthz / readyz smoke against https://higaet.com
```

Production runtime: **Linux · Node.js 22 · MilesWeb shared hosting · cPanel ·
Passenger · TanStack Start SSR · Nitro `node-server`**. There is no staging
environment and no Cloudflare runtime in production.

---

## 1. Architecture invariants

| Invariant | Enforced by |
| --- | --- |
| Production preset is `node-server` | `vite.config.ts` guard + `scripts/verify-node-build.mjs` |
| `.output/server/index.mjs` always exists after a prod build | `postbuild:node` hook, CI artifact check, deploy kernel verify |
| No Cloudflare artifacts in the release | deploy kernel rejects `wrangler.json` / `_worker.js` |
| npm everywhere in CI and production | `.github/actions/setup-node` (npm ci only) |
| Exactly one deploy pipeline | `.github/workflows/deploy.yml` → `_deploy-kernel.yml` |

Bun exists only inside the Lovable preview sandbox. It is never installed in
CI and never shipped to MilesWeb (`bun.lock` is excluded from the artifact).

---

## 2. Build

```bash
npm ci               # deterministic install from package-lock.json
npm run build:node   # canonical production build
```

`build:node` expands to:

```bash
env -u LOVABLE_SANDBOX -u DEV_SERVER__PROJECT_PATH BUILD_TARGET=node vite build
```

Clearing those two variables is mandatory: `@lovable.dev/vite-tanstack-config`
force-sets `preset: "cloudflare-module"` with output in `dist/` whenever it
detects the Lovable sandbox, overriding the `nitro.preset` in `vite.config.ts`.

`postbuild:node` then runs `scripts/verify-node-build.mjs`, which fails the
build unless:

- `.output/server/index.mjs` exists and is larger than 1 KB
- `.output/nitro.json` does not report a Cloudflare preset
- no `wrangler.json` / `_worker.js` leaked into `.output/`

Verify an existing build at any time with `npm run verify:build`.

**Never build on the MilesWeb host.** CloudLinux LVE process limits crash
Vite's Rayon thread pool. CI builds; the host only installs and runs.

Expected artifacts:

```text
.output/server/index.mjs   Nitro SSR entry (Passenger boots this)
.output/public/            static client assets
.output/nitro.json         preset metadata
.output/manifest.json      CI-generated: git SHA, size, sha256
app.js                     Passenger entry shim
package.json               engines.node = 22.x
package-lock.json          required by npm ci --omit=dev
scripts/                   predeploy validation + smoke tests
```

---

## 3. Deploy

GitHub → **Actions** → **Deploy (Production — Node SSR → MilesWeb)** →
**Run workflow** (`public_url` defaults to `https://higaet.com`).

Stages: preflight (kernel contract + environment secrets) → build → deploy →
verify. Any failed stage aborts before the symlink swap, so the previous
release stays live.

Release layout on the host (`vars.DEPLOY_DIR`):

```text
$DEPLOY_DIR/
  releases/release-<utc-timestamp>-<sha7>/   ← rsynced payload
  current -> releases/release-...            ← atomic symlink (Passenger app root)
  tmp/restart.txt                            ← restart trigger
  .previous-release                          ← manual rollback pointer
```

The five most recent releases are retained; older ones are pruned.

### cPanel Node.js App settings

| Field | Value |
| --- | --- |
| Node.js version | **22.x** (must match `.nvmrc` / `engines.node`) |
| Application mode | Production |
| Application root | `$DEPLOY_DIR/current` |
| Application URL | `https://higaet.com` |
| Application startup file | `app.js` |

The startup file must be lowercase `app.js` — cPanel is case-sensitive here.

### Restart

Automatic at the end of every deploy. Manually:

```bash
touch "$DEPLOY_DIR/tmp/restart.txt"
```

### Manual rollback

```bash
ln -sfn "$(cat "$DEPLOY_DIR/.previous-release")" "$DEPLOY_DIR/current"
touch "$DEPLOY_DIR/tmp/restart.txt"
```

---

## 4. Required environment variables

Set in **cPanel → Setup Node.js App → Environment variables**. `app.js`
validates the required set at boot and exits with an actionable stderr message
if any are missing (override only with `STRICT_ENV=0`, never in production).

Required: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`.

Client (baked at build time — must be identical in CI and on the host):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`, `VITE_SITE_URL`.

Optional: `BREVO_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`LOVABLE_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `VITE_SENTRY_DSN`.

GitHub environment `production` needs secrets `SSH_KEY`, `SSH_HOST`,
`SSH_USER`, `SSH_PORT` and variable `DEPLOY_DIR`.

See `.env.example` for the fully annotated list.

---

## 5. Health checks

| Endpoint | Purpose |
| --- | --- |
| `GET /healthz` | Liveness — 200 whenever the SSR process is up. No I/O. |
| `GET /readyz` | Readiness — 200 when required env and backend reachability check out, 503 with a per-dependency breakdown otherwise. |
| `GET /api/public/health` | Richer JSON (service name, correlation ID). |
| `GET /api/public/sre/e2e-health` | End-to-end health including backend reachability. |

Point Passenger and uptime monitors at `/healthz`; use `/readyz` for
deploy gating.

```bash
curl -fsS https://higaet.com/healthz | jq .
curl -fsS https://higaet.com/readyz  | jq .
```

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| 503 from Passenger | `.output/server/index.mjs` missing | Re-run the deploy workflow; check the build job's verification step |
| Build emits `dist/` not `.output/` | Sandbox variables set during build | Use `npm run build:node`, never bare `vite build` |
| `Cannot find module` at boot | Host dependencies not installed | `cd $DEPLOY_DIR/current && ./install-production.sh` |
| Boot exits with missing-env list | cPanel env vars incomplete | Add them, then `touch tmp/restart.txt` |
| Rayon / thread panic | Building on the host | Build in CI only |
