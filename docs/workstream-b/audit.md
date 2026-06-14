# Workstream B.1 — Academy Consumer Audit

**Date:** 2026-06-14
**Scope:** Inventory every Academy consumer that holds inline data the frozen Provider Layer can serve.
**Output:** Migration matrix only. No code changes.

---

## 1. Domain alignment & out-of-scope note

The Academy Registry v1.0 (frozen) covers:

- **Categories** (program pillars: Online Courses, Certifications, Bootcamps, Executive Programs, Workshops, Learning Paths, Enterprise Training)
- **Courses** (10 seed courses across those categories)
- **Learning Paths** (4 role-oriented journeys composed of course IDs)
- **Testimonials** (10 placeholder alumni quotes)
- **Generated read models**: search index, sitemap, breadcrumbs

The existing app contains a separate, richer **`PROGRAMS`** catalog in
`src/lib/academy-programs.ts` (curriculum / fees / faculty / hiring
partners / FAQs per program, plus `CAMPUSES`). That shape is **not**
served by the current registry contracts and is therefore **OUT OF
SCOPE for Workstream B**. Touching the contracts to absorb it would
violate the freeze policy (see `src/content/ADR-FREEZE.md`).

> Follow-up (logged here, not actioned in B): propose an Academy
> Registry v1.1 expansion under version governance to model programs
> + campuses + fees natively. Until then, `PROGRAMS` / `CAMPUSES`
> remain as a separate authoritative source for the program detail
> routes only.

Workstream B migrates everything the providers **can** serve today
(categories, learning paths, testimonials, search, sitemap,
breadcrumbs, and Academy-level metadata).

---

## 2. Migration matrix

Columns: `File · Symbol · Kind · Target provider call · Risk · Step`

| File | Symbol | Kind | Target provider call | Risk | Step |
| --- | --- | --- | --- | --- | --- |
| `src/routes/academy.index.tsx` | `LEARNING_PATHS` (lines 40–46) | Inline learning-path teaser cards | `getAcademyLearningPaths({ filter: { visibility: "public" } })` — map `title` → label, `summary` → body | Medium — current literals describe **learner audiences** (school students, professionals…), not the registry's role-based paths. Adapter required OR keep as ancillary copy. Flag for plan revision. | B.2 |
| `src/routes/academy.index.tsx` | `TESTIMONIALS` (lines 70–86) | Inline alumni quotes | `getAcademyTestimonials({ limit: 3 })` — map `quote` / `name` / `role` directly | Low — shape matches | B.2 |
| `src/routes/academy.index.tsx` | `FAQS` (lines 97–104) | Inline FAQ list | n/a — not modeled in registry v1.0 | Out of scope (no provider). Keep inline OR move to a future registry. | — |
| `src/routes/academy.index.tsx` | `FLAGSHIP_SLUGS` / `FLAGSHIP_ICONS` (24–38) | Program references | n/a — `PROGRAMS` is out-of-scope (see §1) | Out of scope | — |
| `src/routes/academy.index.tsx` | `CAREER_OUTCOMES`, `STUDENT_PROJECTS`, `FACULTY`, `ADMISSIONS_STEPS` | Page-specific marketing blocks | n/a — not modeled in registry v1.0 | Out of scope | — |
| `src/routes/academy.index.tsx` | `head()` (line 107) | Static title/description | Derive home metadata from a small Academy-level constant or fall back to registry; verify canonical / og:url self-reference | Low | B.5 |
| `src/routes/academy.online-courses.tsx` | `head()` + page body | Static category landing | `resolveCategoryById("academy_category_online_courses")` for metadata; `getAcademyCourses({ filter: { categoryId } })` for course list | Low | B.5 |
| `src/routes/academy.certifications.tsx` | `head()` + page body | Static category landing | `resolveCategoryById("academy_category_certifications")` + `getAcademyCourses({ filter: { categoryId } })` | Low | B.5 |
| `src/routes/academy.learning-paths.tsx` | `head()` + page body | Learning paths landing | `getAcademyLearningPaths()` for list; metadata from a path-index constant | Low | B.5 |
| `src/routes/academy.success-stories.tsx` | `head()` + page body | Testimonials landing | `getAcademyTestimonials()` | Low | B.2 |
| `src/routes/academy.programs.index.tsx` | `PROGRAMS`, `CATEGORY_KEYS`, `CATEGORY_LABELS` | Program catalog | n/a — `PROGRAMS` is out-of-scope (see §1) | Out of scope | — |
| `src/routes/academy.programs.$slug.tsx` | `getProgram(slug)` | Program detail | n/a — out of scope | Out of scope | — |
| `src/routes/academy.campuses.index.tsx` | `CAMPUSES` | Campus list | n/a — not in registry | Out of scope | — |
| `src/routes/academy.campuses.$slug.tsx` | `getCampus(slug)` | Campus detail | n/a — out of scope | Out of scope | — |
| `src/routes/academy.admissions.tsx` | `PROGRAMS` import | Admissions content | n/a — out of scope | Out of scope | — |
| `src/components/site/AcademyMegaMenu.tsx` | `RESOURCES` (line 10) + inline category arrays | Mega menu navigation | `getAcademyCategories({ filter: { visibility: "public" } })` sorted by `order` | **High** — current mega menu encodes a richer taxonomy (programs, campuses, resources) than the registry models. Will need an adapter that combines registry categories + locally-curated "Resources" links. | B.3 |
| `src/components/site/AcademySearch.tsx` | `QUICK_LINKS` (line 17) + any inline search list | Search palette quick links | `getAcademySearchIndex()` for searchable records; keep `QUICK_LINKS` only if it represents non-registry navigation shortcuts | Medium — depends on whether `QUICK_LINKS` is navigation vs searchable content | B.4 |
| **All Academy routes (universal)** | Hardcoded breadcrumbs (none found yet — confirm in B.6) | Breadcrumb trails | `getAcademyBreadcrumbs(currentPath)` | Low — only routes whose paths match the generated trail patterns (`/academy/categories/{slug}`, `/academy/courses/{slug}`, `/academy/learning-paths/{slug}`) currently resolve. Existing routes (`/academy/online-courses`, `/academy/programs/{slug}`) do **not** match those patterns. **Action item:** either rename routes (URL break — major) or extend breadcrumb generator path strategy (allowed — read-model only, not a contract change). | B.6 |
| `src/routes/sitemap[.]xml.ts` (or static) | Sitemap entries | XML sitemap | `getAcademySitemap()` | Low — additive merge into existing sitemap mechanism | B.5 |

