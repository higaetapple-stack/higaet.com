# Workstream B — Step 8 (Safe Mode) Readiness Report

**Mode:** Safe (no DNS / origin assumptions, no production-host probes)
**Date:** 2026-06-15
**Scope:** Academy consumer surface only. Logical checks against the source
tree and frozen registry/provider layer. No live network calls.

---

## 1. Route audit (logical)

Source: `src/routes/academy*.tsx` (19 files).

| Bucket | Route(s) | Provider-backed? | Notes |
| --- | --- | --- | --- |
| Layout | `academy.tsx` | n/a (shell) | Renders `<SiteShell>` + `AcademySubHeader` + `<Outlet />`. `<Outlet />` present — children mount. |
| Landing | `academy.index.tsx` | Partial | Per B.1 audit: testimonials migratable; "learning paths" block is `LEARNER_AUDIENCES` (marketing copy, not registry). FAQs, faculty, outcomes, projects = out-of-scope marketing. |
| Category landings | `academy.online-courses.tsx`, `academy.certifications.tsx`, `academy.corporate-training.tsx`, `academy.offline-training.tsx` | Yes for `online-courses` / `certifications` via `resolveCategoryById` + `getAcademyCourses({ categoryId })`. `corporate-training` / `offline-training` have no 1:1 registry category — keep inline. |
| Paths landing | `academy.learning-paths.tsx` | Yes — `getAcademyLearningPaths()` |
| Testimonials landing | `academy.success-stories.tsx` | Yes — `getAcademyTestimonials()` |
| Programs (catalog + detail) | `academy.programs.index.tsx`, `academy.programs.$slug.tsx` | **Out of scope** (PROGRAMS shape not in registry v1.0). |
| Campuses | `academy.campuses.index.tsx`, `academy.campuses.$slug.tsx` | Out of scope. |
| Static info | `academy.admissions.tsx`, `academy.contact.tsx`, `academy.faq.tsx`, `academy.scholarship.tsx`, `academy.placements.tsx`, `academy.internships.tsx` | Out of scope (no registry coverage). |

No orphan / unreachable routes detected. No `createFileRoute` path / filename
mismatches in `src/routes/academy*`.

## 2. Sitemap inclusion check (logical, not DNS-based)

- Generator: `@/content/providers` → `getAcademySitemap()` emits entries for
  `/academy/categories/{slug}`, `/academy/courses/{slug}`,
  `/academy/learning-paths/{slug}`.
- Live route shape is flat (`/academy/online-courses`, no `/categories/`
  prefix, no course-detail routes yet).
- **Logical gap:** sitemap URLs do not match live routes. Tracked as
  audit open-issue #1 (B-OPT-1 — update generator path strategy; allowed
  under freeze because generators are derived data, not contracts).
- Site-level `src/routes/sitemap[.]xml.ts` exists and is the integration
  point. Safe to merge `getAcademySitemap()` after B-OPT-1 lands.

**Status:** Logically broken until B-OPT-1; not blocking Step 8 because no
sitemap entries currently point to `/academy/*` registry-derived URLs.

## 3. SSR shell integrity

- `src/routes/__root.tsx` exists with `<Outlet />`. Verified.
- `src/routes/academy.tsx` layout returns `<Outlet />`. Verified.
- `errorComponent` / `notFoundComponent` on root: required per
  `tanstack-errors-notfound` — verify on next pass (not Step 8 scope).
- No client-only modules imported at module scope of any `academy*` route
  (no `window` / `document` references at top level). SSR-safe.

## 4. Navigation & layout consistency

- Header link to `/academy` resolves to `academy.index.tsx` (leaf under
  layout). OK.
- `AcademySubHeader` "Apply now" CTA → `/academy/admissions` — route
  exists. OK.
- `AcademyMegaMenu` currently consumes inline arrays (B.3 not yet
  executed). All linked targets exist as routes — no dead links.
- `AcademySearch` `QUICK_LINKS` — all targets resolve to existing routes.
- Breadcrumb component not yet wired to `getAcademyBreadcrumbs` (B.6
  pending).

## 5. Readiness for production indexing phase

| Gate | State |
| --- | --- |
| Routes resolve, no 404s on internal links | PASS (logical) |
| SSR shell intact (`<Outlet />`, root layout) | PASS |
| Sitemap entries match live routes | **BLOCKED** on B-OPT-1 |
| Canonical / `og:url` per route | Pending B.5 |
| JSON-LD (`CollectionPage`, `Course`, `BreadcrumbList`) | Pending B.5 |
| Breadcrumbs from provider | Pending B.6 |
| No inline Academy data outside `src/content/academy/` | NOT YET (B.2–B.6 outstanding) |

## 6. Recommended next actions (in order)

1. **Approve B-OPT-1** — update `generated/breadcrumbs.ts` +
   `generated/sitemap.ts` path strategy to flat `/academy/{slug}`. Read
   model only; freeze-compliant.
2. Execute B.2 (homepage testimonials migration) — lowest risk, clears
   one row of the matrix.
3. Execute B.5 metadata for the four registry-backed category /
   path / success-stories routes.
4. Execute B.6 once B-OPT-1 is in.
5. Defer B.3 mega-menu Programs branch + B.4 search until B-OPT-1 +
   B.5 land (avoids re-work on URL shape).
6. After all of the above, write `src/content/ADR-FREEZE-consumers.md`
   to lock the consumer baseline (the actual B.8 deliverable).

---

**Verdict:** Safe-mode Step 8 PASS for routing, SSR shell, and navigation.
Sitemap + metadata + breadcrumbs remain blocked on B-OPT-1 and the
pending B.2–B.6 migration steps. No DNS dependency on any of the above.
