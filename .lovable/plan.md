# HIGAET — Active Development Plan

> Scope: **v1.4 — HIGAET Academy Production Release**
> Active workstream: **A — Academy Content Registries (Plan v3)**
> See `.lovable/roadmap.md` for the full multi-version product roadmap.
> See `.lovable/adr/0001-registry-architecture.md` for the architectural decision backing this workstream.
> Last updated: 2026-06-14

---

## Status

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Current Version    | v1.3                                                 |
| Current Phase      | Pre-v1.4 — Academy production hardening              |
| Active Workstream  | A — Academy Content Registries                       |
| Next Workstream    | B — Academy Header & Navigation                      |
| Future Versions    | v1.5 Hub · v1.6 Shared Platform · v1.7 AI · v2.0 Unified |

### Frozen Modules

- HIGAET Technologies v1.0 (public site)
- CRM / Finance / Support
- Auth flow
- LMS core tables
- Shared `Header` / `Footer` / `JsonLd` / `LeadForm` (extension only)

---

## v1.4 Workstreams

| ID | Workstream                       | Status   |
| -- | -------------------------------- | -------- |
| A  | Academy Content Registries       | 🚧 Active |
| B  | Academy Header & Navigation      | ⏳ Pending |
| C  | Academy Search                   | ⏳ Pending |
| D  | SEO & JSON-LD                    | ⏳ Pending |
| E  | Accessibility                    | ⏳ Pending |
| F  | Performance                      | ⏳ Pending |
| G  | QA & Validation                  | ⏳ Pending |
| H  | Freeze Academy                   | ⏳ Pending |

---

## Workstream A — Academy Content Registries (Plan v3)

Establishes the **canonical HIGAET Registry System** plus the first consumer (Academy). All future divisions (Hub, Blog, Careers, AI, LMS) reuse the same system.

### Architecture (per ADR-0001)

```
Components
    ↓
Providers (src/content/providers/)
    ↓
Cache (reserved — future)
    ↓
Registry (src/content/<division>/) — today
    ↓
API (v1.6+)
    ↓
Database
```

Components, routes, loaders, `head()`, JSON-LD builders import **only** from `@/content/providers`. An ESLint `no-restricted-imports` rule blocks direct registry imports outside the provider layer.

### Folder structure

```
src/content/
  _registry/
    types.ts
    contracts.ts
    validate.ts
    version.ts
    index.ts
    tests/
      schema.test.ts
      duplicates.test.ts
      relationships.test.ts
      seo-metadata.test.ts
      enums.test.ts
      resolver.test.ts
      generators.test.ts
  providers/
    academy.ts
    index.ts
  academy/
    version.ts
    categories.ts
    courses.ts
    learning-paths.ts
    testimonials.ts
    generated/
      search-index.ts
      sitemap.ts
      breadcrumbs.ts
    index.ts          # internal — imported only by providers/academy.ts
```

### Sub-phases

**A.1 — Registry Architecture (system foundation)**
1. `_registry/types.ts` (BaseEntry, Status, Visibility, AuditMeta, SeoMeta)
2. `_registry/contracts.ts` (CategoryContract, CourseContract, PathContract, TestimonialContract)
3. `_registry/validate.ts` (dev-time integrity checks)
4. `_registry/version.ts` (`REGISTRY_SYSTEM_VERSION = "1.0"`) + `_registry/index.ts`
5. `_registry/tests/*` (7 parameterizable test files)
6. ESLint `no-restricted-imports` rule
7. `providers/academy.ts` stubs (function signatures, empty arrays)
8. `providers/index.ts` barrel

**A.2 — Registry Population (first consumer)**
9. `academy/version.ts` (`ACADEMY_REGISTRY_VERSION = "1.0"`) + `categories.ts`
10. `academy/courses.ts`
11. `academy/learning-paths.ts` ‖ `academy/testimonials.ts`
12. `academy/generated/*`
13. `academy/index.ts` (internal barrel)
14. Wire providers to real registries; all tests green

### Provider API surface (Academy)

```
getAcademyCategories(opts?)        → CategoryEntry[]
getAcademyCourses(opts?)           → CourseEntry[]
getAcademyLearningPaths(opts?)     → LearningPathEntry[]
getAcademyTestimonials(opts?)      → TestimonialEntry[]
getAcademySearchIndex()            → SearchRecord[]
getAcademySitemap()                → SitemapEntry[]
getAcademyBreadcrumbs(path)        → BreadcrumbEntry[]
resolveCourseBySlug(slug)          → CourseEntry | null
resolveCategoryById(id)            → CategoryEntry | null
resolvePathByIdOrSlug(key)         → LearningPathEntry | null
```

Uniform `opts`: `{ status?, visibility?, categoryId?, limit?, includeDraft? }`.

### Acceptance criteria

- [ ] `src/content/_registry/` and `src/content/providers/` exist per ADR-0001
- [ ] All entries carry `id`, `slug`, `status`, `visibility`, `metadata`, `audit`
- [ ] Cross-refs use `id`, not `slug`
- [ ] `validateAcademyRegistry()` runs on import in dev and passes
- [ ] `_registry/tests/*` runs under `bunx vitest run` and passes
- [ ] ESLint blocks `@/content/academy/*` imports outside `providers/`
- [ ] `REGISTRY_SYSTEM_VERSION = "1.0"`, `ACADEMY_REGISTRY_VERSION = "1.0"`
- [ ] `generated/*` files carry a "do not edit" header
- [ ] Zero modifications to files outside `src/content/` (additive proof)
- [ ] All copy original (project core memory rule)

---

## Out of Scope for v1.4

- Global Education Hub (v1.5)
- `leads` table / Hub lead capture (v1.5)
- Backend integration (v1.6 — provider layer reserves the seam)
- New AI features (v1.7)

---

## Next Action

Documentation updates complete. Next implementation step:

**Workstream A.1 — Step 1: Create `src/content/_registry/types.ts`.**

Awaiting your go-ahead.
