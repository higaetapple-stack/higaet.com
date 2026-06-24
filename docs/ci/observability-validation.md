# CI Observability Validation

This document captures the validation evidence for the HIGAET CI Reliability
Hardening pass.

## Scope

- Explicit workflow permissions across `.github/workflows/`.
- Runtime workflow-context logging step.
- Shared preflight validation in `higaet-brevo-cicd.yml` and
  `staging-readiness.yml`.
- Persistent diagnostics for CI audit ingest failures
  (`ci_ingest_failures` table + `/api/public/ci-ingest-failures/log`).
- Admin-only Ops dashboard panel at `/ops/reliability`.

## Validation checklist

| # | Check | How to verify | Status |
| - | --- | --- | --- |
| 1 | Permissions declared on each workflow | Inspect `permissions:` block in each `.yml` | ✅ documented in `permissions-audit.md` |
| 2 | Runtime context logged | First step in each job prints workflow / repo / actor / event / run | ✅ implemented |
| 3 | Preflight fails clearly on missing secret | Temporarily remove `BREVO_API_KEY` → run shows `❌ Missing secret: BREVO_API_KEY` and job exits 1 | ⏳ run after secrets configured |
| 4 | Preflight passes when all secrets present | Run with full secret set → step logs `✅ All required secrets and variables validated.` | ⏳ run after secrets configured |
| 5 | Audit POST persists | Successful workflow run → `ci_audit_log` gains a row visible in Deployment Timeline | ⏳ pending first successful run |
| 6 | Ingest failure captured | Force a failure (e.g. wrong `OPS_DASHBOARD_URL`) → row appears in `ci_ingest_failures`, panel shows status code + body + correlation id | ⏳ run after deploy |
| 7 | Dashboard panel gated to ops/admin/super_admin | Sign in as a non-ops user → panel returns Forbidden (server-fn throws) | ✅ enforced by `assertOps` |
| 8 | Retention | Insert 201st failure → trigger prunes the oldest row | ✅ enforced by `prune_ci_ingest_failures` trigger |

## Evidence collection

After the next workflow run:

1. Copy the **Workflow context** step output into this file.
2. Copy the **Preflight validation** step output into this file.
3. Take a screenshot of the **CI Audit Ingest Failures** panel on
   `/ops/reliability` (signed in as an ops/admin user).
4. Append a row to the checklist marking each ⏳ as ✅ once verified.

## Remaining blockers

- First end-to-end run is required to populate live failure diagnostics.
- `OPS_DASHBOARD_URL` must point at the production deployment hosting
  `/api/public/ci-audit/ingest` and `/api/public/ci-ingest-failures/log`.
- `CI_AUDIT_INGEST_SECRET` must be identical in GitHub Actions secrets and
  Lovable Cloud secrets.
