# Launch Readiness — Production Checklist

_Use this checklist as the deployment gate for the Launch Readiness monitoring system._

## 1. Required secrets (GitHub Actions repo secrets)

| Name | Purpose | Where to obtain |
| --- | --- | --- |
| `LAUNCH_READINESS_INGEST_SECRET` | HMAC-SHA256 key used by CI to sign payloads POSTed to the ingest endpoint. Must match the value stored in Lovable Cloud. | Already generated in Lovable Cloud secrets — copy that value into GitHub Actions. |
| `LAUNCH_READINESS_INGEST_URL` | Full HTTPS URL of the ingest endpoint. | `https://higaet-core-engine.lovable.app/api/public/launch-readiness/ingest` |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_HOST`, `SUPABASE_DB_PORT`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_NAME`, `TEST_FIXTURE_PASSWORD` | Existing CI secrets reused by audit + E2E + RLS matrix. | Already configured. |

## 2. Optional secrets (notification channels)

Add any subset; missing values are silently skipped.

- `SLACK_WEBHOOK_URL` — Slack incoming webhook
- `DISCORD_WEBHOOK_URL` — Discord channel webhook
- `TEAMS_WEBHOOK_URL` — Microsoft Teams Incoming Webhook connector
- `GENERIC_WEBHOOK_URL` — any JSON-accepting endpoint (raw payload POST)

## 3. Deployment order

1. **Apply migration** — `launch_readiness_runs` table, indexes, RLS policies, and grants are created by the migration that ships with this release. Confirm with:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename='launch_readiness_runs';
   SELECT indexname FROM pg_indexes  WHERE tablename='launch_readiness_runs';
   ```
   Expect 2 policies and 5 indexes (incl. pkey).

2. **Configure secrets** — add the required + chosen optional secrets in GitHub → Settings → Secrets and variables → Actions.

3. **Deploy the application** (`Publish` from Lovable). The ingest endpoint becomes available at the URL above.

4. **Run the launch-readiness workflow** — trigger via `workflow_dispatch` from GitHub Actions. Expected steps:
   - `security-audit` job: audit (strict) → schema validation → permission validation → role validation → upload artifacts. Notifies on failure.
   - `e2e` job: seed → build → preview → Playwright → RLS matrix → readiness report → upload artifacts → ingest readiness summary. Notifies on failure.

5. **Verify dashboard** — sign in as an admin, navigate to `/dashboard/admin/launch-readiness`, confirm the new run appears in the summary cards and the historical table.

6. **Verify notifications** — temporarily break a test (or trigger an empty PR) to confirm at least one configured channel receives a structured failure message.

7. **Verify artifact access** — open the workflow run page from the dashboard's "Workflow run" artifact link; download `audit + schema validation` and `launch-readiness-*` artifacts; confirm they include `artifacts/schema-validation.json` and the Playwright HTML report.

## 4. Post-launch operational checks

- Weekly: review the dashboard's history filter (failed runs by branch) and confirm no silent regressions.
- Monthly: confirm `schema_validation_status = passed` for the latest production run.
- Annually: rotate `LAUNCH_READINESS_INGEST_SECRET` in both Lovable Cloud and GitHub Actions.
