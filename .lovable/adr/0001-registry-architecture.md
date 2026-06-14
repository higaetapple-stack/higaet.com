# ADR-0001: Registry Architecture (Canonical HIGAET Registry System)

- **Status:** Accepted
- **Date:** 2026-06-14
- **Deciders:** HIGAET Architecture Review
- **Related:** Roadmap v1.4 · Workstream A · `.lovable/plan.md`

---

## Context

HIGAET is evolving from a single-division website (Technologies) into a three-division ecosystem (Technologies, Academy, Global Education Hub) with future expansion into Blog, Careers, AI, and LMS. Today, division content is embedded inline in route files (`src/routes/academy.*.tsx`), with no shared schema, no validation, no SEO uniformity, and no path for backend integration in v1.6 (Node.js + Express + MySQL).

Without an explicit content architecture, every division would invent its own data shape, every backend swap would require touching every component, and every SEO/JSON-LD bug would have to be hunted route by route. We need a **single canonical content system** that scales across divisions and survives the v1.6 backend transition without component-level refactors.

## Decision

Adopt a **canonical HIGAET Registry System** consisting of three layers:

```
Components
    ↓
Providers      (src/content/providers/)   — the only import surface
    ↓
Cache          (reserved — future)
    ↓
Registries    (src/content/<division>/)  — static today
    ↓
API           (v1.6+)
    ↓
Database
```

### Layer 1 — Shared registry system (`src/content/_registry/`)

- `types.ts` — `BaseEntry`, `Status` (`draft | comingSoon | published | archived`), `Visibility` (`public | private | internal`), `SeoMeta`, `AuditMeta`.
- `contracts.ts` — division-agnostic contracts (`CategoryContract`, `CourseContract`, `PathContract`, `TestimonialContract`) that future Hub/Blog/AI registries reuse or extend.
- `validate.ts` — `validateRegistry()` runs in `import.meta.env.DEV`; throws on integrity failures.
- `version.ts` — `REGISTRY_SYSTEM_VERSION = "1.0"`.
- `tests/` — parameterized vitest suites: schema, duplicates, relationships, SEO metadata, enums, resolvers, generators.

### Layer 2 — Per-division registries (`src/content/<division>/`)

- `version.ts` (e.g. `ACADEMY_REGISTRY_VERSION = "1.0"`).
- Domain files (`categories.ts`, `courses.ts`, `learning-paths.ts`, `testimonials.ts`).
- `generated/` subfolder for derived artifacts (`search-index.ts`, `sitemap.ts`, `breadcrumbs.ts`) — never hand-edited.
- `index.ts` — **internal** barrel, imported only by the matching provider.

### Layer 3 — Providers (`src/content/providers/`)

- The **only** import surface for the rest of the application.
- Expose **functions**, not constants: `getAcademyCourses(opts?)` not `ACADEMY_COURSES`. Locks in the async-ready shape today.
- Today: return static data synchronously or via `Promise.resolve(...)`.
- v1.6+: swap implementation to `fetch("/api/academy/courses")`. Zero changes to consumers.
- Own filters by `status` / `visibility` so consumers never reinvent gating.
- A **Cache** layer is reserved between Provider and Registry/API; not implemented in v1.4 but the seam exists.

### Stable contract rules

Registry contracts are **stable public interfaces**. See roadmap version-governance table for bump rules. Renaming or removing fields is forbidden without a major bump and a superseding ADR.

### Cross-references use IDs, not slugs

`CourseEntry.categoryId → CategoryEntry.id`; `LearningPathEntry.courseIds[] → CourseEntry.id[]`. URL changes never break data integrity.

### Enforcement

An ESLint `no-restricted-imports` rule blocks any import from `@/content/<division>/*` outside `src/content/providers/`. Components, routes, loaders, `head()`, and JSON-LD builders must go through providers.

## Alternatives Considered

1. **Keep inline content in route files** — fastest short-term, but guarantees rework at every division addition and at the v1.6 backend swap. Rejected.
2. **Single flat constants per registry (`ACADEMY_COURSES`) imported directly by components** — simpler today, but every backend swap would touch every consumer and there is no place to inject filtering, caching, or async. Rejected.
3. **CMS-first (e.g. headless CMS) from day one** — premature; introduces operational and cost overhead before content volume justifies it. Reserved as a possible v1.6+ option behind the provider boundary. Rejected for v1.4.
4. **One mega-registry for all divisions** — couples divisions that should be independently versioned and frozen. Rejected.

## Consequences

### Positive
- Single source of truth per division.
- v1.6 backend swap changes one file per division (the provider), nothing else.
- Hub, Blog, Careers, AI, and LMS reuse the system for free.
- Dev-time validation catches content drift before QA.
- SEO metadata is uniform and lintable across every registry entry.
- `status` / `visibility` enable safe ship of unfinished content.
- ID-based cross-refs decouple URLs from data.

### Negative
- Higher up-front file count vs inline content.
- Authors must learn the contract instead of writing inline JSX.
- Generators add a small build-time cost.

### Neutral / tradeoffs
- Provider layer adds one indirection. Justified by the v1.6 swap.
- Cache seam is reserved but unused in v1.4 — small architectural surface that pays off when caching lands.

## Implementation Notes

Folder layout (canonical):

```
src/content/
  _registry/
    types.ts contracts.ts validate.ts version.ts index.ts
    tests/{schema,duplicates,relationships,seo-metadata,enums,resolver,generators}.test.ts
  providers/
    academy.ts index.ts
  academy/
    version.ts categories.ts courses.ts learning-paths.ts testimonials.ts
    generated/{search-index,sitemap,breadcrumbs}.ts
    index.ts
```

Provider API (Academy, v1.4):

```
getAcademyCategories(opts?), getAcademyCourses(opts?),
getAcademyLearningPaths(opts?), getAcademyTestimonials(opts?),
getAcademySearchIndex(), getAcademySitemap(),
getAcademyBreadcrumbs(path),
resolveCourseBySlug(slug), resolveCategoryById(id), resolvePathByIdOrSlug(key)
```

Uniform `opts`: `{ status?, visibility?, categoryId?, limit?, includeDraft? }`.

ESLint rule (added in A.1 step 6):

```
no-restricted-imports:
  patterns:
    - group: ["@/content/academy/*", "@/content/hub/*", "@/content/technologies/*"]
      message: "Import from @/content/providers, not from a division registry directly."
```

Generated files header:

```
// AUTO-GENERATED. Do not edit by hand.
// Regenerated from sibling registry files.
```

## Dependencies

- TypeScript (strict) — already configured.
- vitest — already available via `bunx vitest run`.
- ESLint — already configured; only the `no-restricted-imports` rule is added.
- No new npm dependencies.

## Future Considerations

- **Cache layer** (memory / Redis / KV) between providers and registries — slot reserved.
- **Backend boundary** in v1.6: replace static registry reads in providers with HTTP calls; ADR-0005 will formalize the API contract.
- **Hub registries** (v1.5): instantiate the same system with division-specific contracts (`CountryContract`, `UniversityContract`, `ScholarshipContract`, `VisaRouteContract`).
- **CMS option**: if/when content volume warrants, swap provider implementation again — consumers unaffected.
- **Internationalization**: `metadata` may grow per-locale fields under the optional-field rule (no version bump).

## Version History

| Date       | Change                                                  |
| ---------- | ------------------------------------------------------- |
| 2026-06-14 | Initial acceptance — Registry Architecture v1.0 (v1.4). |
