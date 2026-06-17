/**
 * HIGAET Content Providers — Academy (WIRED)
 * ---------------------------------------------------------------
 * Single, anti-corruption surface between Academy consumers and
 * the underlying data source. The source is currently the static
 * Academy registry (`@/content/academy`). In v1.6 it becomes a
 * REST API. Consumers never change.
 *
 * Layer:        src/content/providers/academy.ts
 * Workstream:   A.2 — Step 8 (Provider Wiring)
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * WIRING RULES (enforced by review)
 *   1. Imports ONLY from the Academy internal barrel `@/content/academy`.
 *      Never from individual registry files. The barrel is the single
 *      integration point and runs the validation gate at import time.
 *   2. Provider API signatures are UNCHANGED from A.1 Step 7.
 *   3. All business filtering happens here, not in consumers.
 *   4. Stateless, read-only, no caches, no mutation.
 *   5. Resolvers return `null` on a normal miss; never throw.
 * ---------------------------------------------------------------
 */

import type {
  BreadcrumbEntry,
  CategoryEntry,
  CourseEntry,
  EntityStatus,
  LearningPathEntry,
  ProviderFilter,
  ProviderOptions,
  ProviderResult,
  SearchRecord,
  SitemapEntry,
  TestimonialEntry,
} from "../_registry";

import {
  ACADEMY_BREADCRUMBS,
  ACADEMY_CATEGORIES,
  ACADEMY_COURSES,
  ACADEMY_LEARNING_PATHS,
  ACADEMY_SEARCH_INDEX,
  ACADEMY_SITEMAP,
  ACADEMY_TESTIMONIALS,
} from "@/content/academy";

// Marketing surface (B.6 / B.8) — PROGRAMS is the single source of truth
// for program slugs + titles, already shared with the sitemap generator.
// Importing it here keeps the breadcrumb provider in lockstep without
// introducing a second naming registry.
import { PROGRAMS } from "@/lib/academy-programs";

/* ================================================================
 * SECTION 1 — Division-specific filter extensions
 * ============================================================== */

/**
 * Academy-only filter knobs. Extends the shared `ProviderFilter`
 * so callers can combine status / visibility / category filters
 * with Academy-specific `level` and `mode` filters in one object.
 */
export interface AcademyFilter extends ProviderFilter {
  /** Restrict by skill level. */
  level?: "beginner" | "intermediate" | "advanced";
  /** Restrict by delivery mode. */
  mode?: "online" | "offline" | "hybrid";
}

/** Convenience alias for Academy collection-getter options. */
export type AcademyCourseOptions = ProviderOptions<CourseEntry, AcademyFilter>;

/* ================================================================
 * SECTION 2 — Internal helpers (module-private)
 * ----------------------------------------------------------------
 * Pure functions over a single entry. Centralizing the filter and
 * pagination logic keeps every getter consistent and prevents
 * subtle drift in semantics across collections.
 * ============================================================== */

const DEFAULT_VISIBILITY = "public" as const;

function asStatusList(
  v: EntityStatus | readonly EntityStatus[] | undefined,
): readonly EntityStatus[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? (v as readonly EntityStatus[]) : [v as EntityStatus];
}

function asIdList(
  v: string | readonly string[] | undefined,
): readonly string[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? (v as readonly string[]) : [v as string];
}

/**
 * Apply the shared filter knobs (status / visibility / includeDraft)
 * to a single base entry. Defaults match the documented contract:
 *
 *   - visibility defaults to `"public"`.
 *   - `draft` entries are hidden unless `includeDraft` is true OR
 *     `draft` is explicitly in `status`.
 *   - When `status` is provided, it is the authoritative whitelist
 *     (and overrides the implicit draft filter).
 */
function matchesBaseFilter(
  entry: { status: EntityStatus; visibility: string },
  filter: ProviderFilter | undefined,
): boolean {
  const visibility = filter?.visibility ?? DEFAULT_VISIBILITY;
  if (visibility !== "any" && entry.visibility !== visibility) return false;

  const statusList = asStatusList(filter?.status);
  if (statusList) {
    if (!statusList.includes(entry.status)) return false;
  } else if (!filter?.includeDraft && entry.status === "draft") {
    return false;
  }
  return true;
}

function applyLimit<T>(
  rows: readonly T[],
  options: { limit?: number; pagination?: { limit?: number } } | undefined,
): readonly T[] {
  const limit = options?.limit ?? options?.pagination?.limit;
  if (typeof limit === "number" && limit >= 0 && limit < rows.length) {
    return rows.slice(0, limit);
  }
  return rows;
}

/* ================================================================
 * SECTION 3 — Collection getters
 * ============================================================== */

/**
 * Return Academy categories matching the supplied options.
 * Empty array when nothing matches.
 */
