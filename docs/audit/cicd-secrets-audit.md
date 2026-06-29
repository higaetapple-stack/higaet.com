# HIGAET — GitHub Actions / Secrets / CI/CD Configuration Audit

**Audit type:** Read-only — no files modified.
**Scope:** `.github/workflows/*.yml`, `scripts/*`, `app.js`, `package.json`, `.env`, `validate-env.mjs`, Supabase/Stripe/SSH references.
**Date:** 2026-06-29
**Auditor lens:** DevOps Architect · GitHub Actions Specialist · Security Engineer · CI/CD Auditor

---

## Executive Summary

| Severity | Count | Examples |
|---|---|---|
| **P0 — Blocks GitHub Actions** | 3 | Missing `workflow_call` trigger; `node app.js` smoke endpoint mismatch; strict env validation fails without Stripe/AI keys |
| **P1 — Blocks Deployment** | 7 | Triple-named SSH secrets; hard-coded `wnwpopno`/`/home/wnwpopno/...`; `~/apps/higaet` vs `/home/wnwpopno/higaet-staging` layout mismatch; `/healthz` vs `/api/public/health` smoke path divergence; missing prod deploy trigger; Supabase DB creds unavailable on Lovable Cloud; STAGING_HOST vs MILESWEB_SSH_HOST duplication |
| **P2 — Security / Risk** | 5 | `.env` committed; publishable keys stored as both secrets + committed env; fork-PR exposure on `pull_request:` triggers; hardcoded domains in workflows; SSH keys written without `known_hosts` pinning |
| **P3 — Reliability** | 6 | Duplicate deployment paths; no concurrency gate across the 3 staging workflows; `bun.lockb` & `bun.lock` mixed packaging; rollback path assumes `~/apps/higaet` layout not used by staging deploy; Datadog boilerplate on every push; missing `permissions:` on multiple workflows (implicit `write-all`) |
| **P4 — Cleanup** | 4 | `deploy-milesweb.yml` superseded by `deploy-milesweb-staging.yml`; Datadog workflow likely unused; unused `secrets.GENERIC_WEBHOOK_URL`/`TEAMS_WEBHOOK_URL`/`DISCORD_WEBHOOK_URL` plumbing; orphaned validation buckets in `validate-env.mjs` (cloudflare/storage) |

**Overall health score: 58 / 100** — pipeline architecture is sophisticated (autonomous controller, audit log, rollback) but the SSH / host / deploy-layer plumbing is **inconsistent across three workflows** and at least one reusable-workflow call is **statically broken**.

---

## PHASE 1 — Secrets Inventory

Every `secrets.*` reference, mapped to its workflow(s). Confirmed by `grep -rE "secrets\.[A-Z_]+" .github/workflows`.

