# HIGAET — Secrets & Infrastructure Reconciliation Audit

**Mode:** Audit only. No secrets, workflows, scripts, or env files were modified.
**Trigger:** Full rotation of SSH keys, database credentials, API keys, session
secrets, and runtime configuration.
**Goal:** Single source of truth for every secret/var referenced anywhere in
the repo, with naming-drift, environment-drift, and dead-reference findings.

> Companion to `docs/audit/cicd-secrets-audit.md` (which covered workflow
> structure). This document focuses on **secret identity, naming, and
> reconciliation** post-rotation.

---

## 0. Executive summary

| Health area | Status | Notes |
|---|---|---|
| Naming consistency | 🟥 **Drift** | SSH host/key/user exist under 3 naming schemes; Supabase URL/key under 2. |
| Environment separation | 🟧 **Partial** | Only `staging-*` and one `deploy-milesweb.yml` job declare `environment:`. Production has no dedicated environment. |
| Dead references | 🟧 | `datadog-synthetics.yml`, `deploy-milesweb.yml` (superseded), `GA4_MEASUREMENT_ID`, `GSC_VERIFICATION`, `TEAMS_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`, `GENERIC_WEBHOOK_URL`, `TEST_FIXTURE_PASSWORD` — referenced but no consumer. |
| Missing in repo / required by code | 🟥 | `SUPABASE_DB_*` (5), `DEPLOY_WEBHOOK_URL`, `CANARY_WEBHOOK_URL`, `ROLLBACK_WEBHOOK_URL`, `OPS_DASHBOARD_URL`, `APP_BASE_URL`, `READINESS_GH_TOKEN` — not retrievable on Lovable Cloud or never created. |
| Committed credentials | 🟥 | `.env` (publishable Supabase keys) committed to repo root. Publishable so not a leak, but breaks rotation hygiene. |
| Workflow-call wiring | 🟥 P0 | `phase-2-2-authorization.yml` line 61 calls `./.github/workflows/staging-readiness.yml` as a reusable workflow, but that workflow has no `on: workflow_call:` trigger — the run fails immediately. |
| Deploy-path drift | 🟥 P1 | Three different deploy roots in use: `/home/wnwpopno/higaet-staging` (staging), `~/apps/higaet` (rollback + readiness default), and unset for production. Rollback currently targets the wrong tree. |

---

## 1. Master secret map

### Legend
- **Source of truth:** where the secret value lives (GitHub Actions, Lovable Cloud runtime secrets, server `.env`, none).
- **Status:** ✅ in use · 🟧 referenced but consumer unclear · 🟥 referenced and broken/missing · 💤 dead reference.

### 1.1 SSH & deployment

| Name | Used in | Source | Status | Notes |
|---|---|---|---|---|
| `MILESWEB_SSH_HOST` | `deploy-milesweb-staging.yml` | GHA | ✅ | Canonical name going forward. |
| `MILESWEB_SSH_KEY` | `deploy-milesweb-staging.yml` | GHA | ✅ | Private key (ed25519). |
| `MILESWEB_SSH_PORT` | `deploy-milesweb-staging.yml` | GHA | ✅ | `22999`. |
| `SSH_HOST` | `deploy-milesweb.yml`, `staging-readiness.yml` | GHA | 🟧 | Duplicate of `MILESWEB_SSH_HOST`. Pick one. |
| `SSH_USER` | `deploy-milesweb.yml`, `staging-readiness.yml`, `staging-rollback-validation.yml` | GHA | 🟧 | No `MILESWEB_SSH_USER` analogue — staging deploy hardcodes `CPANEL_USER: wnwpopno`. |
| `SSH_KEY` | `deploy-milesweb.yml`, `staging-readiness.yml`, `staging-rollback-validation.yml` | GHA | 🟧 | Duplicate of `MILESWEB_SSH_KEY`. After rotation, both copies must be updated or one will go stale. |
| `STAGING_HOST` | `staging-readiness.yml`, `staging-rollback-validation.yml` | GHA | 🟧 | Third name for the same hostname (`staging.higaet.com`). |
| `STAGING_BASE_URL` | `staging-readiness.yml`, `staging-rollback-validation.yml` | GHA | ✅ | Public URL, not a secret — should be a `vars.*`. |
| `DEPLOY_DIR` (var) | `staging-readiness.yml` | GHA Variable | 🟧 | Default `~/apps/higaet`; actual staging deploy uses `/home/wnwpopno/higaet-staging`. |
| `STAGING_EXPECTED_IP` (var) | `staging-readiness.yml` | GHA Variable | ✅ | DNS assertion. |
| `CPANEL_USER` (env) | `deploy-milesweb-staging.yml` | hardcoded `wnwpopno` | 🟧 | Should be `vars.MILESWEB_SSH_USER`. |

