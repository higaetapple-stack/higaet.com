# Sprint 2D — HIGAET Academy Admin CMS

Build the internal content-authoring system so admins create programs, courses, lessons, and faculty assignments through the UI — no direct DB editing. This is the foundation Sprint 2B (student LMS) will consume.

## Scope (in)

- Admin-only CRUD for Programs, Courses, Lessons
- Faculty management + `course_faculty` many-to-many join table
- Students directory (read + role assignment, no auth admin actions beyond role grants)
- Assignments authoring (CRUD; submissions/grading deferred to 2C)
- Certificates templates (CRUD only; issuance deferred to 2C)
- Future-ready category enum covering all HIGAET tracks
- HIGAET Control Center navigation shell with "Coming Soon" sections for Global Education Hub, Technologies, Placements, Community, AI Services

## Scope (out — deferred)

- Student-facing LMS player, progress tracking, enrollment flow → Sprint 2B
- Submission grading, certificate issuance/PDF → Sprint 2C
- Career portal, community, mentorship → Sprint 3
- Migrating marketing pages off static `academy-programs.ts` (admin CMS becomes source of truth for LMS; marketing pages stay static until explicitly cut over)

## Database changes (one migration)

1. **`program_category` enum** — `ai_engineering`, `gen_ai`, `ai_agents`, `ai_automation`, `prompt_engineering`, `fullstack_ai`, `data_science`, `cyber_security`, `cloud_computing`, `study_abroad`, `corporate_training`. Migrate existing `programs.category` (text) to this enum.
2. **`programs`** — add `thumbnail_url`, `featured boolean default false`, `status` enum (`draft|published|archived`) if not present; ensure `slug` unique.
3. **`courses`** — ensure `order_index`, `status` (`draft|published|archived`), FK to `programs`.
4. **`lessons`** — ensure `video_url`, `content` (markdown), `duration_minutes`, `resources jsonb`, `order_index`, `preview boolean default false`.
5. **`course_faculty`** (NEW) — `id, course_id (fk courses on delete cascade), faculty_id (fk auth.users on delete cascade), created_at`, unique `(course_id, faculty_id)`.
6. **`assignments`** — confirm authoring fields (`title, description, due_at, max_score, course_id, lesson_id nullable`).
7. **`certificate_templates`** (NEW, optional minimal) — `id, program_id, name, template_html, created_at, updated_at`.
8. **GRANTs**: every new/changed table — `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated; GRANT ALL ... TO service_role;` No `anon`.
9. **RLS**:
   - Programs/Courses/Lessons/Assignments/Certificate templates: `SELECT` for `authenticated` (students read published; admins read all via `has_role`). `INSERT/UPDATE/DELETE` restricted to `admin` / `super_admin` via `has_role`.
   - `course_faculty`: admin full; faculty `SELECT` own rows.
   - Existing `user_roles` policies untouched; admin role grants via dedicated server fn (re-uses `has_role` check).

## Server functions (`src/lib/admin.functions.ts`)

All guarded with `requireSupabaseAuth` + `has_role(userId, 'admin')` check inside handler.

- `listPrograms`, `getProgram`, `createProgram`, `updateProgram`, `deleteProgram`, `setProgramStatus`
- `listCourses(programId)`, `createCourse`, `updateCourse`, `deleteCourse`, `reorderCourses`
- `listLessons(courseId)`, `createLesson`, `updateLesson`, `deleteLesson`, `reorderLessons`
- `listFaculty`, `assignFaculty(courseId, facultyId)`, `unassignFaculty(courseId, facultyId)`
- `listStudents`, `grantRole(userId, role)`, `revokeRole(userId, role)`
- `listAssignments(courseId)`, `createAssignment`, `updateAssignment`, `deleteAssignment`

## Routes (under `_authenticated/dashboard/admin/`)

```text
/dashboard/admin                         → overview
/dashboard/admin/programs                → list + create
/dashboard/admin/programs/$id            → edit (with nested Courses tab)
/dashboard/admin/programs/$id/courses/$courseId  → courses edit + Lessons + Faculty tabs
/dashboard/admin/lessons/$id             → lesson editor (deep link)
/dashboard/admin/faculty                 → faculty directory + course assignments
/dashboard/admin/students                → student list + role management
/dashboard/admin/assignments             → assignments across courses
/dashboard/admin/certificates            → templates
/dashboard/admin/settings                → general
```

Plus disabled/"Coming Soon" nav entries: Global Education Hub, Technologies, Placements, Community, AI Services.

## UI

- Reuse shadcn `Table`, `Dialog`, `Form`, `Tabs`, `Sheet`, `Badge`.
- Sidebar updated: `RoleSidebar` adds an "Academy CMS" group (admin-only) + "Control Center" group with disabled items.
- Forms: `react-hook-form` + `zod`, mutations via `@tanstack/react-query` + `useServerFn`, optimistic invalidation.
- Drag-handle reorder for courses/lessons (simple up/down buttons first; dnd-kit later if needed).

## Approval gates

1. **Migration** (single call): enum + column adds + `course_faculty` + `certificate_templates` + GRANTs + RLS policies.
2. After approval: write server fns + routes + UI in parallel batches.

## Technical notes

- Admin checks live server-side in every handler (`has_role`). UI gating is cosmetic.
- `course_faculty.faculty_id` references `auth.users(id)`; faculty must already have `faculty` role in `user_roles` — `assignFaculty` validates that.
- Category enum migration uses `ALTER COLUMN ... TYPE program_category USING category::program_category` with a pre-update mapping any legacy text values.
- No changes to marketing pages, no changes to `src/integrations/supabase/*` auto-gen files.

## Acceptance

- Admin can sign in, create a Program → add Courses → add Lessons → assign Faculty entirely through UI.
- Non-admins receive 403 from every admin server fn.
- New tables visible in `supabase/types.ts` after migration; build green.
- Sprint 2B can read the same tables to render the student LMS without further schema work.
