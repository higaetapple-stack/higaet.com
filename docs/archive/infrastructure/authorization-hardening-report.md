# HIGAET Authorization Hardening Report

**Date:** 2026-06-23
**Scope:** Sub-route role authorization for `/dashboard/*`. No schema migrations, no new dashboard routes, no enum changes.

---

## 1. Architecture

Authorization is now enforced at **three layers**:

1. **Authentication gate** — `src/routes/_authenticated/route.tsx` (integration-managed). Redirects unauthenticated users to `/auth`.
2. **Route-level role gate** — `beforeLoad: requireRolesOrRedirect(...)` on each dashboard layout route. Runs before loaders or component render; throws `redirect({ to: "/dashboard" })` for unauthorized roles. Server-fn call goes through `requireSupabaseAuth` middleware.
3. **Server-side RLS + `has_role(uid, role)`** — every privileged server function and table policy independently re-checks the caller's role. Client-side guards are defense-in-depth; the database is the source of truth.

```
Request → _authenticated (session) → dashboard.<role> (beforeLoad role check) → loader (requireSupabaseAuth + RLS) → component
                                                                                                ↑
                                                                            RoleGuard components hide UI affordances
```

## 2. Route Permission Matrix

Source: `src/lib/route-authorization.ts` → `ROUTE_PERMISSIONS`.
`admin` and `super_admin` implicitly bypass every check.

| Route prefix              | Allowed roles                                              | Layout file                                          |
| ------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| `/dashboard/admin/*`      | `admin`, `super_admin`                                     | `_authenticated.dashboard.admin.tsx`                 |
| `/dashboard/faculty/*`    | `faculty` + admins                                         | `_authenticated.dashboard.faculty.tsx`               |
| `/dashboard/counselor/*`  | `counselor`, `mentor` + admins                             | `_authenticated.dashboard.counselor.tsx`             |
| `/dashboard/career/*`     | `student`, `placement_officer` + admins                    | `_authenticated.dashboard.career.tsx`                |
| `/dashboard/education/*`  | `enterprise_client` + admins                               | *(no layout yet — alias only)*                       |
| `/dashboard/technologies/*` | `tech_client` + admins                                   | `_authenticated.dashboard.technologies.tsx`          |
| `/dashboard` (root)       | any authenticated user (forwards via `dashboardForRoles`)  | `_authenticated.dashboard.index.tsx`                 |

## 3. Components Introduced

| Module                              | Purpose                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/lib/route-authorization.ts`    | `ROUTE_PERMISSIONS` matrix, `allowedRolesForPath`, `hasAnyRole`, `requireRolesOrRedirect`         |
| `src/components/auth/RoleGuard.tsx` | `<RequireAuth>`, `<RequireRole>`, `<RequireAnyRole>` for inline UI gating (buttons, panels, etc.) |

`requireRolesOrRedirect` is the single authoritative client-side check; every dashboard layout's `beforeLoad` delegates to it so the matrix cannot drift from individual route files.

## 4. Audit Findings

| Finding                                                                                                              | Severity | Status                                                                                  |
| -------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| `/dashboard/counselor`, `/dashboard/faculty`, `/dashboard/technologies`, `/dashboard/career` had no `beforeLoad` role check — a student could load the counselor UI even though server fns would 403 the data | High     | **Fixed** — `beforeLoad` added on all four layouts                                       |
| `/dashboard/admin` role check duplicated inline logic; risked drift from sibling layouts                             | Medium   | **Fixed** — now reads from `ROUTE_PERMISSIONS`                                          |
| `/dashboard/education` listed in role-routing but no layout route exists                                             | Low      | Documented; entry kept in matrix for when the layout is built                           |
| RLS coverage on `user_roles`, `profiles`, business tables                                                            | —        | **Confirmed** — `has_role` SECURITY DEFINER, `user_roles` policies scoped to `auth.uid()` (unchanged) |
| Server functions accessed via `requireSupabaseAuth` re-check role where needed                                       | —        | **Confirmed** — no client-only authorization paths discovered                            |

## 5. Remaining Launch Blockers (non-authorization)

These are out-of-scope for this sprint but block production:

- Domain configuration & DNS for `higaet-core-engine` apex domain
- Transactional email (verification, password reset) sender verification
- Razorpay live-mode keys + webhook signature secret rotation
- Daily DB backup verification + restore drill
- Error tracking (Sentry or equivalent) wired into root error boundary
- Smoke-test pass on: register → login → role redirect → protected dashboard → logout (desktop + mobile)

## 6. Explicitly Deferred

- New dashboard routes (`/mentor`, `/placement`, `/enterprise`, `/tech`, `/super-admin`) — existing aliases sufficient.
- Onboarding wizard + `first_login` flag — requires schema migration.
- `app_role` enum extension — current 9 roles cover every implemented surface.

---

**Status:** Authorization layer is feature-complete for the current role set. Further authorization work is gated on real staging traffic or new dashboard surfaces.
