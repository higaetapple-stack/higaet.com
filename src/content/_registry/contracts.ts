/**
 * HIGAET Registry System — Contracts
 * ---------------------------------------------------------------
 * Stable public contracts that every registry, provider, and
 * generator across the HIGAET ecosystem must implement.
 *
 * Layer:        src/content/_registry/contracts.ts
 * Step:         Workstream A.1 — Step 2
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - Types, interfaces, and type aliases ONLY.
 *   - May import ONLY from `./types`.
 *   - Zero runtime JavaScript. Zero `any`.
 *   - No registry data, validators, providers, helpers, generators.
 *   - Transport-agnostic: no MySQL, REST, Express, TanStack, React.
 *   - Async-ready: every provider contract returns `Promise<T> | T`.
 *   - Stable public APIs: optional additions allowed; breaking
 *     changes require a version bump and a superseding ADR.
 * ---------------------------------------------------------------
 */

import type {
  BaseEntry,
  BreadcrumbEntry,
  CategoryEntry,
  CategoryId,
  CourseEntry,
  CourseId,
  EntityStatus,
  LearningPathEntry,
  PaginationOptions,
  SearchRecord,
  SitemapEntry,
  SortOptions,
  TestimonialEntry,
  VisibilityFilter,
} from "./types";

/* ================================================================
 * SECTION 1 — Registry Contracts
 * ----------------------------------------------------------------
 * Per-entity-kind contracts. A division registry satisfies these
 * by exporting collections that conform to the listed entry type.
 * Contracts do NOT prescribe storage — static array today, fetched
 * record tomorrow.
 * ============================================================== */

/**
 * Generic registry contract. A registry is, at minimum, a typed
 * collection of entries sharing a stable contract.
 *
 * @typeParam TEntry — the entry type the registry holds.
 */
export interface RegistryContract<TEntry extends BaseEntry = BaseEntry> {
  /** All entries in the registry, including non-published entries. */
  readonly entries: readonly TEntry[];
  /** Per-registry semver-style version (e.g. `"1.0"`). */
  readonly version: string;
  /** Division this registry belongs to. */
  readonly division: "academy" | "technologies" | "hub";
  /** Optional human label for debugging and admin tooling. */
  readonly label?: string;
}

/** Registry of `CategoryEntry`. */
export type CategoryContract = RegistryContract<CategoryEntry>;

/** Registry of `CourseEntry`. */
export type CourseContract = RegistryContract<CourseEntry>;

/** Registry of `LearningPathEntry`. */
export type LearningPathContract = RegistryContract<LearningPathEntry>;

/** Registry of `TestimonialEntry`. */
export type TestimonialContract = RegistryContract<TestimonialEntry>;

/**
 * Search index contract. Search records are derived artifacts, not
 * authored entries — they do not extend `BaseEntry`.
 */
export interface SearchRecordContract {
  readonly records: readonly SearchRecord[];
  readonly version: string;
  readonly division: "academy" | "technologies" | "hub";
}

/**
 * Sitemap contract. Sitemap rows are derived artifacts mapped
 * directly to the public `sitemap.xml`.
 */
export interface SitemapContract {
  readonly entries: readonly SitemapEntry[];
  readonly version: string;
  readonly division: "academy" | "technologies" | "hub";
}

/**
 * Breadcrumb contract. A breadcrumb trail is an ordered sequence
 * of hops from the site root to the current page.
 */
export interface BreadcrumbContract {
  readonly trail: readonly BreadcrumbEntry[];
}

/* ================================================================
 * SECTION 2 — Provider Contracts
 * ----------------------------------------------------------------
 * Provider getters are the ONLY surface components are allowed to
 * import. Each getter returns `ProviderResult<T>` so callers can
 * `await` uniformly whether the provider is sync today or async
 * tomorrow.
 * ============================================================== */

/**
 * Result envelope returned by every provider getter.
 *
 * Async-ready by design: returning `T` directly today, switching
 * to `Promise<T>` later requires zero changes at call sites that
 * already `await` the value.
 *
 * @typeParam T — the resolved value type.
 */
