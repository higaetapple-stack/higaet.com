# Sprint 2 — LMS + Dashboard Foundation

Build the platform core that Sprints 2B–2D and all of Sprint 3+ depend on. Ship **Sprint 2A in this iteration**; lock the schema shape for the rest now so later sprints don't require migrations.

## Scope of this turn (Sprint 2A only)

1. **Auth** — email/password + Google sign-in via Lovable broker. No anonymous signups. No auto-confirm. HIBP password check on.
2. **Roles** — `app_role` enum + `user_roles` table + `has_role()` security-definer (mandatory per project standards — roles never live on `profiles`).
3. **Profiles** — `profiles` table auto-populated on signup via trigger.
4. **Dashboard shell** — `/dashboard` (student), `/dashboard/faculty`, `/dashboard/counselor`, `/dashboard/admin` under `_authenticated/` (managed gate). Sidebar varies by role; each role lands on its own page.
5. **Sign-in/up UI** — `/auth` route with email + Google.
6. **Reusable shells** — `DashboardLayout`, `RoleSidebar`, `DashboardHeader`. LMS content components (`LessonPlayer`, `AssignmentCard`, …) deferred to 2B/2C.

Sprints 2B (LMS content), 2C (assignments/certificates), 2D (admin CRUD) follow in dedicated turns.

## Roles

Enum `app_role`: `student`, `faculty`, `mentor`, `counselor`, `placement_officer`, `enterprise_client`, `admin`, `super_admin`.

Default role on signup = `student`. Admin/staff roles assigned manually via admin tools (Sprint 2D) or seeded for the first super-admin.

## Database schema — full Sprint 2 surface (created now)

Tables created in this migration (Sprint 2A uses 1–3; 4–8 are reserved with full schema + RLS so 2B/2C don't need destructive migrations later):

1. **`profiles`** — id (FK auth.users), email, full_name, phone, avatar_url, headline, timestamps
2. **`user_roles`** — user_id, role, granted_by, timestamps (unique on user_id+role)
3. **`programs`** — id, slug, title, category, level, format, duration, fee_inr, description, status (`draft|published|archived`), timestamps. *Source of truth: replaces today's static `academy-programs.ts` for any data the LMS needs. Marketing pages can keep reading static data until 2D.*
4. **`courses`** — id, program_id (FK), slug, title, description, order_no, timestamps
5. **`lessons`** — id, course_id (FK), title, lesson_type (`video|reading|lab|quiz`), video_url, content_md, duration_min, order_no, timestamps
6. **`enrollments`** — id, student_id (FK profiles), program_id (FK), status (`active|paused|completed|withdrawn`), enrolled_at, timestamps
7. **`progress`** — id, student_id, lesson_id, completed, completed_at (unique on student+lesson)
8. **`assignments`** — id, course_id, title, description, due_date, max_score, timestamps
9. **`submissions`** — id, assignment_id, student_id, file_url, content, score, feedback, submitted_at, graded_at
10. **`certificates`** — id, student_id, program_id, certificate_url, certificate_number, issued_at

Future-sprint tables are NOT created now (job_postings, placements, community_*, etc.) — they need their own design round and shouldn't bloat the initial migration.

## RLS policy plan

Every table: RLS ON, `GRANT` to `authenticated` + `service_role`, no `anon`.

| Table | student | faculty/mentor | counselor | admin |
|---|---|---|---|---|
| profiles | self read/update | read all | read all | full |
| user_roles | read own | read own | read own | full |
| programs | read published | read published | read published | full |
| courses | read if enrolled OR published-program | read assigned | read all | full |
| lessons | read if enrolled in parent program | read assigned | read all | full |
| enrollments | read/insert own | read assigned students | read all | full |
| progress | full own | read assigned students | — | full |
| assignments | read if enrolled | full on assigned course | — | full |
| submissions | full own | read + grade assigned | — | full |
| certificates | read own | read assigned | — | full |

All admin gates use `has_role(auth.uid(), 'admin')` or `super_admin` to avoid recursive policies. Faculty assignment uses a `course_faculty` join table (created in 2B).

## Route architecture

```text
src/routes/
  auth.tsx                          (already exists — wire Google + email)
  _authenticated/
    route.tsx                       (integration-managed; do not author)
    dashboard.tsx                   (layout: role-aware sidebar + <Outlet />)
    dashboard.index.tsx             (student overview — default home)
    dashboard.profile.tsx
    dashboard.programs.tsx          (my enrollments — stub in 2A)
    dashboard.courses.tsx           (stub in 2A)
    dashboard.faculty.index.tsx
    dashboard.counselor.index.tsx
    dashboard.admin.index.tsx
```

Role-based redirect on `/dashboard`: student → overview; faculty → `/dashboard/faculty`; counselor → `/dashboard/counselor`; admin → `/dashboard/admin`. Done in the dashboard layout `beforeLoad` (client-side, calls a `getMyRoles` server fn).

## Server functions (Sprint 2A)

In `src/lib/`:
- `auth.functions.ts` — `getMyProfile`, `getMyRoles`, `updateMyProfile` (all `requireSupabaseAuth`)
- `enrollments.functions.ts` — `getMyEnrollments` stub returning `[]` until 2B seeds data

No admin/service-role server fns this turn — all reads are user-scoped.

## Components (Sprint 2A)

`src/components/dashboard/`:
- `DashboardLayout.tsx` — header + role sidebar + outlet container
- `RoleSidebar.tsx` — nav items computed from roles
- `DashboardHeader.tsx` — logo, user menu, sign out (uses sign-out hygiene pattern)
- `RoleBadge.tsx`

LMS content components (`LessonPlayer`, `ProgressBar`, `AssignmentCard`, `CertificateCard`) deferred to the sprint that needs them — building empty shells now leads to throwaway work.

## Decisions locked in

- Roles in separate `user_roles` table (never on profiles).
- `has_role()` security definer for all admin checks.
- Sign-in: email/password + Google (broker). No GitHub/Facebook.
- HIBP password check ON, auto-confirm OFF, anonymous signups OFF.
- Programs become DB-backed; marketing pages keep static data until admin CRUD (2D) is live, then migrate.
- All 10 tables created in one migration so 2B/2C only seed data + add policies for the join table `course_faculty`.

## Out of scope (this turn)

LMS player UI · assignment grading UI · certificate generation · admin CRUD · course_faculty assignment table (2B) · job board / community / AI tutor (Sprint 3+) · marketing-page migration from static data.

## Approval gates

Two tools will request explicit approval as I execute:
1. `supabase--configure_social_auth` (Google) + `supabase--configure_auth` (HIBP/signup settings)
2. `supabase--migration` for the full 10-table schema + RLS + grants + signup trigger

Approve those and I'll wire the dashboard, server fns, sign-in UI, and role-based routing in the same turn.
