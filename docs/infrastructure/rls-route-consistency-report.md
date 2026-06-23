# RLS ↔ ROUTE_PERMISSIONS Consistency Report

**Date:** 2026-06-23
**Source matrix:** `src/lib/route-authorization.ts → ROUTE_PERMISSIONS`
**Method:** Manual cross-reference against current migrations and known RLS policies. Will be replaced by `scripts/audit-rls-consistency.ts` once route↔table mapping is committed.

---

## Architectural model

```
ROUTE_PERMISSIONS  ─────► beforeLoad role gate  ─────► UI hidden if wrong role
                                  │
                                  ▼
                          server function call
                                  │
                                  ▼
        ┌───────────────────────────────────────┐
        │  Supabase RLS (source of truth)        │
        │   • has_role(auth.uid(), 'admin')      │
        │   • auth.uid() = owner_id              │
        └───────────────────────────────────────┘
```

The DB layer is authoritative. Route-level checks are UX + defense-in-depth.

## Route → table → policy mapping

| Route prefix              | Primary tables read/written                                 | Policy role gate (expected)                                | Status |
| ------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- | ------ |
| `/dashboard/admin/*`      | most `public.*` admin-managed tables, `user_roles`          | `has_role(auth.uid(), 'admin' \| 'super_admin')`           | ✅ matches matrix |
| `/dashboard/faculty/*`    | `courses`, `assignments`, `submissions`, `enrollments`      | `has_role('faculty')` OR owner check on assigned course    | ⚠ verify per-table |
| `/dashboard/counselor/*`  | `leads`, `applications`, `tasks`, `follow_ups`, `visa_cases`| `has_role('counselor'\|'mentor')` OR `assigned_to = uid()` | ⚠ verify per-table |
| `/dashboard/career/*`     | `profiles` (self), `applications` (own), `saved_jobs`       | `auth.uid() = user_id`                                     | ✅ owner-scoped |
| `/dashboard/education/*`  | `enterprise_orders`, `enterprise_contracts`                 | `has_role('enterprise_client')` + tenant scope             | ⚠ no layout shipped yet |
| `/dashboard/technologies/*` | `tech_projects`, `tech_proposals`, `tech_contracts`       | `has_role('tech_client')` + tenant scope                   | ⚠ verify tenant scope |

Legend: ✅ matrix and RLS align; ⚠ requires per-table verification; ❌ mismatch found.

## Findings

1. **No ❌ mismatches found** between the route matrix and known top-level policies. `admin` / `super_admin` bypass via `has_role` matches the route-level bypass.
2. **Counselor / faculty tables** rely on a mix of `has_role` and per-row owner / assignee checks. This is correct, but only the automated audit script can guarantee no table is missing a policy entirely.
3. **`/dashboard/education` aliasing** — the route matrix lists it, but no layout route exists yet, and no enterprise-specific RLS audit has been performed because no enterprise tables are in use.
4. **`user_roles`** — `SELECT` granted only to `authenticated`, read via `has_role` (SECURITY DEFINER). No client-side mutation path exists; only service-role can grant roles. ✅
5. **`profiles`** — `auth.uid() = id` for both read and update; row-level enforcement matches the "self-only" expectation of `/dashboard/career` profile editing. ✅

## Open work

- Commit `scripts/audit-rls-consistency.ts`:
  - Pull `pg_policies` via `supabase` MCP or `supabase--read_query`.
  - Diff against a hard-coded `ROUTE_TABLE_MAP` colocated with `ROUTE_PERMISSIONS`.
  - Exit non-zero on missing-policy or broader-than-route-allows findings; rewrite this report in place.
- Add the script to CI as a required check on PRs touching `src/lib/route-authorization.ts`, `supabase/migrations/**`, or any `*.functions.ts` file.

## Risk summary

| Risk                                                              | Severity | Mitigation                                       |
| ----------------------------------------------------------------- | -------- | ------------------------------------------------ |
| Route allows role X; underlying table has no policy for X         | High     | Audit script (pending)                           |
| Route restricts role X; RLS allows X anyway                       | Low      | Acceptable — server is stricter than UI is fine until audit |
| Admin bypass diverges between client matrix and `has_role` policy | Critical | Both use same role names; covered by P2 E2E tests |
