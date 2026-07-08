# Supabase Production Credential & Environment Audit

- **Date:** 2026-07-08
- **Environment:** HIGAET Production (Lovable Cloud, project ref `xbdwfekhnghrwrteqtvm`)
- **Scope:** Post database-password rotation verification. No secret values are
  printed anywhere in this report.

## 1. Database Password / Connection String References

Searched the entire repo (excluding `node_modules`, lockfiles, docs) for
`SUPABASE_DB_PASSWORD`, `DATABASE_URL`, `POSTGRES_PASSWORD`, `postgres://`,
`postgresql://`.

| Reference | Location | Status |
| --- | --- | --- |
| `DATABASE_URL` | `src/lib/config.server.ts:23` — **commented out** placeholder | ✅ Inert; no live use |
| `SUPABASE_DB_PASSWORD` | none | ✅ Not referenced |
| `POSTGRES_PASSWORD` | none | ✅ Not referenced |
| Raw `postgres://` / `postgresql://` connection strings | none | ✅ Not referenced |

**Conclusion:** No code path uses a direct Postgres password or connection
string. The rotated database password does **not** need to be wired into any
application secret — Lovable Cloud manages Postgres access via the
publishable/service-role keys only. No action required.

## 2. Secret Presence Matrix

Runtime secrets configured for this project (values never displayed):

| Secret | Status | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | ✅ Auto-injected by Lovable Cloud | Managed |
| `SUPABASE_PUBLISHABLE_KEY` | ✅ Auto-injected | Managed |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Auto-injected | Managed; never exposed to client |
| `SRE_E2E_TRIGGER_SECRET` | ✅ Configured | |
| `GITHUB_TOKEN` | ✅ Configured | |
| `GITHUB_REPO` / `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` | ✅ Configured | |
| `GITHUB_OPS_TOKEN` | ✅ Configured | |
| `SENTRY_WEBHOOK_SECRET` | ✅ Configured | |
| `SENTRY_AUTH_TOKEN` | ⚠️ **Missing** | Required for sourcemap upload / Seer |
| `SENTRY_ORG_SLUG` | ⚠️ **Missing** | |
| `SENTRY_PROJECT_SLUG` | ⚠️ **Missing** | |
| `DATADOG_API_KEY` | ⚠️ **Missing** | Required if Datadog synthetics used |
| `DATADOG_APP_KEY` | ⚠️ **Missing** | |
| `BREVO_API_KEY` | ✅ Configured | |
| `EMAIL_FROM_ADDRESS` / `EMAIL_FROM_NAME` / `EMAIL_REPLY_TO` | ✅ Configured | |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | ⚠️ **Missing** | Add only if Cloudflare flows are activated |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ENDPOINT` | ⚠️ **Missing** | Add only if R2 storage is enabled |
| `LOVABLE_API_KEY` | ✅ Managed | Rotate via `rotate_lovable_api_key`, not secrets tools |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` | ✅ Configured | AI fallbacks |
| `CI_AUDIT_INGEST_SECRET`, `LAUNCH_READINESS_INGEST_SECRET`, `DEV_SEED_TOKEN`, `TEST_FIXTURE_PASSWORD` | ✅ Configured | Internal use |

Legend: ✅ configured · ⚠️ missing · No secret values are ever rendered.

**Unused / not referenced in source:** none of the currently-configured
secrets are dead — each is read by at least one server function, edge
function, or CI script.

## 3. Database Schema Verification

Three admin tables checked against the live production database:

| Table | Exists | RLS | Admin policies | Anon access |
| --- | --- | --- | --- | --- |
| `operator_checklist_items` | ✅ | ✅ enabled | ✅ SELECT/INSERT/UPDATE/DELETE for `authenticated` gated by `has_any_role(admin, super_admin)` | ✅ None (no anon policy) |
| `admin_integration_secrets` | ✅ | ✅ enabled | ✅ ALL for admins | ✅ None |
| `admin_domain_status_history` | ✅ | ✅ enabled | ✅ SELECT + INSERT for admins | ✅ None |

### Grants finding (defense-in-depth)

Raw `pg_class.relacl` shows the historic project-wide grant
`GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role`
still applies to these tables, so all three roles hold full DML privileges at
the Postgres layer. **Functional security is intact** because RLS is on and
no policy targets `anon` (PostgREST returns zero rows / permission denied),
but grants themselves violate least privilege.

**Recommendation (not applied — audit-only run):** ship a follow-up
migration that revokes `anon` privileges on these three tables and narrows
`authenticated` grants to the operations the policies allow. Matches the
hardening already performed for other staff-only tables on 2026-07-08.

## 4. Generated TypeScript Types

`src/integrations/supabase/types.ts` audited:

- `admin_domain_status_history` — present (line 17)
- `admin_integration_secrets` — present (line 68)
- `operator_checklist_items` — present (line 2982)

✅ No regeneration required. Types match the live schema.

## 5. Production Readiness Validation

| Check | Result |
| --- | --- |
| TypeScript typecheck (`tsgo --noEmit`) | ✅ PASS |
| Schema presence for admin tables | ✅ PASS |
| RLS enabled on admin tables | ✅ PASS |
| Admin-only policies in place | ✅ PASS |
| Generated types in sync | ✅ PASS |
| No DB password in source | ✅ PASS |
| Sentry/Datadog observability secrets | ⚠️ BLOCKED — see §2 |
| Cloudflare / R2 secrets | ⚠️ BLOCKED only if those integrations are activated |

## 6. Security Confirmation

- ✅ No database passwords hardcoded in source (only a commented placeholder).
- ✅ No secret values are committed, logged, or returned by server functions
  reviewed in this audit.
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is only imported from
  `src/integrations/supabase/client.server.ts`, which is server-only.
- ✅ Admin routes remain protected by the `_authenticated` layout gate,
  server-side `assertAdmin` (`has_any_role`) checks, and RLS policies.
- ⚠️ Over-broad `anon` grants on admin tables — see §3. RLS blocks reads but
  should still be tightened.

## 7. Remaining Operational Blockers / Manual Actions

1. **Add missing observability secrets** (via secure form, not source):
   `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG`,
   `DATADOG_API_KEY`, `DATADOG_APP_KEY`.
2. **Cloudflare / R2 secrets** — add only if/when those integrations are
   enabled; otherwise leave unset.
3. **Optional hardening migration** to revoke `anon` privileges and narrow
   `authenticated` grants on `operator_checklist_items`,
   `admin_integration_secrets`, `admin_domain_status_history`. Non-blocking
   for launch because RLS still enforces admin-only access.
4. **Rotated database password** — no code change needed; Lovable Cloud does
   not consume `SUPABASE_DB_PASSWORD` from application secrets.

No credentials were rotated by this audit. No secret values were displayed
or written to disk.
