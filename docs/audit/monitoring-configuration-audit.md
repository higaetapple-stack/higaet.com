# Monitoring Configuration Audit — 2026-07-08

## Scope
Sentry + Datadog + uptime monitoring configuration, server-only secret
boundaries, release/sourcemap pipeline, synthetic monitoring, and the admin
status surface.

## Results

| Check | Status | Evidence |
|---|---|---|
| Sentry private secrets server-side only | ✅ | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG`, `SENTRY_WEBHOOK_SECRET`, `SENTRY_RELEASE`, `SENTRY_ENV` (server) read only via `process.env` in `src/lib/observability/sentry-server.ts`, `src/lib/sre/ai/sentry-client.ts`, `src/lib/sentry-releases.functions.ts`, `src/routes/api/public/sentry.webhook.ts`. No `VITE_` prefix on any private Sentry secret. |
| Datadog secrets server-side only | ✅ | `DATADOG_API_KEY`, `DATADOG_APP_KEY`, `DATADOG_SITE` referenced only in `src/lib/integration-secrets.functions.ts` and `src/lib/launch-report.functions.ts` — both are `createServerFn` handlers. No `VITE_DATADOG*` or `DD_*` client vars anywhere in `src/`. |
| No monitoring secrets in browser bundle / source | ✅ | Only client-facing var is `VITE_SENTRY_DSN` (publishable Sentry DSN — safe by design). `.env` and `.env.example` contain no private tokens. |
| Sentry release + sourcemap integration | ✅ | `.github/workflows/sentry-sourcemaps.yml` uploads sourcemaps to release `${VITE_SENTRY_ENV}-${sha}` (matches `src/lib/observability/release.ts::buildRelease`). Guarded to skip cleanly when `SENTRY_AUTH_TOKEN` absent; verifies `dist/` non-empty before upload; finalizes release. |
| Datadog synthetic monitoring | ✅ | `.github/workflows/datadog-synthetics.yml` triggers CI-based synthetics; server verifier hits `https://api.${DATADOG_SITE}/api/v1/validate` before recording status. |
| Monitoring status page never exposes secret values | ⚠️→✅ Fixed | Prior `mask()` in `src/lib/integration-secrets.functions.ts` returned `first3 + ••• + last3` of the raw secret, leaking 6 bytes to the admin UI. Replaced with `configured (short\|medium\|long)` — zero raw bytes cross the RPC boundary. |
| `tsgo --noEmit` (typecheck) | ✅ | Clean, 0 errors. |

## Change applied
- **`src/lib/integration-secrets.functions.ts`** — hardened `mask()` so
  the `IntegrationSecretRow.masked` field never carries any characters
  from the raw secret; the admin page now shows `Saved · configured
  (long)` instead of `Saved · sntr•••••••••abc`.

No architecture, business logic, or UI structure changed. Reader / writer
paths, RLS, admin gating, audit logging, and rate limiting are unchanged.

## Non-blockers / recommendations
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG`,
  `DATADOG_API_KEY`, `DATADOG_APP_KEY` remain not-yet-configured runtime
  secrets (previously reported in the credential audit). The system
  degrades cleanly to no-op while they are absent; add via the admin
  Monitoring & Alerting Credentials page or the secrets tool when ready.