---

## 3. URL / slug alignment findings

| Surface | Registry slug | Current route | Status |
| --- | --- | --- | --- |
| Categories | `online-courses`, `certifications`, `bootcamps`, `executive-programs`, `workshops`, `learning-paths`, `enterprise-training` | `/academy/online-courses`, `/academy/certifications`, `/academy/learning-paths`, `/academy/corporate-training`, `/academy/offline-training` | **Partial mismatch.** Routes are flat (`/academy/online-courses`) while breadcrumb / sitemap generators emit `/academy/categories/{slug}`. Resolve in B.6 by switching generator path strategy (not a contract change). |
| Courses | `generative-ai-foundations`, etc. | No dedicated course routes exist — only `PROGRAMS` | Course detail routes not yet built. Not blocking B; document as future work. |
| Learning paths | `ai-engineer`, `genai-application-developer`, `llmops-specialist`, `ai-leader` | `/academy/learning-paths` (index only) | Detail routes per path not yet built. Future work. |

---

## 4. Open issues raised by the audit (require approval before implementation)

1. **Path-strategy mismatch.** `getAcademyBreadcrumbs` and `getAcademySitemap` currently emit `/academy/categories/{slug}` and `/academy/learning-paths/{slug}` URLs, but the live app routes are flat (`/academy/{slug}`). Two options:
   - **B-OPT-1 (recommended):** Update the breadcrumb + sitemap generators to emit flat URLs to match the live routes. This is a read-model change — **allowed** under the freeze (generators are derived data, not contracts). No provider API change. Touches: `src/content/academy/generated/breadcrumbs.ts`, `src/content/academy/generated/sitemap.ts`.
   - **B-OPT-2:** Add nested redirect routes. Adds surface area without value. Not recommended.
2. **`PROGRAMS` / `CAMPUSES` out of scope.** Cleanly excluded from B. Log a follow-up to extend the registry under version governance (Academy v1.1).
3. **Audience-based "Learning Paths" block on the homepage** describes learner audiences, not role-based paths. Treat as page-specific marketing copy (not registry data) and leave inline; rename the local constant to `LEARNER_AUDIENCES` in B.2 to avoid confusing it with `getAcademyLearningPaths`.
4. **Mega menu** uses a richer taxonomy than the registry. B.3 will source the **Programs** branch from `getAcademyCategories` and leave Resources / Campuses inline (out of scope).
5. **FAQs / admissions / faculty / projects / outcomes** on the homepage are page-specific marketing copy; not migrated.

---

## 5. Sequencing implication

The audit confirms the planned B.2–B.6 ordering, with two clarifications:

- B.6 (breadcrumbs) requires deciding **B-OPT-1 vs B-OPT-2** first.
- B.3 (mega menu) is scoped to the Programs branch only; the rest of the menu is out of scope.

**Next action:** approve the four open items above before starting B.2.
