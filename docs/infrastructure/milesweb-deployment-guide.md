# HIGAET — MilesWeb cPanel Production Deployment Guide

Concise operator runbook for deploying the TanStack Start + Nitro `node-server`
build to MilesWeb cPanel's **Setup Node.js App** feature.

The only active deployment target is production: **https://higaet.com** (with
`https://www.higaet.com` as the primary marketing URL). No staging environment
is provisioned.

---

## 1. cPanel Node.js App — required settings

Open **cPanel → Software → Setup Node.js App → Create Application**:

| Field                       | Value                                              |
| --------------------------- | -------------------------------------------------- |
| Node.js version             | **22.22.3** (must match `.nvmrc` / `engines.node`) |
| Application mode            | Production                                         |
| Application root            | `/home/wnwpopno/higaet.com`                        |
| Application URL             | `https://higaet.com`                               |
| Application startup file    | `app.js`                                           |
| Passenger log file          | `/home/wnwpopno/higaet.com/tmp/passenger.log`      |

The deploy workflow uploads each release directly into
`/home/wnwpopno/higaet.com/` and Passenger boots `app.js`, which dynamically
imports `.output/server/index.mjs` (the Nitro `node-server` bundle).

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

`app.js` validates all **required** vars at boot and refuses to start with a
clear stderr message if any are missing (see `scripts/validate-env.mjs` for the
full list).

---

## 3. Install production dependencies

After each release upload, cPanel's UI ("Run NPM Install") or the SSH command
below installs `dependencies` (skipping `devDependencies`) using the pinned
`package-lock.json` that ships in the artifact:

```bash
cd /home/wnwpopno/higaet.com
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
- `GET /api/public/sre/e2e-health` — end-to-end health incl. Supabase reachability

---

## 5. Restart Passenger after a release

The deploy workflow triggers a restart automatically via
`touch /home/wnwpopno/higaet.com/tmp/restart.txt`. To restart manually:

```bash
touch /home/wnwpopno/higaet.com/tmp/restart.txt
```

Passenger picks up the new bundle on the next request.

---

## 6. Post-deploy verification

Run `scripts/postdeploy-verify.sh` from the deployment host, or curl the
production URL:

```bash
curl -fsS https://higaet.com/readyz | jq .
curl -fsS https://higaet.com/api/public/health | jq .
```

Both must return `HTTP 200` with `status: "ready"` / `status: "ok"`.