export type ProviderResult<T> = T | Promise<T>;

/**
 * Division-agnostic filter accepted by provider getters.
 *
 * Division-specific filters (e.g. `categoryId`, `countryId`)
 * extend this interface within the division provider module.
 */
export interface ProviderFilter {
  /** Restrict by lifecycle state. Multiple values combine with OR. */
  status?: EntityStatus | readonly EntityStatus[];
  /** Restrict by audience. `"any"` bypasses the filter. */
  visibility?: VisibilityFilter;
  /** Include `draft` entries in results. Default is `false`. */
  includeDraft?: boolean;
  /** Restrict by category. Empty array returns no results. */
  categoryId?: CategoryId | readonly CategoryId[];
  /** Restrict by course. Empty array returns no results. */
  courseId?: CourseId | readonly CourseId[];
}

/** Pagination input accepted by provider getters. */
export type ProviderPagination = PaginationOptions;

/** Sort input accepted by provider getters. */
export type ProviderSort<TEntry extends BaseEntry = BaseEntry> =
  SortOptions<TEntry>;

/**
 * Uniform options envelope accepted by every collection-returning
 * provider getter.
 *
 * @typeParam TEntry  — the entry type being queried.
 * @typeParam TFilter — division-specific filter extensions.
 */
export interface ProviderOptions<
  TEntry extends BaseEntry = BaseEntry,
  TFilter extends ProviderFilter = ProviderFilter,
> {
  /** Filter restrictions. */
  filter?: TFilter;
  /** Pagination instruction. */
  pagination?: ProviderPagination;
  /** Sort instruction. */
  sort?: ProviderSort<TEntry>;
  /** Hard cap on result length. Convenience alias for `pagination.limit`. */
  limit?: number;
}

/**
 * Shape of a single collection-returning provider getter.
 *
 * @typeParam TEntry — the entry type returned.
 */
export type ProviderGetter<TEntry extends BaseEntry> = (
  options?: ProviderOptions<TEntry>,
) => ProviderResult<readonly TEntry[]>;

/**
 * Shape of a single entry-resolving provider getter.
 *
 * Returns `null` (not `undefined`) on miss so callers can use a
 * single nullish check across the entire provider surface.
 *
 * @typeParam TEntry — the entry type returned.
 */
export type ProviderResolver<TEntry extends BaseEntry> = (
  key: string,
) => ProviderResult<TEntry | null>;

/* ================================================================
 * SECTION 3 — Generator Contracts
 * ----------------------------------------------------------------
 * Generators are pure functions that derive artifacts from source
 * registries. They run at build time or memoized at module load
 * and produce the files inside `<division>/generated/`.
 * ============================================================== */

/**
 * Generates the per-division search index from the source
 * registries. Pure function — same inputs always produce the
 * same output.
 */
export interface SearchGeneratorContract {
  (input: {
    readonly categories: readonly CategoryEntry[];
    readonly courses: readonly CourseEntry[];
    readonly learningPaths: readonly LearningPathEntry[];
  }): SearchRecordContract;
}

/**
 * Generates a breadcrumb trail for a given internal URL using the
 * source registries to resolve slug → label.
 */
export interface BreadcrumbGeneratorContract {
  (input: {
    readonly path: string;
    readonly categories: readonly CategoryEntry[];
    readonly courses: readonly CourseEntry[];
    readonly learningPaths: readonly LearningPathEntry[];
  }): BreadcrumbContract;
}

/**
 * Generates the per-division sitemap from the source registries.
 * Only `published` + `public` entries are emitted.
 */
export interface SitemapGeneratorContract {
  (input: {
    readonly baseUrl: string;
    readonly categories: readonly CategoryEntry[];
    readonly courses: readonly CourseEntry[];
    readonly learningPaths: readonly LearningPathEntry[];
  }): SitemapContract;
}
