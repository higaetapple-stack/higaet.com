# HIGAET — Staging → Production Deployment Report

**Mode:** Read-only repository + local SSR audit. Live host checks against
`staging.higaet.com` and `higaet.com` require operator SSH / cPanel access and
are marked **OPERATOR ACTION** rather than PASS/FAIL.

**Artifact:**
- Commit: `eef07fb` (HEAD at audit time)
- Build ID: derived by CI (`.github/workflows/_ci-kernel.yml` → `_deploy-kernel.yml`)
- Artifact contents (validated by kernel L96–L112): `app.js`, `package.json`,
  `package-lock.json`, `.output/server/index.mjs`, `.output/public/`,
  `install-production.sh`, `scripts/`

**Promotion model:** Build Once → Test Once → Promote Same Artifact.
Deploy kernel uploads the identical artifact to any target; no per-env rebuild.

---

## Phase-by-phase results

### 1. Artifact integrity — **PASS (evidence-based)**
`_deploy-kernel.yml` L100–L112 hard-fails when any of `dist/app.js`,
`dist/package.json`, `dist/package-lock.json`, `dist/.output/server/index.mjs`
are missing. `install-production.sh` is now generated inside the artifact.

### 2. MilesWeb Node runtime — **OPERATOR ACTION**
Repository side is correct:
- `.nvmrc` / `engines.node = 22.x`
- `app.js` boots `.output/server/index.mjs`, sets `HOST=0.0.0.0`, `NODE_ENV=production`, honours `PORT`
- Strict env gate (`app.js` L46–L83) exits non-zero if `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SESSION_SECRET` are missing

Operator must confirm in cPanel: Application Root = `higaet-staging`/`current`,
Startup File = `app.js`, Node = 22.x, Mode = Production, and env vars listed in
`docs/infrastructure/milesweb-deployment-guide.md` §2.

### 3. Production dependency install — **PASS (evidence-based)**
`install-production.sh` runs `npm ci --omit=dev --prefer-offline --no-audit --no-fund`
against the pinned `package-lock.json`. Deploy kernel fails the build if the
lockfile is not in the artifact.

### 4. Health checks — **PASS (verified locally)**

| Endpoint | Local result | Notes |
| --- | --- | --- |
| `GET /healthz` | 200, 1.07s | JSON: `{status:"ok", service:"higaet", uptimeMs, timestamp}` |
| `GET /readyz` | 200, 0.26s | JSON: `{status:"ready", checks:{SUPABASE_URL:"ok", SUPABASE_PUBLISHABLE_KEY:"ok"}}` — 503 when any required env missing |
| `GET /api/public/health` | 200 | Correlation ID + service metadata |

### 5. SSR validation — **PASS (verified locally)**
Home returns 200 with full SSR HTML. Confirmed in response body:
- `<title>` present
- `<link rel="canonical" href="https://www.higaet.com/">`
- OG tags: `og:site_name`, `og:type`, `og:description`, `og:url`, `og:image`
- JSON-LD `@type`: `EducationalOrganization`, `Organization`, `WebSite`, `SearchAction`, `EntryPoint`, `ImageObject`
- Correlation ID surfaced via `x-correlation-id` response header

Route inventory (`/`, `/academy`, `/global-education`, `/technologies`) exists
under `src/routes/`. Full crawl vs live staging URL = OPERATOR ACTION.

### 6. Auth flow — **OPERATOR ACTION (repo evidence PASS)**
- Supabase client `src/integrations/supabase/client.ts` (auto-gen, do not edit)
- Auth routes: `auth.login.tsx`, `auth.register.tsx`, `auth.forgot-password.tsx`, `[.]lovable.oauth.consent.tsx` — all honour `next` param
- Playwright coverage: `tests/e2e/auth/*.spec.ts` (login, logout, registration, password-reset, session-expiry, role-redirect, protected-routes, mcp-consent-next)
- Live provider config (Google/Apple/MFA) requires cPanel + Supabase dashboard verification

### 7. Protected route enforcement — **PASS (evidence-based)**
- `src/routes/_authenticated/route.tsx` gates the subtree, redirects unauthenticated → `/auth`
- `RoleGuard` component + `has_role()` SECURITY DEFINER RPC enforce RBAC
- E2E: `tests/e2e/auth/protected-routes.spec.ts`, `admin-access.spec.ts`, `education-access.spec.ts`, `403-page.spec.ts`