| Secret | Used By | Required? | Env Scope | Status |
|---|---|---|---|---|
| `BREVO_API_KEY` | higaet-brevo-cicd | yes | repo | OK |
| `APP_BASE_URL` | higaet-brevo-cicd | yes | repo | **Should be `vars`, not `secrets`** (P2) — URL is not sensitive |
| `LAUNCH_READINESS_INGEST_SECRET` | higaet-brevo-cicd, launch-readiness | yes | repo | OK |
| `LAUNCH_READINESS_INGEST_URL` | launch-readiness | optional | repo | **Should be `vars`** |
| `CI_AUDIT_INGEST_SECRET` | higaet-brevo-cicd | yes | repo | OK |
| `OPS_DASHBOARD_URL` | higaet-brevo-cicd | yes | repo | **Should be `vars`** |
| `SUPABASE_URL` | deploy-milesweb, launch-readiness, staging-rollback-validation | yes | repo | OK |
| `SUPABASE_PUBLISHABLE_KEY` | deploy-milesweb, launch-readiness, staging-rollback-validation | yes | repo | **Publishable — not actually secret**; duplicated in `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | deploy-milesweb, launch-readiness, staging-rollback-validation | yes | repo | **Unavailable on Lovable Cloud** (per project rules); validates but is never piped to runtime build → theatrical (P1) |
| `VITE_SUPABASE_URL` | deploy-milesweb, deploy-milesweb-staging, staging-rollback-validation | yes | repo | Duplicate of `SUPABASE_URL` (same value, different name) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same | yes | repo | Duplicate of `SUPABASE_PUBLISHABLE_KEY` |
| `VITE_SUPABASE_PROJECT_ID` | deploy-milesweb-staging only | yes | repo | OK |
| `VITE_STRIPE_PUBLISHABLE_KEY` | deploy-milesweb | yes (strict) | repo | Publishable — not a true secret |
| `STRIPE_SECRET_KEY` | deploy-milesweb | yes (strict) | repo | **Blocker if not yet configured** — `validate-env.mjs --strict` exits 1 (P0) |
| `STRIPE_WEBHOOK_SECRET` | deploy-milesweb | yes (strict) | repo | Same blocker |
| `SESSION_SECRET` | deploy-milesweb, staging-rollback-validation | yes (strict) | repo | OK — should be generated, never user-typed |
| `OPENAI_API_KEY` | deploy-milesweb | yes (strict) | repo | **Blocker if missing** (P0) — `validate-env.mjs` AI bucket is strict |
| `GEMINI_API_KEY` | deploy-milesweb | yes (strict) | repo | Same |
| `GA4_MEASUREMENT_ID` | deploy-milesweb | optional | repo | **Should be `vars`** |
| `GSC_VERIFICATION` | deploy-milesweb | optional | repo | **Should be `vars`** |
| `SSH_HOST` | deploy-milesweb, staging-readiness, staging-rollback-validation | yes | repo + `staging` env | **Duplicate of `MILESWEB_SSH_HOST` / `STAGING_HOST`** (P1) |
| `SSH_USER` | deploy-milesweb, staging-readiness, staging-rollback-validation | yes | repo | **Duplicate** — staging deploy hardcodes `CPANEL_USER: wnwpopno` instead |
| `SSH_KEY` | deploy-milesweb, staging-readiness, staging-rollback-validation | yes | repo | **Duplicate of `MILESWEB_SSH_KEY`** |
| `MILESWEB_SSH_HOST` | deploy-milesweb-staging | yes | `staging` env | **Duplicate** |
| `MILESWEB_SSH_KEY` | deploy-milesweb-staging | yes | `staging` env | **Duplicate** |
| `MILESWEB_SSH_PORT` | deploy-milesweb-staging | optional | `staging` env | **Only one workflow uses it** — others assume port 22 silently |
| `STAGING_HOST` | staging-readiness, staging-rollback-validation | yes | `staging` env | **Third name for the same hostname** |
| `STAGING_BASE_URL` | staging-readiness, staging-rollback-validation | yes | `staging` env | **Should be `vars`** |
| `SUPABASE_DB_HOST` / `_PORT` / `_USER` / `_PASSWORD` / `_NAME` | launch-readiness only | yes | repo | **Unavailable on Lovable Cloud** (project rule). Phase A audit + role-validation jobs will fail without these → security gate never passes (P1) |
| `TEST_FIXTURE_PASSWORD` | launch-readiness | yes | repo | OK |
| `READINESS_GH_TOKEN` | staging-readiness | optional (falls back to `GITHUB_TOKEN`) | repo | OK |
| `GITHUB_TOKEN` | staging-readiness, brevo, others | auto | n/a | Built-in, OK |
| `DD_API_KEY`, `DD_APP_KEY` | datadog-synthetics | yes | repo | **Workflow likely unused** — boilerplate (P4) |
| `SLACK_WEBHOOK_URL` | brevo, launch-readiness, staging-readiness | optional | repo | OK |
| `DISCORD_WEBHOOK_URL` | launch-readiness (env-level only, never consumed in steps) | unused | repo | **Defined-but-unreferenced in step logic** (P4) — only `notify-failure.mjs` reads it; verify script honors it |
| `TEAMS_WEBHOOK_URL` | launch-readiness (env-level) | same | repo | Same |
| `GENERIC_WEBHOOK_URL` | launch-readiness (env-level) | same | repo | Same |
| `DEPLOY_WEBHOOK_URL` | brevo autonomous controller | optional | repo | **No target documented** — points to where? |
| `CANARY_WEBHOOK_URL` | brevo | optional | repo | Same — undocumented endpoint |
| `ROLLBACK_WEBHOOK_URL` | brevo | optional | repo | Same |

### Confirmed defects in Phase 1

- **Duplicate secret families for the same SSH host**: `SSH_HOST` / `MILESWEB_SSH_HOST` / `STAGING_HOST`, `SSH_KEY` / `MILESWEB_SSH_KEY`, `SSH_USER` (vs hardcoded `wnwpopno`).  Two operators rotating one will desync the other workflows.  (P1)
- **`SUPABASE_PUBLISHABLE_KEY` + `VITE_SUPABASE_PUBLISHABLE_KEY`** carry the same value but live as separate secrets *and* in committed `.env`. Treating a publishable key as a rotated secret is a process error. (P2)
- **`SUPABASE_DB_*` secrets** are referenced by `launch-readiness.yml` but the project runs on Lovable Cloud — DB password is not retrievable. The job will silently `chmod 0`-equivalent: `security-audit.mjs` will skip the live-RLS check (degrading the gate) and `role-validation.test.mjs` will hard-fail when `PGPASSWORD` is empty. (P1)

---

## PHASE 2 — Variables Inventory

| Variable | Used By | Required? | Notes |
|---|---|---|---|
| `STAGING_EXPECTED_IP` | staging-readiness | yes | Correct as `vars` |
| `DEPLOY_DIR` | staging-readiness | optional (default `~/apps/higaet`) | OK |
| `READINESS_CACHE_TTL_HOURS` | phase-2-2-authorization | optional (default `24`) | OK |
| `SYSTEM_MODE` | brevo autonomous controller | optional (default `NORMAL`) | OK |
| `AUTONOMOUS_MODE` | brevo autonomous controller | optional (default `ENABLED`) | OK |

### Misclassifications (secrets that should be vars)

`APP_BASE_URL`, `STAGING_BASE_URL`, `LAUNCH_READINESS_INGEST_URL`, `OPS_DASHBOARD_URL`, `GA4_MEASUREMENT_ID`, `GSC_VERIFICATION` — none are sensitive; storing as secrets prevents them from appearing in logs (useful for debugging) and forces rotation overhead.

---

## PHASE 3 — Environments

Only `staging` is declared (`deploy-milesweb-staging.yml:23`, `staging-readiness.yml:27`, `staging-rollback-validation.yml:26`).
`deploy-milesweb.yml:21` declares `environment: ${{ github.event.inputs.environment }}` — dynamic; works only if both `staging` **and** `production` GitHub Environments exist.

### Defects

- **No `production` environment in any other workflow**. The autonomous controller's `Execute DEPLOY` step (brevo line 564) POSTs `DEPLOY_WEBHOOK_URL` directly with **no environment gate or protection rule**. (P1)
- **Same secret namespace (`SSH_HOST/USER/KEY`) used in both repo scope and `staging` environment** → if a production environment is later added, accidentally inheriting staging credentials is one click away.
- **No approval rule documented** — `phase-2-2-authorization.yml` is the soft gate, but it's not wired as a required `workflow_run` dependency anywhere.

---

## PHASE 4 — SSH Audit

| Workflow | Host secret | User | Key secret | Port | Known hosts | Deploy dir |
|---|---|---|---|---|---|---|
| `deploy-milesweb-staging.yml` | `MILESWEB_SSH_HOST` | hardcoded `wnwpopno` | `MILESWEB_SSH_KEY` | `MILESWEB_SSH_PORT \|\| 22` | none | hardcoded `/home/wnwpopno/higaet-staging` |
| `deploy-milesweb.yml` | `SSH_HOST` | `SSH_USER` | `SSH_KEY` | (none — default 22) | none | hardcoded `~/apps/higaet` |
| `staging-rollback-validation.yml` | `STAGING_HOST` | `SSH_USER` | `SSH_KEY` | (none) | none | hardcoded `~/apps/higaet` |
| `staging-readiness.yml` | `SSH_HOST` (probe) | `SSH_USER` | writes `SSH_KEY` to disk | (none) | none | `vars.DEPLOY_DIR` |

### Critical SSH findings

1. **Deploy-layout mismatch — staging deploys to `/home/wnwpopno/higaet-staging`, rollback expects `~/apps/higaet`.** If a deploy via `deploy-milesweb-staging.yml` ever fails the smoke test and `staging-rollback-validation.yml` runs, it will roll back **a different directory** that the live release isn't even installed in. (P1)
2. **Host names diverge**: a deploy uses `MILESWEB_SSH_HOST`, the rollback validator uses `STAGING_HOST`. Two operators must keep these manually identical. (P1)
3. **No `known_hosts` pinning anywhere** — `appleboy/ssh-action` and `appleboy/scp-action` accept unknown host keys by default. MITM-vulnerable. (P2)
4. **Private key never wiped** after `staging-readiness.yml:88-90` writes it to `~/.ssh/id_ed25519`. Workflow runners are ephemeral so the practical risk is bounded, but the secret is exposed to every subsequent step in the job. (P3)
5. **`scp/ssh-action` versions inconsistent**: `appleboy/scp-action@v0.1.7` + `appleboy/ssh-action@v1.0.3` (staging deploy), `appleboy/scp-action@v0.1.7` + `appleboy/ssh-action@v1.2.0` (deploy-milesweb + rollback). Standardize. (P3)

---

## PHASE 5 — Supabase Audit

- **`.env` committed** (`/.env` in repo root) contains `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `VITE_*` variants. Per Lovable Cloud rules these keys are publishable so this is not a leak — but the same values exist again as repo secrets (`SUPABASE_URL`, `VITE_SUPABASE_URL`, etc.) creating four sources of truth that can desync. (P2)
- **`SUPABASE_SERVICE_ROLE_KEY`** is validated by `scripts/validate-env.mjs --strict` in `deploy-milesweb.yml:37` but is **never injected into the build or runtime in that workflow** — the validation passes only to satisfy itself. The actual server reads `.env` mounted into `$SHARED_DIR/.env` server-side per `deploy-milesweb-staging.yml:214-216`. The validation is misleading. (P1)
- **`SUPABASE_DB_*` secrets** (host/port/user/password/name) cannot be sourced from Lovable Cloud. `launch-readiness.yml` Phase A jobs will degrade or fail. (P1)
- **`predeploy-schema-validation.ts`** is invoked with the same `PG*` vars — same blocker.

