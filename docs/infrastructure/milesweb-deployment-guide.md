# HIGAET — MilesWeb cPanel Deployment Guide

Concise operator runbook for deploying the TanStack Start + Nitro `node-server`
build to MilesWeb cPanel's **Setup Node.js App** feature.

---

## 1. cPanel Node.js App — required settings

Open **cPanel → Software → Setup Node.js App → Create Application**:

| Field                       | Value                                              |
| --------------------------- | -------------------------------------------------- |
| Node.js version             | **22.x** (must match `.nvmrc` / `engines.node`)    |
| Application mode            | Production                                         |
| Application root            | `apps/higaet/current`                              |
| Application URL             | Your domain (e.g. `higaet.com`)                    |
| Application startup file    | `app.js`                                           |
| Passenger log file          | `apps/higaet/tmp/passenger.log` (optional)         |

The deploy workflow (`.github/workflows/_deploy-kernel.yml`) uploads each
release into `apps/higaet/releases/<release-id>/` and atomically points
`apps/higaet/current` at the newest release. **Application root must be the
`current` symlink, not a specific release folder.**

---

## 2. Required environment variables (cPanel → "Environment variables")

Publishable (also baked into the client bundle at build time — must be identical
in CI env and cPanel):

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Server-only (never expose to the client):

- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `LOVABLE_API_KEY`

Optional (enable feature flags):

- `BREVO_API_KEY` — transactional email
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — payments
- `OPENAI_API_KEY`, `GEMINI_API_KEY` — AI providers
- `HIGAET_STAGE` — `staging` enables extra abuse-protection on public endpoints

`app.js` validates all **required** vars at boot and refuses to start with a
clear stderr message if any are missing (see `scripts/validate-env.mjs` for the
full list).

---

## 3. Install production dependencies

After each release upload, cPanel's UI ("Run NPM Install") or the SSH command
below installs `dependencies` (skipping `devDependencies`) using the pinned
`package-lock.json` that ships in the artifact:

```bash
cd ~/apps/higaet/current
npm ci --omit=dev --prefer-offline --no-audit --no-fund
```

`npm ci` **requires** `package-lock.json`; the deploy kernel fails the build
if the artifact is missing it.

---

## 4. Health check configuration

Point Passenger / uptime monitors at:

- `GET /healthz` — liveness (200 if the SSR worker is up; no side effects)
- `GET /readyz` — readiness (200 when required env is present; 503 otherwise)
- `GET /api/public/health` — richer JSON (service name, correlation ID)

---

## 5. Restart Passenger after a release

The deploy workflow triggers a restart automatically via
`touch ~/apps/higaet/tmp/restart.txt`. To restart manually:

```bash
touch ~/apps/higaet/tmp/restart.txt
```

Passenger picks up the new symlink target on the next request.

---

## 6. Rollback

```bash
PREV=$(cat ~/apps/higaet/.previous-release)
ln -sfn "$PREV" ~/apps/higaet/current
touch ~/apps/higaet/tmp/restart.txt
```

The deploy kernel records `.previous-release` before each swap and performs
this rollback automatically if smoke tests fail.
