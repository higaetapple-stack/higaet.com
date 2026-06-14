# ADR-FREEZE — Academy Registry v1.0

**Status:** Frozen (Production Baseline)
**Freeze date:** 2026-06-14
**Supersedes:** —
**References:** [ADR-0001 — Registry Architecture](./_registry/) (see `src/content/_registry/*` headers)

---

## Scope of the freeze

The following directories form the **HIGAET Academy Registry v1.0** baseline and are now frozen under v1.4 governance:

```
src/content/_registry/      # Registry SDK v1.0
src/content/providers/      # Public Provider API
src/content/academy/        # Academy registries + generated read models
```

This includes:

- **Registry SDK v1.0** — Types, Contracts, Validation, Versioning, Public API, Test Framework, ESLint architecture enforcement.
- **Provider Layer** — `@/content/providers` as the sole public import surface; Academy provider wired to the registry.
- **Academy Registries** — `version.ts`, `categories.ts`, `courses.ts`, `learning-paths.ts`, `testimonials.ts`.
- **Generated Read Models** — `generated/search-index.ts`, `generated/sitemap.ts`, `generated/breadcrumbs.ts`.
- **Internal Barrel** — `src/content/academy/index.ts` (validation gate, internal organization only).

---

## Allowed changes after the freeze

These changes do **not** require a new ADR or version bump (beyond patch/minor as applicable):

- Bug fixes (validation, generators, providers).
- Validation improvements (new findings, better messages).
- Performance optimizations that preserve behavior.
- New Academy content (additional categories, courses, learning paths, testimonials) that conforms to existing contracts.
- Documentation improvements.
- Replacing placeholder testimonials with verified alumni quotes (keep the same `id`).
- Backend provider implementation (v1.6) **behind the existing provider API**.

---

## Not allowed without a new ADR + version review

Any of the following constitute a breaking change and require a superseding ADR and a major version review:

- Registry schema redesign (renaming, removing, or retyping public fields).
- Provider API signature changes (rename, remove, change return type of any `getAcademy*` / `resolve*` function).
- Contract changes in `src/content/_registry/contracts.ts`.
- Type renames in `src/content/_registry/types.ts`.
- Import-pattern changes (e.g. consumers bypassing `@/content/providers`).
- Folder restructuring under `src/content/_registry`, `src/content/providers`, or `src/content/academy`.
- Removing a published slug without a redirect plan (URL breakage).

---

## Public API surface (frozen)

Consumers MUST import from `@/content/providers` only. Direct imports from `@/content/academy/*` (or any other division registry) are blocked by ESLint `no-restricted-imports` per ADR-0001.

Frozen provider surface:

- `getAcademyCategories(options?)`
- `getAcademyCourses(options?)`
- `getAcademyLearningPaths(options?)`
- `getAcademyTestimonials(options?)`
- `getAcademySearchIndex()`
- `getAcademySitemap()`
- `getAcademyBreadcrumbs(path)`
- `resolveCourseBySlug(slug)`
- `resolveCategoryById(id)`
- `resolvePathByIdOrSlug(key)`
- Type: `AcademyFilter`

---

## Rollback point

The matching freeze label in Lovable Version History is **`Academy Registry v1.0 (Frozen)`**. Use that version as the canonical rollback target if a later workstream needs to revert consumer-side changes without touching this baseline.