---

## PHASE 6 — Stripe Audit

- Stripe is declared "future phase" in `docs/DEPLOYMENT.md` yet `validate-env.mjs` lists Stripe in the `payments` bucket as **mandatory in strict mode** (`scripts/validate-env.mjs:35-38, 70-72`).
- `deploy-milesweb.yml:33` runs `--strict` → **will exit 1 if any of `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` is missing**, even though no workflow downstream uses Stripe.
- No webhook handler audited (out of scope for CI config) — but no environment separation: same `STRIPE_SECRET_KEY` would be reused across `staging` and `production` dispatch inputs because the secret isn't scoped to the chosen environment.
- (P0 if Stripe not configured; P2 otherwise.)

---

## PHASE 7 — GitHub Actions Expression Audit

### Confirmed P0 — broken expression / structure

**`phase-2-2-authorization.yml:61`**
```yaml
authorize:
  needs: cache-check
  if: needs.cache-check.outputs.cache_hit != 'true'
  uses: ./.github/workflows/staging-readiness.yml
  secrets: inherit
```
Calls `staging-readiness.yml` as a reusable workflow, **but `staging-readiness.yml` does not declare `on: workflow_call:`** (only `workflow_dispatch` + `schedule`). GitHub validates this at job-graph parse time and will fail the run with:
> `error parsing called workflow ".github/workflows/staging-readiness.yml": workflow is not reusable as it is missing a "on.workflow_call" trigger`