export function getAcademyCategories(
  options?: ProviderOptions<CategoryEntry>,
): ProviderResult<readonly CategoryEntry[]> {
  const filter = options?.filter;
  const rows = ACADEMY_CATEGORIES.filter((c) => matchesBaseFilter(c, filter));
  return applyLimit(rows, options);
}

/**
 * Return Academy courses matching the supplied options.
 * Empty array when nothing matches.
 */
export function getAcademyCourses(
  options?: AcademyCourseOptions,
): ProviderResult<readonly CourseEntry[]> {
  const filter = options?.filter;
  const categoryIds = asIdList(filter?.categoryId);
  const rows = ACADEMY_COURSES.filter((c) => {
    if (!matchesBaseFilter(c, filter)) return false;
    if (categoryIds && !categoryIds.includes(c.categoryId)) return false;
    if (filter?.level && c.level !== filter.level) return false;
    if (filter?.mode && c.mode !== filter.mode) return false;
    return true;
  });
  return applyLimit(rows, options);
}

/**
 * Return Academy learning paths matching the supplied options.
 * Empty array when nothing matches.
 */
export function getAcademyLearningPaths(
  options?: ProviderOptions<LearningPathEntry>,
): ProviderResult<readonly LearningPathEntry[]> {
  const filter = options?.filter;
  const courseIds = asIdList(filter?.courseId);
  const rows = ACADEMY_LEARNING_PATHS.filter((p) => {
    if (!matchesBaseFilter(p, filter)) return false;
    if (courseIds && !p.courseIds.some((id) => courseIds.includes(id))) {
      return false;
    }
    return true;
  });
  return applyLimit(rows, options);
}

/**
 * Return Academy testimonials matching the supplied options.
 * Empty array when nothing matches.
 */
export function getAcademyTestimonials(
  options?: ProviderOptions<TestimonialEntry>,
): ProviderResult<readonly TestimonialEntry[]> {
  const filter = options?.filter;
  const rows = ACADEMY_TESTIMONIALS.filter((t) => matchesBaseFilter(t, filter));
  return applyLimit(rows, options);
}

/* ================================================================
 * SECTION 4 — Derived-artifact getters
 * ----------------------------------------------------------------
 * Pass-throughs over the generated read models. The generators
 * already apply the `published + public` filter; the provider's
 * job is to expose them, not to recompute them.
 * ============================================================== */

/**
 * Return the Academy search index. Consumers should treat the
 * result as opaque and rely only on `SearchRecord` fields.
 */
export function getAcademySearchIndex(): ProviderResult<
  readonly SearchRecord[]
> {
  return ACADEMY_SEARCH_INDEX;
}

/**
 * Return the Academy sitemap rows. Only `published` + `public`
 * entries are included by the generator.
 */
export function getAcademySitemap(): ProviderResult<readonly SitemapEntry[]> {
  return ACADEMY_SITEMAP;
}

/**
 * Static Academy marketing surface (B.6 expansion).
 * Each entry is the deterministic trail for a non-registry marketing route.
 * `url` omitted on the last node = current page (not a link).
 */
const STATIC_ACADEMY_BREADCRUMBS: Readonly<Record<string, readonly BreadcrumbEntry[]>> = {
  "/academy/programs": [
    { label: "Academy", url: "/academy" },
    { label: "Programs" },
  ],
  "/academy/online-courses": [
    { label: "Academy", url: "/academy" },
    { label: "Online Courses" },
  ],
  "/academy/certifications": [
    { label: "Academy", url: "/academy" },
    { label: "Certifications" },
  ],
  "/academy/learning-paths": [
    { label: "Academy", url: "/academy" },
    { label: "Learning Paths" },
  ],
  "/academy/campuses": [
    { label: "Academy", url: "/academy" },
    { label: "Campuses" },
  ],
  "/academy/corporate-training": [
    { label: "Academy", url: "/academy" },
    { label: "Corporate Training" },
  ],
  "/academy/offline-training": [
    { label: "Academy", url: "/academy" },
    { label: "Offline Training" },
  ],
  "/academy/admissions": [
    { label: "Academy", url: "/academy" },
    { label: "Admissions" },
  ],
  "/academy/scholarship": [
    { label: "Academy", url: "/academy" },
    { label: "Scholarship" },
  ],
  "/academy/placements": [
    { label: "Academy", url: "/academy" },
    { label: "Placements" },
  ],
  "/academy/internships": [
    { label: "Academy", url: "/academy" },
    { label: "Internships" },
  ],
  "/academy/success-stories": [
    { label: "Academy", url: "/academy" },
    { label: "Success Stories" },
  ],
  "/academy/blog/certifications-comparison": [
    { label: "Academy", url: "/academy" },
    { label: "Blog", url: "/blog" },
    { label: "Certifications Comparison" },
  ],
  "/academy/faq": [
    { label: "Academy", url: "/academy" },
    { label: "FAQ" },
  ],
  "/academy/contact": [
    { label: "Academy", url: "/academy" },
    { label: "Contact" },
  ],
};

