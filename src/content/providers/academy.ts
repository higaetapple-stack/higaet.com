/**
 * HIGAET Content Providers — Academy
 * ---------------------------------------------------------------
 * Single, anti-corruption surface between Academy consumers and
 * the underlying data source. Today the source is a static
 * registry (`src/content/academy/*`, populated in A.2). In v1.6
 * it becomes a Node.js + Express + MySQL API. In later versions a
 * cache layer is inserted between this module and its source.
 * **Consumers never change.**
 *
 * Layer:        src/content/providers/academy.ts
 * Step:         Workstream A.1 — Step 7
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * PROVIDER PRINCIPLES
 *   1. Functions only — no exported constants or mutable collections.
 *   2. Async-first — every public function returns `ProviderResult<T>`.
 *   3. Stateless — no caches, globals, or singletons in v1.4.
 *   4. Read-only — no create / update / delete in v1.4.
 *   5. Thin — orchestration only. Validation lives in the SDK.
 *      Data lives in registries. Presentation lives in components.
 *
 * ERROR CONTRACT (uniform across all HIGAET providers)
 *   - Collection getters return `[]` when no records match.
 *   - Single-item resolvers return `null` when nothing matches.
 *   - Providers `throw` ONLY for exceptional infrastructure failures
 *     (network errors, malformed API responses, contract violations
 *     detected at load time). They do NOT throw for ordinary
 *     "not found" cases.
 *
 * EVOLUTION
 *   v1.4  Provider → Static Registry
 *   v1.6  Provider → REST API
 *   v1.8  Provider → Cache → REST API
 *   v2.0  Provider → Cache → Gateway → Microservices
 * ---------------------------------------------------------------
 */

import type {
  BreadcrumbEntry,
  CategoryEntry,
  CourseEntry,
  LearningPathEntry,
  ProviderOptions,
  ProviderResult,
  SearchRecord,
  SitemapEntry,
  TestimonialEntry,
} from "../_registry";

/* ================================================================
 * SECTION 1 — Division-specific filter extensions
 * ============================================================== */

/**
 * Academy-only filter knobs. Composed with the shared
 * `ProviderFilter` fields (`status`, `visibility`, `includeDraft`,
 * `categoryId`, `courseId`) via `ProviderOptions`.
 */
export interface AcademyFilter {
  /** Restrict by skill level. */
  level?: "beginner" | "intermediate" | "advanced";
  /** Restrict by delivery mode. */
  mode?: "online" | "offline" | "hybrid";
}

/** Convenience alias for Academy collection-getter options. */
export type AcademyCourseOptions = ProviderOptions<
  CourseEntry,
  AcademyFilter
>;

/* ================================================================
 * SECTION 2 — Collection getters
 * ----------------------------------------------------------------
 * Stubs return `[]` per the error contract. A.2 wires these to
 * the real registries.
 * ============================================================== */

/**
 * Return Academy categories matching the supplied options.
 * Empty array when nothing matches.
 */
export function getAcademyCategories(
  _options?: ProviderOptions<CategoryEntry>,
): ProviderResult<readonly CategoryEntry[]> {
  return [];
}

/**
 * Return Academy courses matching the supplied options.
 * Empty array when nothing matches.
 */
export function getAcademyCourses(
  _options?: AcademyCourseOptions,
): ProviderResult<readonly CourseEntry[]> {
  return [];
}

/**
 * Return Academy learning paths matching the supplied options.
 * Empty array when nothing matches.
 */
export function getAcademyLearningPaths(
  _options?: ProviderOptions<LearningPathEntry>,
): ProviderResult<readonly LearningPathEntry[]> {
  return [];
}

/**
 * Return Academy testimonials matching the supplied options.
 * Empty array when nothing matches.
 */
export function getAcademyTestimonials(
  _options?: ProviderOptions<TestimonialEntry>,
): ProviderResult<readonly TestimonialEntry[]> {
  return [];
}

/* ================================================================
 * SECTION 3 — Derived-artifact getters
 * ============================================================== */

/**
 * Return the Academy search index. Consumers (search UI, command
 * palette, federated search) should treat the result as opaque
 * and rely only on `SearchRecord` fields.
 */
export function getAcademySearchIndex(): ProviderResult<readonly SearchRecord[]> {
  return [];
}

/**
 * Return the Academy sitemap rows. Consumed by the sitemap.xml
 * route or generator. Only `published` + `public` entries should
 * be included by the underlying generator.
 */
export function getAcademySitemap(): ProviderResult<readonly SitemapEntry[]> {
  return [];
}

/**
 * Return the breadcrumb trail for an internal Academy URL.
 * Empty array when the path is not under `/academy`.
 */
export function getAcademyBreadcrumbs(
  _path: string,
): ProviderResult<readonly BreadcrumbEntry[]> {
  return [];
}

/* ================================================================
 * SECTION 4 — Single-item resolvers
 * ----------------------------------------------------------------
 * Stubs return `null` per the error contract. A.2 wires these to
 * the real registries.
 * ============================================================== */

/**
 * Resolve a course by slug. Returns `null` when no course matches.
 */
export function resolveCourseBySlug(
  _slug: string,
): ProviderResult<CourseEntry | null> {
  return null;
}

/**
 * Resolve a category by id. Returns `null` when no category matches.
 */
export function resolveCategoryById(
  _id: string,
): ProviderResult<CategoryEntry | null> {
  return null;
}

/**
 * Resolve a learning path by id OR slug. Accepting either lets
 * callers (router params, search results, links) use whichever
 * key is available without an extra lookup.
 */
export function resolvePathByIdOrSlug(
  _key: string,
): ProviderResult<LearningPathEntry | null> {
  return null;
}
