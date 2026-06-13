# Sprint 3A.1 — QA Checklist

Manual validation of the full HIGAET Academy pipeline before moving to Sprint 4 (Global Education Hub).

## Journey 1 — Student: Register → Apply

- [ ] Sign up via email / Google; profile + `student` role auto-created (trigger `handle_new_user`).
- [ ] `/auth` redirect on hard refresh of any `/dashboard/*` route works (no loop, no flash).
- [ ] Enroll in a published program from `/academy/programs/$slug`.
- [ ] Open a lesson, complete it; progress row created, progress % updates.
- [ ] Submit an assignment; appears in `/dashboard/faculty/submissions` for graders.
- [ ] Faculty grades → status `passed`; student sees feedback in `/dashboard/assignments`.
- [ ] After all required lessons + assignments pass, certificate auto-issues (`tryAutoIssueAfterLesson` / `is_program_eligible`).
- [ ] `/dashboard/certificates` lists the certificate; `/verify-certificate/$id` works anonymously.
- [ ] Edit `/dashboard/career/profile`: bio, skills, links, education, experience save.
- [ ] `/dashboard/career/portfolio`: set visibility to `public`, slug auto-generated.
- [ ] `/portfolio/$slug` renders anonymously with correct privacy toggles (email/phone hidden when off).
- [ ] `/dashboard/career/resume` renders both templates, print preview is clean.
- [ ] Browse `/jobs`, open `/jobs/$slug`, save to `/dashboard/career/saved`, apply.
- [ ] Application appears in `/dashboard/career/applications`.

## Journey 2 — Admin: Employer → Job → Application → Placement

- [ ] `/dashboard/admin/employers` create + edit + verify employer.
- [ ] `/dashboard/admin/jobs` create job linked to employer, status `open`, sets `posted_at`.
- [ ] Job is visible on public `/jobs` board with correct filters.
- [ ] Student application appears in `/dashboard/admin/applications`; admin can change status.
- [ ] `/dashboard/admin/placements` create placement for the student; verify checkbox flips it to verified.
- [ ] Verified placement shows on public `/success-stories` under "Placement highlights".
- [ ] `/dashboard/admin/stories` mark a profile as featured + add summary + priority.
- [ ] Featured profile appears first on `/success-stories`.

## Auth & RLS

- [ ] Anonymous user cannot read `placements`, `submissions`, `job_applications`, `saved_jobs`, `enrollments`, `progress`, `user_roles`.
- [ ] Student cannot read another student's placements / submissions / applications.
- [ ] Student cannot toggle `featured_success_story` on their own profile (admin-only field via admin RPC).
- [ ] Non-admin signed-in user calling any `admin*` server function gets `Forbidden`.
- [ ] Faculty without `course_faculty` row cannot grade submissions for that course.

## Analytics

- [ ] `/dashboard/admin/analytics` loads all sections (Academy, Engagement, Career, Placements).
- [ ] Counts match `psql` spot-checks for students, enrollments, certificates, jobs, applications, placements.
- [ ] `applications_per_job` divides by **open** jobs only.

## Public pages SEO

- [ ] `/success-stories`, `/jobs`, `/portfolio/$slug`, `/verify-certificate/$id` each have distinct `<title>` and OG tags.
- [ ] No `noindex` on these pages.

## Performance

- [ ] Admin analytics returns under ~1.5s on dev (Promise.all parallelization).
- [ ] `/jobs` filters do not refetch on each keystroke unless debounced.

## Known gaps to address in Sprint 4

- No `leads` table → admissions KPIs (leads, conversion rate) deferred until admissions intake form persists data.
- No interview tracker, employer self-serve, skills matrix, or career scoring — out of scope for 3A.1.
