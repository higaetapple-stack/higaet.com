
# Sprint 3A — Career Portal

Pipeline: Profile → Resume → Public Portfolio → Job Board → Apply. Admin-managed employer module (no employer auth yet). Defer interview tracker, placement records, employer self-serve to 3A.2.

## 1. Database migration (single approval)

### Profile additions (career & portfolio)
Alter `public.profiles` add:
- `bio text`
- `location text`
- `github_url text`, `linkedin_url text`, `website_url text`
- `skills text[]` default `{}`
- `career_goals text`
- `education jsonb` default `'[]'` (array of `{school, degree, field, start, end}`)
- `experience jsonb` default `'[]'` (array of `{company, title, start, end, summary}`)
- `portfolio_slug citext unique` (nullable until student claims it)
- `portfolio_visibility` enum: `private | unlisted | public` default `private`
- privacy toggles: `show_email`, `show_phone`, `show_resume`, `show_certificates`, `show_projects` (boolean, defaults set sensibly)

New enum `portfolio_visibility`. Slug validation via trigger (lowercase, `[a-z0-9-]{3,40}`).

Public read access for portfolio: add policy `profiles public portfolio read` on `profiles` FOR SELECT TO anon, authenticated USING `portfolio_visibility = 'public'` — but server fn will project only safe fields. (Anon grant required on `profiles` for SELECT — scoped via policy.)

### New tables

**employers** — admin-curated company directory.
Fields: `name`, `slug` (unique), `website`, `logo_url`, `description`, `industry`, `hq_location`, `size`, `verified bool`, `created_by uuid`.
Policies: anon SELECT (public), admin write.

**job_postings**
Fields: `employer_id`, `title`, `slug` (unique), `description`, `requirements`, `responsibilities`, `location`, `remote_type` enum (`onsite|hybrid|remote`), `employment_type` enum (`full_time|part_time|contract|internship`), `experience_level` enum (`entry|mid|senior`), `salary_min`, `salary_max`, `salary_currency` default `INR`, `skills text[]`, `apply_url text` (optional external), `status` enum (`draft|open|closed|archived`) default `draft`, `posted_at`, `closes_at`, `created_by`.
Policies: anon SELECT where `status='open'`; admin all.

**job_applications**
Fields: `job_id`, `student_id`, `resume_snapshot jsonb`, `cover_letter text`, `portfolio_url text`, `status` enum (`submitted|under_review|shortlisted|rejected|withdrawn`) default `submitted`, `applied_at`, `notes` (admin only).
Unique `(job_id, student_id)`.
Policies: student insert+select own, admin all. Faculty/placement_officer read-only.

**saved_jobs**
Fields: `student_id`, `job_id`, `saved_at`. Unique `(student_id, job_id)`.
Policies: student manage own.

All tables: GRANTs, RLS, `updated_at` trigger where applicable. Service role full.

### Helper functions
- `public.generate_portfolio_slug(_full_name text, _id uuid)` returns text — generates unique slug.
- Trigger on `profiles` insert/update of `portfolio_visibility='public'`: if `portfolio_slug IS NULL` auto-assign.

## 2. Server functions

`src/lib/career.functions.ts` (requireSupabaseAuth)
- `getMyCareerProfile`, `updateCareerProfile(input)` (bio, social, skills, education, experience, goals, privacy)
- `updatePortfolioSettings({ visibility, slug, show_* })` with slug-claim collision handling
- `getMyResumeData()` — joins profile + certificates + projects (approved submissions) + enrollments completed → DTO for resume render
- `listJobs(filters)` — open jobs with employer join (student-facing)
- `getJob(slug)` — single job + my application status + saved state
- `applyToJob({ job_id, cover_letter, portfolio_url, include_resume })` — snapshots current resume DTO into `resume_snapshot`
- `withdrawApplication(id)`
- `listMyApplications()`
- `toggleSaveJob(job_id)`
- `listMySavedJobs()`

`src/lib/career-admin.functions.ts` (admin guard)
- Employers CRUD: `adminListEmployers`, `adminCreateEmployer`, `adminUpdateEmployer`, `adminDeleteEmployer`
- Jobs CRUD: `adminListJobs`, `adminCreateJob`, `adminUpdateJob`, `adminArchiveJob`
- Applications: `adminListApplications(filters)`, `adminUpdateApplicationStatus`

