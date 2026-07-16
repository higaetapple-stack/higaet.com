# HIGAET Production Secret Verification

Last reviewed: 2026-07-08
Owner: Platform / SRE
Scope: Production runtime + GitHub Actions

This document tracks the operational verification of runtime secrets. Values
are never recorded here — only presence, provenance, and rotation status.
The live source of truth is the Environment Readiness dashboard at
`/dashboard/admin/env-readiness`, which polls `env_readiness_snapshots` every
15 minutes and streams misconfiguration events into `env_readiness_activity`.

## 1. Verification method

1. Admin opens `/dashboard/admin/env-readiness`. Overall verdict must be
   `ready`. Any `blocked` or `degraded` state must be resolved before sign-off.
2. Download the JSON readiness report from the dashboard and attach it to
   the launch ticket. The report never contains secret values — only
   presence, format validation, and category grouping.
3. Confirm the cron-driven recheck at `/api/public/hooks/env-readiness-recheck`
   has run within the last 30 minutes (see `env_readiness_snapshots.created_at`).
4. Cross-check GitHub Actions repository secrets in
   `higaetapple-stack/higaet` → Settings → Secrets and variables → Actions.

## 2. Required runtime secrets

| Secret                          | Category            | Blocking | Environment          | Notes / format check                       |
| ------------------------------- | ------------------- | -------- | -------------------- | ------------------------------------------ |
| `SUPABASE_URL`                  | Supabase / Backend  | Yes      | prod + CI            | Must be `https://` URL                     |
| `SUPABASE_PUBLISHABLE_KEY`      | Supabase / Backend  | Yes      | prod + CI            | Publishable — safe in client bundles       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase / Backend  | Yes      | server runtime only  | Never referenced from `src/` client code   |
| `SESSION_SECRET`                | Session             | Yes      | prod                 | ≥ 32 chars, random                         |
| `GITHUB_TOKEN`                  | SRE Pipeline        | Yes      | CI + server          | Fine-grained PAT, `higaetapple-stack/higaet` only |
| `GITHUB_REPO`                   | SRE Pipeline        | Yes      | CI + server          | Must equal `higaetapple-stack/higaet`      |
| `SRE_E2E_TRIGGER_SECRET`        | SRE Pipeline        | Yes      | server + Actions     | Random, ≥ 32 chars, shared with workflow   |
| `SRE_E2E_BEARER`                | SRE Pipeline        | Yes      | server + Actions     | Random, ≥ 32 chars                         |
| `SENTRY_AUTH_TOKEN`             | Sentry              | Yes      | CI (sourcemaps)      | Scoped to `project:releases`               |
| `SENTRY_ORG_SLUG`               | Sentry              | Yes      | CI + server          | Slug only                                  |
| `SENTRY_PROJECT_SLUG`           | Sentry              | Yes      | CI + server          | Slug only                                  |
| `STRIPE_SECRET_KEY`             | Payments            | Yes      | server runtime       | Starts `sk_live_` in production            |
| `STRIPE_WEBHOOK_SECRET`         | Payments            | Yes      | server runtime       | Starts `whsec_`                            |
| `BREVO_API_KEY`                 | Transactional email | Yes      | server runtime       | Prefix `xkeysib-`                          |
| `DATADOG_API_KEY`               | Observability       | No       | CI (synthetics)      | Absence disables synthetics only           |
| `DATADOG_APP_KEY`               | Observability       | No       | CI (synthetics)      | Same                                       |
| `CLOUDFLARE_ACCOUNT_ID`         | Storage / R2        | No       | server (if R2 on)    | Only required when R2 storage is enabled   |
| `CLOUDFLARE_R2_ACCESS_KEY_ID`   | Storage / R2        | No       | server (if R2 on)    | Same                                       |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Storage / R2      | No       | server (if R2 on)    | Same                                       |
| `LOVABLE_API_KEY`               | AI Gateway          | Yes      | server runtime       | Managed — rotate via `rotate_lovable_api_key` |

## 3. Hardcoded-secret scan

- `rg -n "sk_live_|whsec_|xkeysib-|SUPABASE_SERVICE_ROLE" src/ supabase/` must
  return zero matches outside of `.env.example` placeholders and this doc.
- CI runs `code--dependency_scan` + Gitleaks on every PR; a positive finding
  blocks merge.
- Server-only modules read secrets via `process.env.*` inside handler bodies,
  never at module scope.

## 4. Environment separation

- The production Supabase project has its own publishable and service-role
  keys, distinct from any local development project.
- Stripe: production uses `sk_live_` / `pk_live_`. `STRIPE_WEBHOOK_SECRET` is
  issued per production endpoint.
- GitHub Actions: the `production` environment holds the runtime secret
  store; workflows reference `environment: production` for gated jobs.
- The Sentry auth token is scoped to `project:releases` and cannot mutate
  runtime data.

## 5. Log hygiene

- `rg -n "console\\.log\\(.*process\\.env" src/` must return zero matches.
- Structured logger (`src/lib/logger.ts`) redacts fields matching
  `token|secret|key|password|authorization`.
- Sentry `beforeSend` strips headers `authorization`, `cookie`, `x-api-key`.

## 6. GitHub Actions secret parity

| Runtime secret            | GitHub Actions secret     | Environment gate |
| ------------------------- | ------------------------- | ---------------- |
| `SRE_E2E_TRIGGER_SECRET`  | `SRE_E2E_TRIGGER_SECRET`  | production       |
| `SRE_E2E_BEARER`          | `SRE_E2E_BEARER`          | production       |
| `SENTRY_AUTH_TOKEN`       | `SENTRY_AUTH_TOKEN`       | production       |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | production   |
| `DATADOG_API_KEY`         | `DATADOG_API_KEY`         | production       |
| `DATADOG_APP_KEY`         | `DATADOG_APP_KEY`         | production       |

Verify by opening each workflow run's `Set up job` step — missing secrets
appear as empty `***` masks and cause the corresponding step to fail fast.

## 7. Sign-off

- [ ] Env Readiness dashboard verdict = `ready`
- [ ] JSON readiness report attached to launch ticket
- [ ] Hardcoded-secret scan clean
- [ ] GitHub Actions secret parity confirmed
- [ ] Rotation reminders scheduled (see `docs/HIGAET-production-launch-report.md`)
