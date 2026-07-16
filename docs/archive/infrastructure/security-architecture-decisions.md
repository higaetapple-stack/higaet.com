# Security Architecture Decisions (Milestone 2.1 Final)

> Stable companion to the auto-generated `security-audit-report.md` and
> `rls-route-consistency-report.md`. The audit reports are overwritten on
> every run; this document records the *why* behind the policies the audit
> verifies.

Last reviewed: 2026-06-23.

## 1. Role model

The authoritative role set lives in the `public.app_role` enum:

```
student, faculty, mentor, counselor, placement_officer,
enterprise_client, tech_client, admin, super_admin
```

- `tech_client` is **kept** — it backs `/dashboard/technologies` and the
  `tech_*` table policies. Drift detection passes because the enum,
  `AppRole` TypeScript union, `ROUTE_PERMISSIONS`, and
  `_authenticated.dashboard.*.tsx` guards reference the same identifier.
- `admin` and `super_admin` implicitly bypass every `requireRolesOrRedirect`
  gate (see `src/lib/route-authorization.ts`).

## 2. Privileged server-function migration (leads + portfolio)

`src/lib/leads.functions.ts` and `src/lib/portfolio.functions.ts` previously
used `supabaseAdmin` (service role) for public reads/writes.

**Previous:** `client → server fn → service_role → DB` (RLS bypassed).
**Current:**  `client → server fn → publishable key → RLS → DB`.

Rationale:
- Reduced privilege surface — public-facing functions never hold a
  service-role key.
- Policy-driven enforcement — visibility is centralised in `pg_policies`
  rather than ad-hoc handler logic.
- Easier auditing — `scripts/security-audit.mjs` flags any
  `supabaseAdmin` use that lacks `requireSupabaseAuth` + a `has_role`
  check.
- Reduced bypass risk — a future bug in a handler cannot accidentally
  expose private rows; only the policies can.

## 3. Final RLS decisions per table

| Table | SELECT | INSERT | UPDATE | DELETE | Rationale |
|---|---|---|---|---|---|
| `profiles` | owner; `anon` only when `portfolio_visibility='public'` and column toggles enabled | owner | owner | owner | Public portfolios opt-in; everything else is owner-scoped. |
| `certificates` | owner; admin; `anon` only when linked profile is public **and** `show_certificates=true` | service_role / admin | service_role / admin | service_role | Credentials are issuer-authoritative; learners read their own. |
| `project_submissions` | owner; reviewer; `anon` only when linked profile is public **and** `show_projects=true` | owner | owner; reviewer | owner | Same visibility contract as certificates. |
| `study_abroad_leads` | admin / counselor only | `anon` (lead capture) | admin | admin | Lead capture must be open; reads are staff-only. |
| `ai_usage` | admin only | service_role | admin | service_role | Operational telemetry — only staff dashboards read it. |

## 4. Route ↔ role matrix

Source of truth: `src/lib/route-authorization.ts` (`ROUTE_PERMISSIONS`).
Audited every CI run against the live enum.

| Surface | Allowed roles |
|---|---|
| `/dashboard/admin` | admin, super_admin |
| `/dashboard/faculty` | faculty, admin, super_admin |
| `/dashboard/counselor` | counselor, mentor, admin, super_admin |
| `/dashboard/career` | student, placement_officer, admin, super_admin |
| `/dashboard/technologies` | tech_client, admin, super_admin |
| `/education` | enterprise_client, admin, super_admin |

## 5. CI enforcement

`.github/workflows/launch-readiness.yml` runs `scripts/security-audit.mjs`
with `STRICT=1`, so the build fails on **any** finding (critical, high,
medium). Audit reports are uploaded as artifacts. Playwright + RLS-matrix
gates only run after the audit job is green.

## 6. Test coverage

- **Playwright** (`tests/e2e/auth/`) — login, logout, registration,
  password reset, session expiry, role redirects, redirect preservation,
  403 page, protected routes, education access, admin access, mobile nav.
- **RLS matrix** (`tests/integration/rls-matrix.test.mjs`) — anon /
  student / service_role × leads, portfolio (profiles), ai_usage.