**Drift:** SSH credentials referenced under **three** schemes — `MILESWEB_SSH_*`, `SSH_*`, `STAGING_*`. Rotation must update all three or partial drift breaks `staging-readiness` while `deploy-milesweb-staging` still works (or vice versa).

### 1.2 Database (Lovable Cloud / Supabase)

| Name | Used in | Source | Status | Notes |
|---|---|---|---|---|
| `SUPABASE_URL` | `deploy-milesweb.yml`, `launch-readiness.yml`, `staging-rollback-validation.yml`, app (`src/lib/launch-readiness.server.ts`, `src/integrations/supabase/client.server.ts`) | GHA + server `.env` | ✅ | |
| `SUPABASE_PUBLISHABLE_KEY` | same set + app | GHA + server `.env` + repo `.env` | ✅ | Publishable; safe in client. |
| `SUPABASE_ANON_KEY` | code (`scripts/security-audit.mjs`) | server only | 🟧 | Same value as PUBLISHABLE — collapse to one name. |
| `SUPABASE_SERVICE_ROLE_KEY` | `deploy-milesweb.yml`, `launch-readiness.yml`, `staging-rollback-validation.yml`, app | GHA + server `.env` | 🟥 | **Not retrievable from Lovable Cloud** — must be sourced from the Cloud-injected runtime env at deploy time, not stored in GHA. |
| `VITE_SUPABASE_URL` | `deploy-milesweb-staging.yml`, `deploy-milesweb.yml`, `staging-rollback-validation.yml`, repo `.env` | GHA + repo `.env` | ✅ | Build-time public. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same | GHA + repo `.env` | ✅ | |
| `VITE_SUPABASE_PROJECT_ID` | `deploy-milesweb-staging.yml`, repo `.env` | GHA + repo `.env` | ✅ | |
| `SUPABASE_DB_HOST` `_PORT` `_NAME` `_USER` `_PASSWORD` | `launch-readiness.yml` (security-audit step) | none | 🟥 | Direct-Postgres creds; **Lovable Cloud does not expose them**. Step must be either disabled or rewritten to use RPC-based audit. |
| `DATABASE_URL` | `scripts/predeploy-schema-validation.ts` | none | 🟥 | Same problem. |
| `PGHOST` | scripts | none | 🟥 | Same. |

### 1.3 Payments (Stripe)

| Name | Used in | Source | Status |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | `deploy-milesweb.yml`, `scripts/validate-env.mjs` (strict) | none | 🟥 P0 if strict-mode kept |
| `STRIPE_WEBHOOK_SECRET` | `deploy-milesweb.yml`, `scripts/validate-env.mjs` | none | 🟥 Same |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `deploy-milesweb.yml` | none | 💤 No client code reads it (manual-payments flow is in-house). |

**Finding:** Stripe is a Phase-2 capability; current production uses the manual-payment system. `validate-env.mjs --strict` must NOT include Stripe until Stripe is enabled, or every deploy fails preflight.

### 1.4 External APIs

| Name | Used in | Source | Status |
|---|---|---|---|
| `BREVO_API_KEY` | `higaet-brevo-cicd.yml`, `src/lib/email/brevo.ts` | GHA + Lovable Cloud | ✅ |
| `OPENAI_API_KEY` | `deploy-milesweb.yml`, `scripts/validate-env.mjs` (strict), AI gateway | GHA + Cloud | ✅ |
| `GEMINI_API_KEY` | same | GHA + Cloud | ✅ |
| `GROQ_API_KEY` `OPENROUTER_API_KEY` `HUGGINGFACE_API_KEY` `HF_TOKEN` | code, `validate-env.mjs` (optional) | Cloud | 🟧 Optional fallbacks — confirm at least one is set. |
| `DD_API_KEY` `DD_APP_KEY` | `datadog-synthetics.yml` | none | 💤 Workflow is dead (Datadog not adopted). |

### 1.5 CI / CD control

| Name | Used in | Status |
|---|---|---|
| `GITHUB_TOKEN` | `staging-readiness.yml` | ✅ Auto-issued by Actions. |
| `READINESS_GH_TOKEN` | `staging-readiness.yml` | 🟧 Must be a PAT with `issues:write`; missing → step skipped silently. |
| `GITHUB_OPS_TOKEN` | `scripts/notify-failure.mjs` | 🟧 Optional but undocumented. |
| `SYSTEM_MODE` (var) | `higaet-brevo-cicd.yml` | ✅ |
| `AUTONOMOUS_MODE` (var) | `higaet-brevo-cicd.yml` | ✅ |
| `READINESS_CACHE_TTL_HOURS` (var) | `phase-2-2-authorization.yml` | ✅ |
| `SECURITY_AUDIT_STRICT` | `scripts/security-audit.mjs` | 🟧 Toggles strict mode; document. |
| `STRICT` | `scripts/validate-env.mjs` | ✅ |

