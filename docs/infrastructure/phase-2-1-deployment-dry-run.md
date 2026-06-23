# Phase 2.1 — Deployment Dry Run

**Mode:** Static validation of the deployment pipeline. No SCP, no SSH, no remote execution.

## 1. Workflow Validation

| Workflow | Path | Status | Notes |
| --- | --- | --- | --- |
| Staging deploy + rollback | `.github/workflows/staging-rollback-validation.yml` | PASS (static) | Manual dispatch only; concurrency group set; uses `staging` environment. |
| MilesWeb deploy | `.github/workflows/deploy-milesweb.yml` | PASS (static) | Manual dispatch with `staging`/`production` choice; concurrency per environment. |

## 2. Environment Validation

- `scripts/validate-env.mjs --strict` is invoked as a pre-build step in both workflows.
- Required secrets consumed: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, plus build-time `VITE_*`.
- Staging-only `HIGAET_STAGE=staging`, `HEALTH_RL_LIMIT`, `HEALTH_RL_WINDOW_MS` to be added to staging environment (see Task C).
- No production secret names referenced from the staging workflow.

## 3. Artifact Packaging

- Tarball: `release-<sha>.tgz` containing `dist .output app.js package.json bun.lock`.
- SCP target: `releases/` on remote.
- Integrity: tar is created on the runner immediately before SCP; SHA is short commit SHA, scoped via `concurrency`.
- Symlink swap pattern: `current → releases/<sha>`; previous target captured in `~/apps/higaet/.previous-release` for rollback.

## 4. Boot Probe Validation

- `deploy-milesweb.yml` performs a local boot probe with `node -e "import('./.output/server/index.mjs')…"` before packaging.
- `staging-rollback-validation.yml` performs a remote boot probe via `GET $STAGING_BASE_URL/api/public/health` with 10×5 s retry.
- Passenger restart trigger: `touch tmp/restart.txt`.

## 5. Smoke Invocation Validation

- `bun scripts/run-smoke-tests.ts` is invoked after the health probe.
- Runner writes `test-results/smoke/summary.json` (machine-readable) and uploads the directory as a workflow artifact (`smoke-report-<sha>`).
- Suite scope (Phase 2.0.1): health, RBAC, AI routing envelope, embeddings cron envelope, RAG surface, admin gate.

## 6. Risks Identified

| Risk | Severity | Mitigation |
| --- | --- | --- |
| `staging.higaet.com` DNS / SSL not provisioned | HIGH | Blocks Task B execution. See infrastructure verification. |
| First rollback rehearsal never executed live | MEDIUM | Plan a forced-failure deploy after first green run. |
| Health endpoint rate limit could throttle CI probes if misconfigured | MEDIUM | Defaults (60 req/min/IP) > probe rate (≈10/run). |
| Passenger restart timing on MilesWeb unverified | MEDIUM | Health-probe retry loop (10×5 s) covers a ≤50 s restart. |
| OpenAI 429 still active | MEDIUM | Staging uses OpenRouter/Gemini fallbacks (Phase 1.10–1.13). |

## 7. Dry Run Result

**PASS (static).** All pipeline stages validate as authored. Live execution is **gated on Task A remediation** (DNS + secrets + MilesWeb slot). No production references, URLs, secrets, or DNS operations are present in the staging workflow.