Authorization gate is therefore **dead**. Confirmed by `grep -n workflow_call .github/workflows/*.yml` returning zero matches.

### Other expression observations

- `if: ${{ secrets.SLACK_WEBHOOK_URL != '' && ... }}` — **valid** at step level. `secrets` context is permitted in `steps[*].if` since 2023. Not a bug.
- `staging-readiness.yml:101` uses an inline conditional that resolves a path string — works, but brittle: if `SSH_KEY` is empty, `SSH_KEY_PATH` is also empty and downstream code must tolerate that.
- `phase-2-2-authorization.yml:73` reads `needs.authorize.outputs.status` but the reusable workflow it would call does not declare `outputs:`. Even if the workflow_call were fixed, `LIVE_STATUS` would always resolve to empty string.

---

## PHASE 8 — Workflow Dependency Graph

```text
push:main ──► higaet-brevo-cicd ──► (autonomous controller)
                                   ├─► curl DEPLOY_WEBHOOK_URL  ← unknown target
                                   ├─► curl CANARY_WEBHOOK_URL  ← unknown target
                                   └─► curl ROLLBACK_WEBHOOK_URL ← unknown target

push:staging ──► deploy-milesweb-staging  (SSH + scp + Passenger restart)

workflow_dispatch ──► deploy-milesweb (staging|production)        ← duplicate of above
workflow_dispatch ──► staging-rollback-validation (deploy+rollback) ← THIRD deploy path

workflow_dispatch ──► phase-2-2-authorization ──► [BROKEN: calls staging-readiness.yml]

schedule(0 6 * * *) ──► staging-readiness  (DNS/SSL/SSH probes, commits report)

pull_request ──► launch-readiness  (security audit + Playwright)
pull_request ──► seo-cluster-lint
pull_request ──► seo-graph-report
push/PR ──► datadog-synthetics  ← likely orphan
```