### 1.6 Ingest / observability

| Name | Used in | Status | Notes |
|---|---|---|---|
| `CI_AUDIT_INGEST_SECRET` | `higaet-brevo-cicd.yml`, `src/routes/api/public/ci-audit/ingest.ts` | ✅ | Must match in GHA + Cloud. |
| `LAUNCH_READINESS_INGEST_SECRET` | `higaet-brevo-cicd.yml`, `launch-readiness.yml`, server | ✅ | Same — must match both sides. |
| `LAUNCH_READINESS_INGEST_URL` | `launch-readiness.yml` | 🟧 Hardcode-friendly; if absent the workflow falls back. |
| `OPS_DASHBOARD_URL` | `higaet-brevo-cicd.yml` | 🟥 If missing the ingest POST silently fails — see `docs/ci/observability-validation.md`. |
| `APP_BASE_URL` | `higaet-brevo-cicd.yml` | 🟧 Used by Brevo CI smoke. |
| `SLACK_WEBHOOK_URL` | 4 workflows | 🟧 Optional. |
| `DISCORD_WEBHOOK_URL` `TEAMS_WEBHOOK_URL` `GENERIC_WEBHOOK_URL` | `launch-readiness.yml` | 💤 Provider-fanout placeholders, no consumer beyond echo. |
| `DEPLOY_WEBHOOK_URL` `CANARY_WEBHOOK_URL` `ROLLBACK_WEBHOOK_URL` | `higaet-brevo-cicd.yml` | 🟥 No backend listener implemented. |

### 1.7 Runtime / app

| Name | Used in | Source | Status |
|---|---|---|---|
| `SESSION_SECRET` | `deploy-milesweb.yml`, `staging-rollback-validation.yml`, `validate-env.mjs` | GHA + server `.env` | ✅ generate-able (`secrets--generate_secret`). |
| `EMAIL_FROM_ADDRESS` `EMAIL_FROM_NAME` `EMAIL_REPLY_TO` | `src/lib/email/brevo.ts` | server `.env` | ✅ |
| `APP_VERIFY_BASE_URL` `LOVABLE_APP_URL` | code | server `.env` | ✅ |
| `SENTRY_DSN` `SENTRY_ENV` `SENTRY_RELEASE` | code | none | 💤 Sentry not provisioned. |
| `HEALTH_RL_LIMIT` `HEALTH_RL_WINDOW_MS` | code | optional | ✅ defaults exist. |
| `AI_BUDGET_DAILY_USD` `AI_KILL_SWITCH` | code | optional | ✅ defaults exist. |
| `HIGAET_STAGE` `NODE_ENV` `HOST` `PORT` `LOG_LEVEL` | runtime | server `.env` / Passenger | ✅ |

---

## 2. Environment mapping

GitHub Environments declared:

| Workflow | Job environment |
|---|---|
| `deploy-milesweb-staging.yml` | `staging` |
| `deploy-milesweb.yml` | `${{ inputs.environment }}` (dispatch-only, no protection rules confirmed) |
| `staging-readiness.yml` | `staging` |
| `staging-rollback-validation.yml` | `staging` |
| all others | none |

### Drift findings

1. **No `production` environment exists.** Every "production" secret today is repo-scoped, meaning any PR-triggered workflow that opts into them gets them. (Currently mitigated by `if: github.event_name != 'pull_request'` guards, but a single forgotten guard leaks them.)
2. **Staging and production share namespaces:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `BREVO_API_KEY` have one value used by both `deploy-milesweb-staging.yml` (env: staging) and `deploy-milesweb.yml` (env: production). Rotating staging rotates prod.
3. **`STAGING_BASE_URL` is a secret** — it's a public URL, should be `vars.STAGING_BASE_URL`.
4. **`SUPABASE_PUBLISHABLE_KEY` is committed to `.env`** in repo root. Publishable so not a credential leak, but the file should not be in git — moves freeze the rotation story.

---

## 3. Workflow dependency audit

### 3.1 Broken references (P0)

