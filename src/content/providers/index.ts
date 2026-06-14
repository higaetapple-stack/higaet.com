/**
 * Provider Layer — Public API Barrel
 *
 * This file is the SOLE public entry point for the HIGAET Provider SDK.
 *
 * Consumers (components, routes, generators, SEO, JSON-LD, search) MUST
 * import provider functions from this barrel:
 *
 *   import { getAcademyCourses } from "@/content/providers";
 *
 * They MUST NOT import from individual provider files
 * (e.g. "@/content/providers/academy") and MUST NOT import from
 * division registries directly (enforced by ESLint `no-restricted-imports`,
 * see ADR-0001).
 *
 * ---
 *
 * Governance
 *
 * Every symbol re-exported here is a PUBLIC API surface of the Provider SDK.
 * Adding, removing, or changing the shape of an export must follow the same
 * versioning discipline as the Registry SDK contracts.
 *
 * ---
 *
 * Architectural constraints (enforced by review):
 *   - Re-exports only.
 *   - No logic.
 *   - No data.
 *   - No helper functions.
 *   - No side effects at import time.
 *   - No direct registry imports.
 *
 * ---
 *
 * Future structure (additive, non-breaking):
 *
 *   export * from "./academy";
 *   export * from "./technologies";
 *   export * from "./hub";
 *   export * from "./blog";
 *   export * from "./careers";
 *   export * from "./ai";
 *   export * from "./shared";
 */

// ---------------------------------------------------------------------------
// Academy
// ---------------------------------------------------------------------------
export {
  // Collection getters
  getAcademyCategories,
  getAcademyCourses,
  getAcademyLearningPaths,
  getAcademyTestimonials,

  // Derived-artifact getters
  getAcademySearchIndex,
  getAcademySitemap,
  getAcademyBreadcrumbs,

  // Single-item resolvers
  resolveCourseBySlug,
  resolveCategoryById,
  resolvePathByIdOrSlug,
} from "./academy";

export type { AcademyFilter } from "./academy";

// Re-exported registry types consumers need at the boundary.
// Additive export (allowed under freeze).
export type {
  SearchRecord,
  BreadcrumbEntry,
  SitemapEntry,
  TestimonialEntry,
  CategoryEntry,
  CourseEntry,
  LearningPathEntry,
} from "../_registry";

// URL resolver (ADR-0003) — single source of truth for Academy route URLs.
export {
  academyHomeUrl,
  academyCategoryUrl,
  academyCourseUrl,
  academyLearningPathUrl,
} from "./academy-urls";