### Defects

- **Three concurrent deploy entry points** target the same MilesWeb host (`deploy-milesweb`, `deploy-milesweb-staging`, `staging-rollback-validation`) with **no shared concurrency group** between them. Two simultaneous dispatches can race the symlink swap.
- The autonomous controller's webhook executions (`DEPLOY_WEBHOOK_URL` etc.) have **no documented receiver**. If they're meant to dispatch the deploy workflows, GitHub workflow_dispatch requires a token + the REST URL `/repos/{owner}/{repo}/actions/workflows/{id}/dispatches`, not an arbitrary webhook URL.
- `deploy-milesweb.yml` is functionally superseded by `deploy-milesweb-staging.yml` (newer, has preflight, has Passenger reality check). Keeping both invites operators to dispatch the wrong one. (P4)

---

## PHASE 9 — Deployment Audit

| Concern | Status |
|---|---|
| Atomic release activation | ✅ staging deploy uses timestamped releases + symlink swap. ❌ `deploy-milesweb.yml` uses `ln -sfn ../releases/$SHA current` but **app root has no link** — Passenger won't pick it up |
| Release retention | ✅ staging keeps last 5. ❌ `deploy-milesweb.yml` keeps **all** releases — disk fill risk |
| Smoke probe path | ⚠ inconsistent — staging probes `/api/public/health`; `deploy-milesweb.yml` probes `/healthz` (which doesn't exist in this codebase — confirm via route grep) |
| Rollback signal | ✅ rollback workflow stores `.previous-release` and re-symlinks. ❌ assumes `~/apps/higaet` layout; staging deploy uses `/home/wnwpopno/higaet-staging` so rollback would symlink the wrong tree |
| Boot probe | ✅ `deploy-milesweb.yml:54` boots the bundle in CI before SCP. ❌ Staging skips this — relies on server-side `node --check app.js` only |
| `bun.lock` vs `bun.lockb` | Packaging tries both (`deploy-milesweb-staging.yml:151-152`) but `deploy-milesweb.yml:60` tars only `bun.lock`. Repo has `bun.lock` (per file tree) — OK, but staging fallback is dead code |
| Restart mechanism | ✅ Both touch `tmp/restart.txt` (Passenger) |
| Production deploy trigger | ❌ Only `deploy-milesweb.yml` accepts `environment: production`, and only via manual dispatch. **No automated production path exists.** |

---

## PHASE 10 — Security Audit

- **No secret echo found** in any workflow (`echo "$SECRET"` grep clean).
- **No secret exposed via job outputs** (only `diagnosis`, `status`, `decision`, etc.).
- **Hardcoded values in workflow YAML**:
  - `CPANEL_USER: wnwpopno` and `APP_ROOT: /home/wnwpopno/higaet-staging` (`deploy-milesweb-staging.yml:13-14`)
  - `APP_URL: https://staging.higaet.com` (line 17)
  - `~/apps/higaet` in two workflows
  - `higaet.com` / `staging.higaet.com` in `deploy-milesweb.yml:88`
- **`.env` committed** at repo root with publishable Supabase keys — not a leak per Lovable Cloud rules, but should not be committed because new contributors will assume they may also commit secret values to it.
- **Missing `permissions:` blocks** — only `staging-readiness.yml`, `higaet-brevo-cicd.yml`, `phase-2-2-authorization.yml` declare them. Others inherit the repository default (often `write-all`).
- **`pull_request:` triggers on `launch-readiness.yml` and `higaet-brevo-cicd.yml`** — fork PRs cannot access `secrets.*`, but the workflows will *attempt* to and surface secret-name leakage in error logs. Combine with `pull_request_target` only if you have explicit fork-safety review.
- **`appleboy/ssh-action`** does not enforce StrictHostKeyChecking — silent first-connect TOFU. Should pin host keys.

---

## PHASE 11 — Dead / Duplicate Configuration

- **`datadog-synthetics.yml`** — default GitHub-marketplace boilerplate, requires `DD_API_KEY`/`DD_APP_KEY` that don't appear elsewhere; no Datadog monitor IDs in repo. Likely unused. (P4)
- **`deploy-milesweb.yml`** — duplicate of `deploy-milesweb-staging.yml` minus the hardening. Recommend deprecation. (P4)
- **`scripts/validate-env.mjs`** lists `cloudflare` (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and `storage` (`R2_*`) buckets — neither is referenced by any workflow or production code. Dead validation tier. (P4)
- **`DISCORD_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL`, `GENERIC_WEBHOOK_URL`** declared as `env:` in `launch-readiness.yml:22-25` but only read by `scripts/notify-failure.mjs`; not used elsewhere. Verify the script consumes all four before keeping them. (P3)
- **Duplicate publishable-key entries**: both `SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY` as secrets + as committed `.env` lines. Three sources of truth for the same value.
- **`MILESWEB_SSH_PORT`** referenced only once. Other SSH workflows assume port 22 without honoring a port secret.

---

## PHASE 12 — Required Fixes (Ranked)

### P0 — Blocks GitHub Actions execution
1. **Add `on: workflow_call:` to `staging-readiness.yml`** (and declare `outputs:` for `status`, `transitioned`, `prior_status`, `report_url`, `artifact_url`, `run_url`). Without this, `phase-2-2-authorization.yml` cannot run at all.
2. **Decide Stripe + AI key policy in `scripts/validate-env.mjs`** — either configure all four secrets or relax `--strict` to make the `payments` + `ai` buckets warn-only until those features ship. Today `deploy-milesweb.yml` exits 1 in CI for any project that hasn't wired Stripe.
3. **Fix the `/healthz` smoke probe in `deploy-milesweb.yml:88`** — confirm the actual endpoint is `/api/public/health` (used in staging deploy + readiness checks). Either add a `/healthz` route or change the probe.

### P1 — Blocks deployment
4. **Consolidate SSH secrets** to a single namespace per environment, e.g. `STAGING_SSH_HOST` / `STAGING_SSH_USER` / `STAGING_SSH_KEY` / `STAGING_SSH_PORT` (scoped to the `staging` environment) and `PROD_SSH_*` (scoped to `production`). Remove `SSH_HOST` / `MILESWEB_SSH_*` / `STAGING_HOST` triplication.
5. **Reconcile deploy-layout**: pick one (`/home/<user>/higaet-{env}` *or* `~/apps/higaet`) and update all three workflows. Today a rollback after a staging deploy will operate on the wrong tree.
6. **Move `CPANEL_USER`, `APP_ROOT`, `APP_URL`** out of inline `env:` into the GitHub Environment (`staging`, `production`) as variables. Hardcoding `wnwpopno` blocks any future user migration.
7. **Decide Supabase DB-credential policy**: Lovable Cloud doesn't expose the DB password. Either move security-audit's live RLS check to a server-side scheduled function, or document explicitly that `launch-readiness.yml` requires bring-your-own DB credentials (and accept the test will skip on Cloud).
8. **Document or remove the autonomous-controller webhooks** (`DEPLOY_WEBHOOK_URL`, `CANARY_WEBHOOK_URL`, `ROLLBACK_WEBHOOK_URL`). Today they POST to undocumented targets.
9. **Add shared concurrency group** across the three MilesWeb-touching workflows (`deploy-milesweb-staging`, `deploy-milesweb`, `staging-rollback-validation`) so a deploy and a rollback can't interleave.
10. **Provide an automated production deploy path** (currently only `workflow_dispatch`).

### P2 — Security / Risk
11. **Add `known_hosts` pinning** to all `appleboy/ssh-action` and `appleboy/scp-action` steps (set `fingerprint:` or pre-populate `~/.ssh/known_hosts` with `ssh-keyscan` baked into a repo file).
12. **Stop committing `.env`** — even with publishable values, it normalizes the anti-pattern. Document the four `VITE_*` values in `.env.example` only.
13. **Promote URLs to variables** (`APP_BASE_URL`, `STAGING_BASE_URL`, `LAUNCH_READINESS_INGEST_URL`, `OPS_DASHBOARD_URL`, `GA4_MEASUREMENT_ID`, `GSC_VERIFICATION`).
14. **Switch fork-PR-exposed workflows** to either `pull_request_target` with explicit fork guards or scope them to internal-only by adding `if: github.event.pull_request.head.repo.full_name == github.repository`.
15. **Add explicit `permissions:` (least-privilege)** to every workflow that lacks one (`deploy-milesweb.yml`, `deploy-milesweb-staging.yml`, `staging-rollback-validation.yml`, `launch-readiness.yml`, `seo-*`, `datadog-synthetics.yml`).

### P3 — Reliability
16. Pin `appleboy/ssh-action` to one version across all workflows.
17. Add release-retention cap to `deploy-milesweb.yml` (mirror staging's `tail -n +6 | xargs rm -rf`).
18. Add boot-probe step to `deploy-milesweb-staging.yml` (mirror `deploy-milesweb.yml:54`).
19. Tighten `notify-failure.mjs` consumption — verify Slack/Discord/Teams/Generic webhooks are all read by the script; remove unused envs.
20. Remove `deploy-milesweb.yml` once #5 lands (or reduce it to a thin wrapper that calls `deploy-milesweb-staging.yml` with `environment: production`).
21. Either configure Datadog (add monitors) or remove `datadog-synthetics.yml`.

### P4 — Cleanup
22. Delete unused `cloudflare` + `storage` buckets from `scripts/validate-env.mjs`.
23. Collapse `SUPABASE_*` vs `VITE_SUPABASE_*` secrets — store once, derive `VITE_*` build env at workflow level.
24. Remove `DD_API_KEY` / `DD_APP_KEY` from repo secrets if Datadog is dropped.
25. Sweep unreferenced `SUPABASE_PUBLISHABLE_KEY`/`SERVICE_ROLE_KEY` injection in `deploy-milesweb.yml` validate step (the build doesn't consume them — only validation does, and validation is theatrical).

---

## Confirmed vs Recommendations

| # | Type | Evidence |
|---|---|---|
| 1 | Confirmed | `grep -n workflow_call .github/workflows/*.yml` → no match |
| 2 | Confirmed | `scripts/validate-env.mjs:50-58` exits 1 if `critical.length \|\| ai.length \|\| payments.length` |
| 3 | Confirmed | `deploy-milesweb.yml:88` uses `/healthz`; staging uses `/api/public/health`; route grep for `/healthz` returned no source file |
| 4 | Confirmed | Three host-secret names verified above |
| 5 | Confirmed | Layout strings shown literally in two YAMLs |
| 6 | Confirmed | `deploy-milesweb-staging.yml:13-14` |
| 7 | Recommendation | Depends on whether you want Cloud-compatible CI |
| 8 | Recommendation | No receiver-side code in repo |
| 9 | Confirmed | No `concurrency` block shared |
| 10 | Confirmed | Only `workflow_dispatch` in `deploy-milesweb.yml`; no `push` for prod anywhere |
| 11 | Confirmed | `appleboy/*-action` doesn't pin host keys by default |
| 12 | Confirmed | `.env` present at repo root |
| 13 | Recommendation | Cosmetic / process |
| 14 | Confirmed | Both `launch-readiness.yml` and `higaet-brevo-cicd.yml` use `pull_request:` without fork guards |
| 15 | Confirmed | Five workflows lack `permissions:` |

---

## Closing Note

The autonomous controller (`higaet-brevo-cicd.yml`) is well-engineered: deterministic scoring, audit issue, HMAC ingest. The weakness is below it — the **deployment substrate is three half-finished workflows that disagree on hosts, users, paths, and health endpoints**. Land P0+P1 fixes (≈ 1 day) and this pipeline goes from "looks impressive, can't actually deploy reliably" to "production-grade".

No files were modified during this audit, per instructions.