| File | Line | Problem |
|---|---|---|
| `phase-2-2-authorization.yml` | 61 | `uses: ./.github/workflows/staging-readiness.yml` — target lacks `on: workflow_call:` trigger. Run fails statically. |
| `deploy-milesweb.yml` | (smoke) | Smoke probe hits `/healthz`; actual endpoint is `/api/public/health`. |
| `launch-readiness.yml` | (security-audit) | Requires `SUPABASE_DB_*` direct Postgres creds, unavailable on Lovable Cloud. |
| `validate-env.mjs --strict` | n/a | Marks Stripe + OpenAI + Gemini as critical → any deploy without Stripe keys exits 1. |

### 3.2 Unused / dead workflows

- `datadog-synthetics.yml` — Datadog never adopted.
- `deploy-milesweb.yml` — superseded by `deploy-milesweb-staging.yml`; deploy paths (`~/apps/higaet`) don't match the live tree.

### 3.3 Triggers without fork-guard (P2)

`datadog-synthetics.yml`, `higaet-brevo-cicd.yml`, `launch-readiness.yml`, `seo-cluster-lint.yml`, `seo-graph-report.yml` all listen on `pull_request:` without a `github.event.pull_request.head.repo.full_name == github.repository` check. Fork PRs would expose secret-name surface.

### 3.4 Concurrency

Declared: `deploy-milesweb-staging.yml`, `deploy-milesweb.yml`, `phase-2-2-authorization.yml`, `staging-readiness.yml`, `staging-rollback-validation.yml`. No **shared** concurrency group across the three MilesWeb-touching workflows — symlink swap can race.

---

## 4. SSH & deployment validation

| Check | Result |
|---|---|
| SSH key format pinned to ed25519 | ✅ (key path `id_ed25519`). |
| `known_hosts` pinning | ❌ All `appleboy/ssh-action` uses skip host key verification. |
| Single SSH secret name | ❌ Three (`MILESWEB_SSH_*`, `SSH_*`, `STAGING_*`). |
| Deploy user single source | ❌ `CPANEL_USER` hardcoded `wnwpopno` in staging, vs `secrets.SSH_USER` elsewhere. |
| Deploy path single source | ❌ `/home/wnwpopno/higaet-staging` (staging) vs `~/apps/higaet` (rollback + readiness default). **Rollback workflow currently targets the wrong tree** if executed against the live MilesWeb deploy. |
| Node version aligned | ✅ Workflows pin Node 20.x; `package.json` engines: not enforced — recommend adding `"engines": { "node": ">=20 <21" }`. |
| Passenger restart hook | ✅ `tmp/restart.txt` touch present in staging workflow. |

---

## 5. Security analysis

| Risk | Where | Severity |
|---|---|---|
| `.env` committed with publishable Supabase keys | repo root | P2 (hygiene, not leak) |
| Direct-Postgres creds requested in CI | `launch-readiness.yml` | P1 (cannot satisfy on Lovable Cloud → step fails) |
| Strict env validator fails on optional features | `scripts/validate-env.mjs` | P0 (blocks deploy) |
| No `known_hosts` pinning on SSH | all deploy workflows | P2 (MITM) |
| `pull_request` triggers without fork-guard | 5 workflows | P2 |
| No echo/log secret leak found | grep clean | ✅ |
| Service role key referenced in client-touching workflow | `deploy-milesweb.yml` env block exposes to build job | P2 — service-role belongs at runtime only |
| `STAGING_BASE_URL` stored as secret instead of var | 2 workflows | P3 |

---

## 6. Missing secrets list (what GitHub needs)

Must be created in **GitHub → Settings → Environments → `staging`** (and a new `production` environment):

- `MILESWEB_SSH_HOST`, `MILESWEB_SSH_KEY`, `MILESWEB_SSH_PORT`, `MILESWEB_SSH_USER`
- `BREVO_API_KEY` (env-scoped, not repo-scoped)
- `CI_AUDIT_INGEST_SECRET`, `LAUNCH_READINESS_INGEST_SECRET` (must match Lovable Cloud values)
- `OPS_DASHBOARD_URL`, `APP_BASE_URL` (env-scoped per env)
- `READINESS_GH_TOKEN` (PAT, repo-scoped, `issues:write` only)
- `SLACK_WEBHOOK_URL` (optional)

Must be set as **Variables** (not secrets):

- `vars.DEPLOY_DIR` → `/home/wnwpopno/higaet-staging` (staging) / `/home/wnwpopno/higaet-production` (prod, once created)
- `vars.MILESWEB_SSH_USER` → `wnwpopno`
- `vars.STAGING_BASE_URL`, `vars.PRODUCTION_BASE_URL`
- `vars.STAGING_EXPECTED_IP`, `vars.PRODUCTION_EXPECTED_IP`

## 7. Unused secrets list (safe to remove)

