# Sprint 2B — HIGAET Academy LMS Delivery Layer

Connect authored content (Sprint 2D) to students. Build enrollment, the lesson player, and progress tracking. Assignments/submissions/certificates issuance stay in Sprint 2C, but UI placeholders go in now.

## Scope (in)

- **Student "My Programs"** at `/dashboard/programs` (replaces stub)
- **Program detail** at `/dashboard/programs/$slug` — curriculum, faculty, progress, certificate status
- **Course detail** at `/dashboard/courses/$courseId` — lesson list + progress
- **Lesson player** at `/dashboard/lessons/$lessonId` — video, markdown, resources, Mark Complete
- **Progress engine** — server fn `markLessonComplete` + computed course/program percentage
- **Dashboard home upgrade** — Continue Learning, Quick Stats, Recent Activity
- **Admin enrollment** — `/dashboard/admin/enrollments` page; enroll a student in a program; list enrollments
- **Faculty cards** on program/course pages (uses `course_faculty` + profiles)
- **Sidebar**: add "My courses" under student items

## Scope (out — deferred)

- Self-serve student enrollment / payments → after pricing decision
- Assignment submission & grading → 2C (UI placeholder only)
- Certificate generation/issuance (PDF, signing) → 2C (eligibility flag only)
- Discussions, AI tutor, notes, bookmarks → Sprint 3
- Lesson reordering UX beyond what 2D already supports

## Server functions (`src/lib/learn.functions.ts`)

All `requireSupabaseAuth`; scoped to `context.userId` via RLS (no admin assert).

- `getMyPrograms()` → programs the student is enrolled in + computed progress
- `getProgramDetail({ slug })` → program + courses + lessons (titles/order/preview) + faculty per course + my progress + certificate eligibility
- `getCourseDetail({ id })` → course + lessons + my completed lesson ids + faculty
- `getLesson({ id })` → lesson + sibling navigation (prev/next ids) + enrollment check + completed flag
- `markLessonComplete({ lessonId })` → upsert into `progress`; idempotent
- `getDashboardSummary()` → continue-learning card, counts (enrolled, completed lessons, certs earned, assignments pending), recent activity (last 5 progress rows)

Admin enrollment (admin-gated):

- `adminListEnrollments({ programId? })`
- `adminEnrollStudent({ userId, programId })`
- `adminUnenroll({ enrollmentId })`

Progress math is computed in JS from `progress` rows vs lesson counts — no schema change.

## Routes

```text
src/routes/
  _authenticated.dashboard.programs.tsx              (REPLACE stub: list "My Programs")
  _authenticated.dashboard.programs.$slug.tsx        (NEW: program detail w/ tabs)
  _authenticated.dashboard.courses.$courseId.tsx     (NEW: course detail)
  _authenticated.dashboard.lessons.$lessonId.tsx     (NEW: lesson player)
  _authenticated.dashboard.index.tsx                 (UPGRADE: continue-learning + stats)
  _authenticated.dashboard.admin.enrollments.tsx     (NEW: admin enroll students)
```

Add "Enrollments" tab to the admin layout TABS list.

## Components (`src/components/lms/`)

- `ProgramCard.tsx` — thumbnail, title, % progress, Continue button
- `CurriculumList.tsx` — courses → lessons accordion with completion ticks
- `LessonPlayer.tsx` — `<video>` (or iframe for YT/Vimeo URLs) + markdown content
- `FacultyCard.tsx` — avatar, full_name, headline
- `ProgressBar.tsx` — thin academy-themed bar
- `MarkCompleteButton.tsx` — calls mutation + invalidates queries
- `LessonNav.tsx` — prev/next links

Markdown rendering: use `react-markdown` (add via `bun add react-markdown`). No raw HTML.

## Dashboard home

Replace existing overview with three sections:

- **Continue learning** — top program (highest recent progress) with deep-link to its next incomplete lesson
- **Quick stats** — 4 KPI tiles
- **Recent activity** — last 5 `progress` rows mapped to lesson/course titles

Falls back to "Browse programs" CTA when not enrolled.

## RLS sanity check (no migration required)

Existing policies already cover this Sprint:
- `enrollments` — student reads own; admin full
- `lessons` / `assignments` / `courses` / `programs` — student reads via enrollment + published status
- `progress` — student manages own (verify policy exists; if not, add in a tiny migration)

Will run `\d public.progress` first; if write policy is missing, ship a one-statement migration that adds `INSERT/UPDATE` for `auth.uid() = student_id`.

## Acceptance

- Admin can enroll a test student in a program.
- That student sees the program at `/dashboard/programs`, can drill into curriculum, open a lesson, click Mark Complete, and see progress % update.
- Dashboard overview shows Continue Learning pointing at the next incomplete lesson.
- Faculty cards appear on program and course pages.
- Build green; no marketing pages touched.
