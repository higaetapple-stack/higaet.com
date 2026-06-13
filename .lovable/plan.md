# Sprint 2C — Academic Operations

Completes the learning lifecycle: Enroll → Learn → Submit → Grade → Certify → Showcase.

## Scope

### Module 1 — Assignment Submission (Student)
- `/dashboard/assignments` — list pending/submitted with due dates, status, grades.
- `/dashboard/assignments/$id` — read instructions, submit text + file URL + external URL (GitHub/Portfolio), resubmit while status = pending/needs_revision, view feedback + score.
- Submission types stored as `submission_type` enum: `file | github | portfolio | text | mixed`. Files uploaded to a new private `submissions` storage bucket; row stores object path.

### Module 2 — Faculty Grading Portal
- `/dashboard/faculty/submissions` — filter by course/assignment/status; row actions: view, grade (0–100), feedback, mark passed/failed/needs_revision.
- Server fn `gradeSubmission` writes `score`, `status`, `feedback`, `graded_by`, `graded_at`; gated to faculty assigned to the course (via `course_faculty`) or admin.

### Module 3 — Certificate Engine
- Eligibility helper (`isProgramEligible(programId, studentId)`): 100% lessons complete in all program courses AND all `is_required` assignments in those courses have a `passed` submission.
- Server fn `issueCertificate` (admin/faculty or auto on completion): generates `certificate_number` (HIGAET-YYYY-XXXXXX), `verification_hash` (sha256 of number+student+program+date), stores in `certificates`.
- Auto-issue trigger: after `markLessonComplete` and after `gradeSubmission(passed)`, check eligibility and insert certificate if missing.
- Public route `/verify-certificate/$id` (server route under `/api/public/` for data, page route for UI): shows student name, program, issue date, certificate number, verification status. No auth.
- Student certificate page `/dashboard/certificates` — list + download (HTML→print view at `/dashboard/certificates/$id`).

### Module 4 — Achievement Widgets
- Extend dashboard summary: certificates earned, assignments completed, average score, projects completed.

### Module 5 — Capstone Projects
- New tables `projects` (program-scoped: title, brief, guidelines, due_at) and `project_submissions` (student_id, project_id, repo_url, demo_url, summary, status, score, feedback, graded_by, graded_at).
- Admin CRUD under `/dashboard/admin/projects`. Student view `/dashboard/projects` + detail.

### Module 6 — Program Completion Status
- Derived enum on enrollment cards: `not_started | in_progress | completed | certified` from progress + certificate row.
- Show on `/dashboard/programs` and program detail.

### Admin Enhancements
- `/dashboard/admin/certificates` (already exists for templates) → add issuance + revocation tab.
- `/dashboard/admin/analytics` — counts: enrollments, active students (progress in last 30d), submissions, completion rate, certificates issued.

## Technical Plan

### Migration (single)
1. Enums: `submission_status` (`pending`, `reviewed`, `passed`, `failed`, `needs_revision`), `submission_type`, `project_status`.
2. Alter `assignments`: add `is_required boolean default true`.
3. Alter `submissions`: add `submission_type`, `file_path text`, `external_url text`, `text_response text`, `feedback text`, `graded_by uuid`, `graded_at timestamptz`; ensure `status` uses new enum.
4. Alter `certificates`: add `certificate_number text unique`, `verification_hash text`, `issued_by uuid`, `issue_date date default current_date`, `revoked boolean default false`, `revoked_at timestamptz`.
5. Create `projects` + `project_submissions` with GRANTs + RLS.
6. RLS policies:
   - submissions: student CRUD own (insert/update while not finalized); faculty assigned to course can SELECT + UPDATE grading fields; admin all.
   - certificates: student SELECT own; public SELECT by `certificate_number` (anon allowed only via SECURITY DEFINER fn — keep table policy authenticated, expose `verify_certificate(_number text)` RPC `security definer`).
   - projects: authenticated SELECT for enrolled students + faculty/admin; admin write.
7. Storage: private bucket `submissions` via `storage_create_bucket`; RLS on `storage.objects` so student writes/reads own folder `{user_id}/...`, faculty reads any in their courses (simplest: faculty+admin read all).

### Server Functions (`src/lib/academic.functions.ts`)
- Student: `listMyAssignments`, `getAssignment`, `submitAssignment`, `listMyCertificates`, `getMyAchievementStats`, `listMyProjects`, `submitProject`.
- Faculty: `listSubmissionsToGrade`, `gradeSubmission`, `listProjectsToReview`, `gradeProjectSubmission`.
- Admin: `adminIssueCertificate`, `adminRevokeCertificate`, `adminListAnalytics`, `adminListProjects`, `adminCreateProject`, `adminUpdateProject`, `adminDeleteProject`.
- Public RPC wrapper: `verifyCertificate({ number })` — calls `public.verify_certificate` (no auth middleware).
- Helper: `checkAndIssueCertificate(programId, studentId)` invoked from `markLessonComplete` and `gradeSubmission`.

### Routes
- `_authenticated.dashboard.assignments.index.tsx`
- `_authenticated.dashboard.assignments.$assignmentId.tsx`
- `_authenticated.dashboard.faculty.submissions.tsx`
- `_authenticated.dashboard.certificates.index.tsx`
- `_authenticated.dashboard.certificates.$id.tsx` (printable)
- `_authenticated.dashboard.projects.index.tsx` + `.$id.tsx`
- `_authenticated.dashboard.admin.projects.tsx`
- `_authenticated.dashboard.admin.analytics.tsx`
- `_authenticated.dashboard.admin.certificates.tsx` — extend with issuance/revocation tab
- Public: `verify-certificate.$id.tsx`

### Out of scope (deferred)
- PDF certificate generation (use printable HTML for now; PDF in Sprint 3 if needed).
- Rubric builder UI (free-text feedback only).
- Plagiarism / AI-detection.
- Self-serve enrollment + payments.

## Execution order
1. Migration (approval gate) → types regen.
2. Storage bucket + storage RLS.
3. Server functions file.
4. Student assignment UI + faculty grading UI.
5. Certificate engine + public verification page.
6. Projects (admin + student).
7. Achievement widgets + admin analytics.

Proceed?
