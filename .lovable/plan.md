# Launch Readiness Monitoring & Deployment Safety

Scope is large (8 parts spanning CI, scripts, DB, API, UI, tests). I will implement directly into the existing HIGAET codebase — no new project, reusing TanStack Start routes under `_authenticated/admin`, existing Supabase (Lovable Cloud — Postgres, not MySQL), shadcn UI, `createServerFn` + `requireSupabaseAuth`, and the existing `launch-readiness.yml` workflow.

Two clarifications baked in (calling them out, not blocking):
- **"MySQL" in Part 2** — this project uses Postgres via Lovable Cloud. I'll validate against the actual schema (`app_role` enum + `user_roles` policies) using the existing audit infrastructure.
- **Notifications** — I'll wire Slack/Discord/Teams/generic webhooks via repo secrets (`SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL`, `GENERIC_WEBHOOK_URL`). User must add the secret(s) they want active; absent secrets are skipped silently.

## Plan

### Part 1 — CI failure notifications
- New `scripts/notify-failure.mjs` — reusable, reads payload JSON + iterates configured webhook env vars, formats per channel (Slack blocks, Discord embeds, Teams MessageCard, generic POST).
- Update `.github/workflows/launch-readiness.yml`:
  - Add `if: failure()` notify step at job end, passing env/branch/sha/workflow/job/run URL + artifact URLs.
  - Wire secrets via `env:` block.

### Part 2 — Predeploy schema validation
- New `scripts/predeploy-schema-validation.ts` (run via `tsx`):
  - Reads `AppRole` from `src/lib/route-authorization.ts` (already canonical role source).
  - Reads route→role map from same module.
  - Queries Postgres for `app_role` enum values + `user_roles` policy targets via `psql` (uses existing PG* env).
  - Diffs both directions; checks every protected route maps to known roles; flags orphans/duplicates.
  - Writes `artifacts/schema-validation.json` with `{status, missingRoles, extraRoles, missingRoutes, invalidPermissions, timestamp}`.
  - Exits non-zero on mismatch.
- Hook into `launch-readiness.yml` as a required step before deploy gating.

### Part 3 — Persistence
- Migration `launch_readiness_runs` table with all listed columns (jsonb for `audit_*`, `artifact_urls`), indexes on `created_at desc`, `branch`, `environment`, `overall_status`.
- RLS: admin-only SELECT via `has_role(auth.uid(),'admin')`; INSERT via service_role only.
- GRANTs: `SELECT` to `authenticated`, `ALL` to `service_role`.
- Typed model + repository in `src/lib/launch-readiness.functions.ts` (server fns: `getLatestRun`, `listRuns({page,filters})`, `getRun(id)`).
- Ingestion via internal route `POST /api/public/launch-readiness/ingest` guarded by HMAC `LAUNCH_READINESS_INGEST_SECRET` (workflow posts after audit completes).

### Part 4 — Admin dashboard
- Route `src/routes/_authenticated/admin.launch-readiness.tsx`:
  - Role gate: `has_role admin` via existing `RoleGuard`.
  - Summary cards (Overall, Audit Errors/Warnings, PW Pass/Fail, Sec Pass/Fail, Last Check, SHA, Env).
  - Audit breakdown by category (Security/A11y/SEO/Perf/Architecture) — fed from `audit.json` shape already produced by `security-audit.mjs` (extended to bucket categories).
  - Playwright section + report link.
  - Schema validation block.
  - Artifacts download list.
  - Historical table with pagination + filter (env, branch, status) using shadcn `Table`, `Select`, `Pagination`.

### Part 5 — Workflow artifacts
- Update `launch-readiness.yml` to always (`if: always()`) upload: `audit.json`, `playwright-report/`, `security-logs/`, `artifacts/schema-validation.json` via `actions/upload-artifact@v4`, `retention-days: 30`.
- After upload, POST run summary (with artifact URLs constructed from `${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}`) to ingest endpoint.

### Part 6 — API endpoints
TanStack server fns (preferred over raw routes for app-internal):
- `getLatestReadiness`, `listReadinessHistory`, `getReadinessRun(id)`, `getReadinessArtifacts(id)` — all `.middleware([requireSupabaseAuth])` + admin role check inside handler.

### Part 7 — Observability
- Reuse existing logger from `src/lib/` (or add thin `src/lib/logger.ts` if absent). Log validation start/finish, workflow failures, artifact uploads, dashboard access at `info`/`error`. No `console.log`.

### Part 8 — Quality
- TS strict throughout.
- Vitest tests: `tests/integration/role-validation.test.mjs`, `permission-validation.test.mjs`, server-fn unit tests.
- Playwright: `tests/e2e/admin/launch-readiness.spec.ts` covering load, filter, artifact link.

## Files

**Created**
- `scripts/notify-failure.mjs`
- `scripts/predeploy-schema-validation.ts`
- `src/lib/launch-readiness.functions.ts`
- `src/lib/launch-readiness.types.ts`
- `src/routes/_authenticated/admin.launch-readiness.tsx`
- `src/routes/api/public/launch-readiness.ingest.ts`
- `tests/integration/role-validation.test.mjs`
- `tests/integration/permission-validation.test.mjs`
- `tests/e2e/admin/launch-readiness.spec.ts`
- migration: `launch_readiness_runs`

**Modified**
- `.github/workflows/launch-readiness.yml` (notify + uploads + ingest + schema validation step)
- `scripts/security-audit.mjs` (bucket findings by category for dashboard)
- `package.json` (scripts: `predeploy:validate`, `notify:failure`)

## Environment variables
Repo/workflow secrets (user adds the channels they want):
- `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`, `TEAMS_WEBHOOK_URL`, `GENERIC_WEBHOOK_URL` — optional, any combination
- `LAUNCH_READINESS_INGEST_SECRET` — HMAC for ingest endpoint (will mint via `generate_secret`)
- DB: existing `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE` already wired in CI

## Blockers / decisions to confirm
1. **Scope confirmation** — this is ~10 files + migration + workflow rewrite + tests. ~30+ min of edits. Confirm proceed full scope, or trim (e.g. ship Parts 2/3/4/6 first; defer notifications + tests to next pass)?
2. **Notification channel** — which webhook(s) do you want active on day 1? I'll still wire all four; the secret you provide decides which fire.
3. **Ingest source of truth** — OK with workflow POSTing readiness JSON to `/api/public/launch-readiness/ingest` (HMAC-signed) rather than a direct DB write from CI? This keeps DB creds out of GitHub Actions.

Confirm scope (full vs trimmed) + the three answers above and I'll execute in one pass.