- `DD_API_KEY`, `DD_APP_KEY` (workflow dead)
- `GA4_MEASUREMENT_ID`, `GSC_VERIFICATION` (not consumed at build time; values live in app config)
- `VITE_STRIPE_PUBLISHABLE_KEY` (no client consumer yet)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (re-add when Phase 2 begins)
- `TEAMS_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`, `GENERIC_WEBHOOK_URL`
- `DEPLOY_WEBHOOK_URL`, `CANARY_WEBHOOK_URL`, `ROLLBACK_WEBHOOK_URL` (no listener)
- `TEST_FIXTURE_PASSWORD` (test path not active)
- `SUPABASE_DB_HOST/PORT/NAME/USER/PASSWORD` (not available on Lovable Cloud)
- `SSH_HOST`, `SSH_KEY`, `SSH_USER`, `STAGING_HOST` (consolidate under `MILESWEB_*`)

---

## 8. Environment drift report (staging ↔ production)

| Concern | Status |
|---|---|
| Separate env scopes for SSH creds | ❌ Repo-scoped today |
| Separate Supabase URL/keys per env | ❌ Single project; staging would point at prod DB unless explicit override is set |
| Separate Brevo / ingest secrets per env | ❌ Single value reused |
| Separate deploy paths per env | ❌ Only staging path exists |
| Promotion gate (manual approval) | ❌ Production environment not declared, no `required_reviewers` |

---

## 9. Critical fix order

### P0 — Blocks any deploy
1. Make `staging-readiness.yml` reusable: add `on: workflow_call:` with the inputs/outputs `phase-2-2-authorization.yml` consumes, OR rewrite `phase-2-2-authorization.yml` to call `gh workflow run` instead of `uses:`.
2. Relax `scripts/validate-env.mjs` strict mode: move `STRIPE_*` and AI keys to the `optional` bucket until those features are enabled.
3. Change smoke probes from `/healthz` → `/api/public/health` in `deploy-milesweb.yml` (or retire that workflow).

### P1 — Breaks staging/production consistency
4. Consolidate SSH naming on `MILESWEB_SSH_*`; remove `SSH_*` and `STAGING_HOST` from all workflows.
5. Unify deploy paths via `vars.DEPLOY_DIR` everywhere (drop `~/apps/higaet` hardcodes in rollback + readiness).
6. Replace `SUPABASE_DB_*` security-audit step with an RPC-based check that uses `SUPABASE_SERVICE_ROLE_KEY` (injected at runtime by Lovable Cloud).
7. Declare a `production` GitHub environment with `required_reviewers`; move prod-only secrets there.

### P2 — Security hardening
8. Remove `.env` from repo; add to `.gitignore`; document that Lovable Cloud injects `VITE_SUPABASE_*` at build time.
9. Pin `known_hosts` in every `appleboy/ssh-action` step (use `fingerprint:` input).
10. Add fork-guard `if:` to every `pull_request:` workflow that references secrets.
11. Move service-role key reference out of `deploy-milesweb.yml` env block; let runtime inject.
12. Convert `STAGING_BASE_URL`, `LAUNCH_READINESS_INGEST_URL` from secrets to vars.

### P3 — Cleanup
13. Delete `datadog-synthetics.yml`.
14. Delete or fold `deploy-milesweb.yml` into the staging workflow with a `target:` input.
15. Remove dead webhook secrets (`DEPLOY_/CANARY_/ROLLBACK_WEBHOOK_URL`, `TEAMS_/DISCORD_/GENERIC_WEBHOOK_URL`) until consumers exist.
16. Add a shared `concurrency: group: milesweb-deploy` across all three MilesWeb workflows.
17. Add `"engines": { "node": ">=20 <21" }` to `package.json`.

---

## 10. Rotation playbook (run in this order)

1. **Audit current GitHub state** (Settings → Secrets, Settings → Environments). Cross-reference with §1.
2. **Create `production` environment** with reviewers + branch protection.
3. **Provision env-scoped secrets** per §6, both `staging` and `production`. Use one consistent name per concept.
4. **Delete superseded names** per §7 only AFTER workflows are updated to stop referencing them.
5. **Apply P0 fixes** to unblock CI.
6. **Run `staging-readiness.yml`** alone — must go green.
7. **Run `deploy-milesweb-staging.yml`** — verify symlink swap + Passenger restart.
8. **Promote** via dispatch to production environment.

---

## 11. Rules respected

- ✅ No secrets modified.
- ✅ No values assumed or generated.
- ✅ No files deleted.
- ✅ Every finding cites a workflow + line range or file path.
- ✅ No raw secret values printed anywhere in this report.