`src/lib/portfolio.functions.ts` (public — no auth)
- `getPublicPortfolio({ slug })` — fetches profile via admin client; returns ONLY whitelisted fields per `show_*` flags; includes certificates (number + program + issue_date) and projects (title + summary + repo/demo) and skills/social. Unlisted = accessible by direct slug but `head()` adds `noindex`. Private = 404.

## 3. Routes

### Student
- `/dashboard/career` — overview tabs (Profile, Resume, Portfolio, Applications, Saved)
- `/dashboard/career/profile` — edit form (bio, location, social, skills, education, experience, goals)
- `/dashboard/career/portfolio` — visibility, slug claim, privacy toggles, preview link
- `/dashboard/career/resume` — auto-generated printable resume with template switcher (2 templates: `classic`, `modern`); `window.print()` for PDF export
- `/dashboard/career/applications` — list + statuses + withdraw

### Public
- `/portfolio/$slug` — public/unlisted portfolio page. head() title `{Name} | {Headline} | HIGAET Portfolio`, description from bio; canonical+og:url; JSON-LD `Person`. Unlisted adds `meta robots noindex`.
- `/careers/jobs` — searchable/filterable job board (search by title/skill, filter employment_type, remote_type, location)
- `/careers/jobs/$slug` — job detail + apply CTA (signed-in students only)

### Admin
- `/dashboard/admin/employers` — list + create/edit dialog
- `/dashboard/admin/jobs` — list + create/edit (linked to employer) + archive
- `/dashboard/admin/applications` — pipeline list + status update

### Sidebar/Tab updates
- Add "Career" item to student `RoleSidebar`.
- Add Employers, Jobs, Applications to admin tabs in `_authenticated.dashboard.admin.tsx`.

## 4. Components

- `src/components/career/ResumeClassic.tsx`, `ResumeModern.tsx` — print-styled templates
- `src/components/career/JobCard.tsx`, `JobFiltersBar.tsx`
- `src/components/portfolio/PortfolioHero.tsx`, `PortfolioSection.tsx`
- `src/components/career/ApplicationStatusBadge.tsx`
- `src/components/career/SkillsInput.tsx` (tag input)

## 5. Out of scope (3A.2 / later)
- Interview tracker stages
- Placement records / offers
- Skills matrix / assessments
- Employer self-serve auth + recruiter role
- Career analytics
- Resume PDF server-rendering (print is fine for v1)

## Execution order
1. Migration → wait for approval → types regen.
2. `career.functions.ts`, `career-admin.functions.ts`, `portfolio.functions.ts`.
3. Career dashboard + Profile + Portfolio settings + Resume.
4. Public `/portfolio/$slug` + JSON-LD + privacy gating.
5. Public job board + job detail + apply flow.
6. Admin employers/jobs/applications.
7. Sidebar/Admin tabs wiring.

Proceed?

## Sprint 4: HIGAET Global Education Hub (4A + 4B) — COMPLETE

**4A — Public Study Abroad Platform**
- DB: countries, universities, university_programs, scholarships (seeded 8 countries + 20 universities).
- Public DB-driven routes: /global-education/countries, /countries/$slug, /universities, /universities/$slug, /scholarships.
- Lead form (existing `LeadForm`) now persists to `study_abroad_leads` (division=global) and `technologies_leads` (division=tech) via `submitLead`.

**4B — Admissions CRM**
- DB: study_abroad_leads, applications, application_documents.
- Student portal: /dashboard/applications (list) and /$id (timeline + document uploads + edit panel).
- Application lifecycle: lead → counseling → started → docs_submitted → submitted → offer.
- Document types: passport, transcript, resume, sop, lor, english_test, financial, other (version-tracked, URL-based upload).

**Admin CMS (under /dashboard/admin)**
- Tabs grouped as Academy / Career / Global / Tech.
- New CRUD: Countries, Universities, Uni programs, Scholarships.
- New inboxes: SA leads, SA applications, Tech leads.

**Technologies placeholder**: Existing /technologies/* routes already cover hero, services, ecosystem, contact. Tech contact form persists to `technologies_leads`.

**Deferred**:
- 4C Counselor workspace (assigned students, tasks, follow-ups).
- 4D Visa case tracking (visa_cases, visa_documents, visa_status_history).
- File-storage bucket for document uploads (currently URL-based).
