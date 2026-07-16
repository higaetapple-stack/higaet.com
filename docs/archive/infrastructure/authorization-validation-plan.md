# Authorization Validation & Observability — Plan

**Date:** 2026-06-23
**Status:** Priority 1 shipped in code; Priorities 2–4 scaffolded here (require infra/secrets to activate).

---

## P1 — Unauthorized UX (✅ shipped)

| Change                                                                                | File                                  |
| ------------------------------------------------------------------------------------- | ------------------------------------- |
| Dedicated 403 page with role context, requested route, recovery actions               | `src/routes/403.tsx`                  |
| `requireRolesOrRedirect` now distinguishes guest vs forbidden                          | `src/lib/route-authorization.ts`      |
| All dashboard layout `beforeLoad` calls pass `location` so the 403 page knows context | `src/routes/_authenticated.dashboard.{admin,counselor,faculty,career,technologies}.tsx` |

Behavior matrix:

| Caller                  | Route                | Result                                                     |
| ----------------------- | -------------------- | ---------------------------------------------------------- |
| Guest                   | `/dashboard/admin`   | `/auth/login?redirect=/dashboard/admin`                    |
| Authed (wrong role)     | `/dashboard/admin`   | `/403?from=/dashboard/admin&required=admin,super_admin`    |
| Authed (correct role)   | `/dashboard/admin`   | Render                                                     |

---

## P2 — End-to-End Authorization Tests (scaffolded)

Coverage target (one allow + one deny per guarded route):

```
guest    → /dashboard/admin         → 302 /auth/login?redirect=…
guest    → /dashboard/faculty       → 302 /auth/login?redirect=…
student  → /dashboard/admin         → /403
student  → /dashboard/faculty       → /403
student  → /dashboard/counselor     → /403
faculty  → /dashboard/faculty       → 200
faculty  → /dashboard/admin         → /403
counselor→ /dashboard/counselor     → 200
admin    → /dashboard/admin         → 200
admin    → /dashboard/anything      → 200
```

Activation steps:

1. Provision per-role test users in a dedicated `e2e-fixtures` Supabase environment (NOT production). Store credentials only as CI secrets.
2. Add Playwright as a dev dependency, then create `tests/e2e/authorization.spec.ts` using the matrix above and `page.goto(route)` + URL/heading assertions.
3. Wire a CI job: `bunx playwright test tests/e2e/authorization.spec.ts` against a preview deployment.

We have deliberately NOT committed test users or seed scripts — those require live infra and would otherwise leak credentials into the repo.

---

## P3 — Monitoring & Error Tracking (scaffolded)

Activation requires a `SENTRY_DSN` secret. Once set:

1. `bun add @sentry/react`
2. Initialize in `src/router.tsx` before `createRouter` with `tracesSampleRate: 0.1`, env tag from `import.meta.env.MODE`.
3. Emit structured breadcrumbs from these call sites — module + event name listed for grep-ability:

| Event                  | Emit from                                       |
| ---------------------- | ----------------------------------------------- |
| `AUTH_LOGIN_FAILED`    | `auth.login.tsx` form-submit catch              |
| `AUTH_SESSION_EXPIRED` | `useAuth.ts` `onAuthStateChange('TOKEN_REFRESHED'\|'SIGNED_OUT')` |
| `AUTH_LOGOUT`          | `lib/sign-out.ts`                               |
| `AUTH_FORBIDDEN`       | `route-authorization.ts` 403 redirect branch    |
| `AUTH_ROLE_MISMATCH`   | Same as above, with `required` vs `actual` tags |
| `AUTH_REDIRECT_GUARD`  | `route-authorization.ts` login redirect branch  |

Tags on every event: `route`, `role`, `guard_name`, `environment`.

Alert rules (Sentry → Slack):

| Condition                                          | Severity |
| -------------------------------------------------- | -------- |
| 401 rate > 10 / min sustained 5 min                | warn     |
| 403 rate > 5 / min sustained 5 min                 | warn     |
| `AUTH_REDIRECT_GUARD` rate > 20 / min              | warn     |
| `AUTH_LOGIN_FAILED` > 30 / min                     | critical |

---

## P4 — RLS vs ROUTE_PERMISSIONS Consistency (initial report)

See `docs/infrastructure/rls-route-consistency-report.md` for the current findings.

CI integration:

1. Script `scripts/audit-rls-consistency.ts` (to be added) queries `pg_policies` and cross-references `ROUTE_PERMISSIONS` from `src/lib/route-authorization.ts`.
2. Fails the build when a guarded route's tables have either no RLS policies or policies that grant strictly broader role coverage than the route.
3. Regenerates the report into `docs/infrastructure/rls-route-consistency-report.md` so drift is visible in PRs.

The script is deferred until we have a stable list of route↔table mappings; see report section "Open work".

---

## Remaining security gaps before production launch

- E2E test suite not yet running in CI (needs fixture users).
- Sentry not yet wired (needs DSN secret).
- RLS audit script not yet generating CI-checkable output.
- Rate limiting on `/auth/login` and password-reset endpoints (Supabase Auth defaults are weak).
- Account lockout / suspicious-IP tracking.
- Admin action audit log (separate `admin_audit` table — schema change, intentionally deferred).