/**
 * Return the breadcrumb trail for an internal Academy URL.
 *
 * Resolution strategy (slug-based, deterministic):
 *   - `/academy/courses/{slug}`         → matching course trail
 *   - `/academy/categories/{slug}`      → matching category trail
 *   - `/academy/learning-paths/{slug}`  → matching learning path trail
 *   - `/academy/programs/{slug}`        → Programs → {program title}
 *   - `/academy/<marketing-page>`       → static marketing trail
 *   - `/academy` (or `/academy/`)       → root trail `[{ label: "Academy" }]`
 *   - anything else                     → `[]`
 *
 * Returning `[]` for an unknown path keeps consumers safe: they
 * can render the result unconditionally without a null check.
 */
export function getAcademyBreadcrumbs(
  path: string,
): ProviderResult<readonly BreadcrumbEntry[]> {
  if (typeof path !== "string" || !path.startsWith("/academy")) return [];

  const normalized = path.replace(/\/+$/, "");
  if (normalized === "/academy") {
    return [{ label: "Academy" }];
  }

  const courseSlug = matchPrefix(normalized, "/academy/courses/");
  if (courseSlug) {
    const course = ACADEMY_COURSES.find((c) => c.slug === courseSlug);
    if (course) {
      const t = ACADEMY_BREADCRUMBS.find(
        (b) => b.kind === "course" && b.id === course.id,
      );
      if (t) return t.trail;
    }
    return [];
  }

  const categorySlug = matchPrefix(normalized, "/academy/categories/");
  if (categorySlug) {
    const category = ACADEMY_CATEGORIES.find((c) => c.slug === categorySlug);
    if (category) {
      const t = ACADEMY_BREADCRUMBS.find(
        (b) => b.kind === "category" && b.id === category.id,
      );
      if (t) return t.trail;
    }
    return [];
  }

  const pathSlug = matchPrefix(normalized, "/academy/learning-paths/");
  if (pathSlug) {
    const lp = ACADEMY_LEARNING_PATHS.find((p) => p.slug === pathSlug);
    if (lp) {
      const t = ACADEMY_BREADCRUMBS.find(
        (b) => b.kind === "learning-path" && b.id === lp.id,
      );
      if (t) return t.trail;
    }
    return [];
  }

  // B.6 — Program detail pages. Title sourced from PROGRAMS (single
  // source of truth, same registry the sitemap generator uses).
  const programSlug = matchPrefix(normalized, "/academy/programs/");
  if (programSlug) {
    const program = PROGRAMS.find((p) => p.slug === programSlug);
    if (program) {
      return [
        { label: "Academy", url: "/academy" },
        { label: "Programs", url: "/academy/programs" },
        { label: program.title },
      ];
    }
    return [];
  }

  // Static marketing surface
  const staticTrail = STATIC_ACADEMY_BREADCRUMBS[normalized];
  if (staticTrail) return staticTrail;

  return [];
}

function matchPrefix(path: string, prefix: string): string | null {
  if (!path.startsWith(prefix)) return null;
  const rest = path.slice(prefix.length);
  if (!rest || rest.includes("/")) return null;
  return rest;
}

/* ================================================================
 * SECTION 5 — Single-item resolvers
 * ----------------------------------------------------------------
 * Resolvers return the entity when found, `null` when absent.
 * They never throw for a normal lookup miss.
 * ============================================================== */

/**
 * Resolve a course by slug. Returns `null` when no course matches.
 */
export function resolveCourseBySlug(
  slug: string,
): ProviderResult<CourseEntry | null> {
  if (!slug) return null;
  return ACADEMY_COURSES.find((c) => c.slug === slug) ?? null;
}

/**
 * Resolve a category by id. Returns `null` when no category matches.
 */
export function resolveCategoryById(
  id: string,
): ProviderResult<CategoryEntry | null> {
  if (!id) return null;
  return ACADEMY_CATEGORIES.find((c) => c.id === id) ?? null;
}

/**
 * Resolve a learning path by id OR slug. Accepting either lets
 * callers (router params, search results, links) use whichever
 * key is available without an extra lookup.
 */
export function resolvePathByIdOrSlug(
  key: string,
): ProviderResult<LearningPathEntry | null> {
  if (!key) return null;
  return (
    ACADEMY_LEARNING_PATHS.find((p) => p.id === key || p.slug === key) ?? null
  );
}
