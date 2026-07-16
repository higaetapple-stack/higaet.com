# Phase 2.2 — Automation Package Status

Implements the **A (readiness checker) + B (evidence collector)** portions of the Phase 2.2 Automation Package immediately. C/D/E (rollback/CI/auth) are deferred — they already exist as `.github/workflows/staging-rollback-validation.yml` and cannot be exercised end-to-end until staging is live.

## Implemented (now)

| Capability | Deliverable | Notes |
| --- | --- | --- |
| Readiness checker | `scripts/check-staging-readiness.ts` | DNS (2 resolvers + expected IP match), SSL (CN + ≥30 d), SSH auth, Node 20, deploy-dir writability, Passenger restart trigger, GitHub `staging` environment + 5 required secrets. |
| Evidence collector | Same script | Raw probe output → `test-results/readiness/<timestamp>/*.txt/json`. Summary → `summary.json`. |
| Report generator | Same script | Overwrites `docs/infrastructure/phase-2-2-prerequisite-report.md` with timestamp, run ID, per-check PASS/FAIL, and remediation pointer. |
| CI automation | `.github/workflows/staging-readiness.yml` | Manual dispatch + daily 06:00 UTC cron. Uploads evidence + report as workflow artifact. Job fails on NO-GO so the GitHub Actions badge reflects state. |

## Local Usage

```bash
STAGING_HOST=staging.higaet.com \
STAGING_BASE_URL=https://staging.higaet.com \
STAGING_EXPECTED_IP=<milesweb-ip> \
SSH_HOST=<host> SSH_USER=<user> SSH_KEY_PATH=~/.ssh/id_ed25519 \
GITHUB_REPO=<owner>/<repo> GITHUB_TOKEN=<pat-with-actions-read> \
bun scripts/check-staging-readiness.ts
```

Exit codes: `0` PASS, `1` NO-GO, `2` checker error.

## Required Configuration

GitHub repo → Settings → Environments → `staging`:

- **Secrets:** `STAGING_HOST`, `STAGING_BASE_URL`, `SSH_HOST`, `SSH_USER`, `SSH_KEY` (+ optional `READINESS_GH_TOKEN` if the default `GITHUB_TOKEN` lacks `environments:read` scope on private repos).
- **Variables:** `STAGING_EXPECTED_IP` (MilesWeb origin), optional `DEPLOY_DIR` (defaults to `~/apps/higaet`).

Until those exist, the checker still runs — it records FAIL with explicit "not configured" evidence, never crashes.

## Deferred (intentionally)

| Item | Why deferred |
| --- | --- |
| C — automated rollback validation | Already implemented in `staging-rollback-validation.yml`; the rehearsal path requires a live staging target to mean anything. |
| D — full deployment CI pipeline | `deploy-milesweb.yml` + `staging-rollback-validation.yml` cover this; adding more steps before staging is live would be untestable. |
| E — automated GO/NO-GO authorization | Logic exists in the runbook + final-gate report; mechanizing it before the readiness output is real risks codifying the wrong decision. |
| F — auto-generated `smoke/rag/deployment/final-gate` reports | They are byproducts of an actual deploy. The stubs from Phase 2.2 prerequisite work remain in place and will be filled by the existing pipeline on first green run. |

## Exit Criteria — Progress

- ✅ Readiness checks run automatically (workflow dispatch + cron).
- ✅ Evidence collection automated (per-probe artifacts + JSON summary).
- ⏳ Rollback validation automation — exists; rehearsal pending staging.
- ⏳ Pipeline records artifacts — readiness pipeline does; deploy pipeline pending staging.
- ⏳ Auto GO/NO-GO — readiness checker emits a binary outcome; full Phase 2.2 gate awaits deploy execution.
- ⏳ All Phase 2.2 reports auto-generated — prerequisite report now is; the rest are stubs awaiting a real deploy.

## Next Trigger

When Ops completes `infrastructure-activation-checklist.md`, the first successful readiness run flips `phase-2-2-prerequisite-report.md` to PASS automatically, unblocking the existing `staging-rollback-validation.yml` for the first authorized Phase 2.2 deploy.