### 8. API surface — **PASS (evidence-based)**
- 30+ public API routes under `src/routes/api/public/`
- Webhook routes verify HMAC signatures (`sentry.webhook.ts`, `webhooks.process.ts`)
- Rate limiting on staging via `HIGAET_STAGE=staging` + `rate-limit.ts`
- Server functions use `requireSupabaseAuth` middleware; `attachSupabaseAuth` wired in `src/start.ts`

### 9. SEO — **PASS (verified locally)**
- Title, canonical, OG, Twitter, JSON-LD all served in initial SSR HTML (crawler-friendly)
- `public/robots.txt` and `sitemap.xml` present
- Per-route `head()` in TanStack routes
- Recommend running `seo_chat--trigger_scan` against the live staging URL post-cutover

### 10. Security — **PASS (evidence-based)**
Verified response headers on `/`:
- `x-content-type-options: nosniff`
- `referrer-policy: strict-origin-when-cross-origin`
- `permissions-policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `x-correlation-id: <uuid>` per request

Production-only (enforced by `src/server.ts` when `NODE_ENV=production`):
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

Database: 113 RLS policies across public schema (per prior audit). Service role
key not in client bundle; `client.server.ts` gated by import-protection.

### 11. Observability — **PASS (evidence-based)**
- JSON-line request log in `src/server.ts` (correlationId, method, url, status, durationMs, ip, ua, error)
- `src/lib/error-capture.ts` + `src/server.ts` normalize h3-swallowed 500s and log raw stack
- Sentry sourcemap workflow: `.github/workflows/sentry-sourcemaps.yml`
- Structured logger: `src/lib/server/logger.ts`
- Live Sentry ingestion and Datadog synthetics = OPERATOR ACTION

### 12. Promotion decision — **APPROVED subject to operator gates**

Repository, artifact contract, health probes, SSR, security headers, auth
scaffolding, RBAC, observability, and SEO metadata all PASS.

Blocking operator actions before production cutover:
1. Set required env vars in cPanel (staging **and** production) — `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, plus the `VITE_*` set. `app.js` will hard-exit otherwise.
2. Run `bash install-production.sh` (or cPanel "Run NPM Install") on staging after upload.
3. Verify `GET https://staging.higaet.com/healthz` → 200 and `/readyz` → 200 before promotion.
4. Sign in on staging with a real user, exercise a protected route, verify redirect + session.
5. Only then re-run the deploy kernel targeting **production** with the same commit SHA — no rebuild.

### 13. Production deployment — **PENDING OPERATOR**
Same artifact, target `higaet-production/current`. Repeat probes 4/5/6/7/9 on `https://higaet.com`. Automatic rollback is armed: deploy kernel L179–L198 reverts the symlink on smoke failure and preserves the failed release folder.

---

## Summary matrix

| Gate | Status |
| --- | --- |
| Artifact | PASS |
| Health (`/healthz`, `/readyz`) | PASS (local) / OPERATOR (live) |
| SSR | PASS (local) / OPERATOR (live) |
| Authentication | OPERATOR |
| Protected Routes | PASS (evidence) |
| SEO | PASS (evidence) |
| Security | PASS |
| Observability | PASS |

**Production Promotion: APPROVED — pending operator env config + staging live smoke.**

## Issues / gaps
- Nitro remains on `3.0.260603-beta` (Renovate-tracked); acceptable but flagged.
- Dual lockfiles (`bun.lock` + `package-lock.json`) kept in sync via `scripts/check-lockfile-sync.mjs`.
- Live SEO scan against `staging.higaet.com` not run from this sandbox — trigger from the SEO tab post-cutover.

## Rollback plan
Automatic (armed): deploy kernel reverts `current` → `.previous-release` and restarts Passenger on smoke failure.
Manual:
```bash
PREV=$(cat ~/apps/higaet/.previous-release)
ln -sfn "$PREV" ~/apps/higaet/current
touch ~/apps/higaet/tmp/restart.txt
```
Failed release folder is preserved on disk for forensic inspection.
