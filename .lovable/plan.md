## HIGAET Reliability Operations Dashboard

Read-only, single-pane-of-glass view of the CI/CD autonomous controller. Lives at `/ops/reliability`, restricted to admin, super_admin, and a new `ops` role.

### Data model

Add the `ops` value to the existing `app_role` enum and one new table:

```text
ci_audit_log (mirrored from CI for trend charts)
  id, ts, sha, branch, actor, run_url,
  decision, decision_source, decision_reason, executed, execute_reason,
  system_health_score, risk_level, platform_state,
  system_mode, autonomous_mode, diagnosis,
  raw jsonb
```

RLS: SELECT for admin/super_admin/ops; INSERT only via the ingest server route (verified by a shared secret header), no UPDATE/DELETE.

### Ingestion

- Extend `.github/workflows/higaet-brevo-cicd.yml` audit step to POST `audit/decision.json` to a new public server route `/api/public/ci-audit/ingest`, authenticated with HMAC of the body using `CI_AUDIT_INGEST_SECRET` (timing-safe compare, Zod validation, then write via `supabaseAdmin` loaded inside the handler).
- The route is idempotent on `(sha, ts, decision)`.

### Live GitHub data (no token storage in DB)

Server functions in `src/lib/ops-reliability.functions.ts`, all `requireSupabaseAuth` + role check (admin/super_admin/ops):

- `getLiveControllerState()` — fetches latest successful `HIGAET Brevo CI/CD` workflow run summary + outputs via GitHub REST (token from `GITHUB_OPS_TOKEN` secret).
- `getOpenIncidents()` — lists open issues with label `incident,brevo` grouped by severity (parsed from `<!-- severity:X -->` body marker).
- `getAuditTrends({ range })` — reads `ci_audit_log` for 24h / 7d / 30d, returns time-bucketed series for health score, risk, retry/diagnosis counts.
- `getDeploymentTimeline({ limit })` — joins recent `ci_audit_log` rows with comments on the Decision Audit Log issue.
- `getGovernanceState()` — reads `vars.SYSTEM_MODE` / `vars.AUTONOMOUS_MODE` via GitHub repo variables API, plus most recent OVERRIDE rows from `ci_audit_log`.
- `getBrevoReliability({ range })` — derived from `ci_audit_log.diagnosis`: counts of `BREVO_AUTH_*`, `BREVO_NETWORK_OR_TIMEOUT`, success rate, last `BREVO_AUTH_OK`.

Secrets needed: `GITHUB_OPS_TOKEN` (repo read), `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `CI_AUDIT_INGEST_SECRET` — request via add_secret in a follow-up turn.

### Routes & UI

- `src/routes/_authenticated/ops/route.tsx` — pathless ops layout with role guard (admin / super_admin / ops). Non-ops users redirect to `/403`.
- `src/routes/_authenticated/ops/reliability.tsx` — main dashboard, TanStack Query for every section, refresh button + 60s auto-refetch on live sections, `range` search param (24h/7d/30d) drives trend queries.

Eight sections, each its own component under `src/components/ops/reliability/`:

```text
1. PlatformHealthOverview   — big status tiles (HEALTHY/STABLE/DEGRADED/CRITICAL)
2. DeploymentTimeline       — virtualized table from audit + run links
3. IncidentCenter           — accordion grouped by severity
4. BrevoReliabilityPanel    — auth success %, timeout/auth-failure counts, last verify
5. AutonomousControllerPanel — decision source/reason, override badge
6. RiskAnalytics            — recharts line charts: health, risk, incident, retry
7. GovernancePanel          — SYSTEM_MODE / AUTONOMOUS_MODE state pills, audit link
8. ExecutiveSummary         — single compact card at top
```

Color tokens already in `src/styles.css`; use semantic Badge variants only, no hardcoded colors.

### Access control

- New migration adds `'ops'` to `app_role`, grants/policies use existing `has_any_role`.
- Sidebar item "Reliability Ops" shown only when `has_any_role(user, ['admin','super_admin','ops'])`.

### Out of scope

- No actions that execute deploys/rollbacks (read-only by directive).
- No new tracking system — reuses GitHub issues + ci_audit_log.
- Cost/Security/Business dashboards (later phases per user).

### Implementation order

1. Migration: enum value + `ci_audit_log` + RLS + grants.
2. Server route `/api/public/ci-audit/ingest` with HMAC.
3. CI workflow audit step posts to ingest route.
4. Server functions for live + trend reads.
5. Layout + dashboard route + 8 section components.
6. Sidebar entry behind role check.
7. Request secrets (`GITHUB_OPS_TOKEN`, `CI_AUDIT_INGEST_SECRET`).