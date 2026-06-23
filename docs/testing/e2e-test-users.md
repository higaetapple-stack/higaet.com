# E2E Test Users

Deterministic fixtures provisioned by `scripts/seed-test-users.mjs`. Do **not**
edit these accounts by hand — re-run the seed script if anything drifts.

## Accounts

| Email | Role (app_role) | Expected dashboard |
|---|---|---|
| `student.test@higaet.dev` | `student` | `/dashboard` |
| `counselor.test@higaet.dev` | `counselor` | `/dashboard/counselor` |
| `faculty.test@higaet.dev` | `faculty` | `/dashboard/faculty` |
| `admin.test@higaet.dev` | `admin` | `/dashboard/admin` |

Password is read from `TEST_FIXTURE_PASSWORD` (a runtime secret managed via
Lovable Cloud) and re-applied on every seed run.

## Why these four

They cover every distinct branch of `requireRolesOrRedirect` plus the
`dashboardForRoles` mapping for non-admin roles. `super_admin`, `mentor`,
`placement_officer`, `enterprise_client`, and `tech_client` are intentionally
**not** seeded — adding them requires either enum changes (deferred) or
verifying the role exists in `app_role` (see security-audit report for drift).

## Constraints

- **Never run in production.** The script aborts when `ENVIRONMENT=production`.
- **Idempotent.** Re-runs reset passwords and re-upsert role assignments.
- **No future roles.** Only seeds roles present in the current `app_role` enum.
- **Single role per user.** Multi-role users are tested separately in
  `role-redirect.spec.ts` via role priority logic.

## Local usage

```bash
export SUPABASE_URL=…
export SUPABASE_SERVICE_ROLE_KEY=…
export TEST_FIXTURE_PASSWORD=…
node scripts/seed-test-users.mjs
TEST_FIXTURE_PASSWORD=$TEST_FIXTURE_PASSWORD bunx playwright test
```

## CI usage

Seed runs after migrations apply, before Playwright. See
`.github/workflows/launch-readiness.yml`.
