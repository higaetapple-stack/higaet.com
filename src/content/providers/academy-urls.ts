/**
 * HIGAET Academy URL Resolver
 * ---------------------------------------------------------------
 * Single source of truth for mapping Academy registry entities to
 * their current live route URLs. See ADR-0003.
 *
 * Layer:      src/content/providers/academy-urls.ts
 * Workstream: B (URL resolver refinement; D-B-1)
 *
 * RULES
 *   1. Pure functions over inputs. No registry imports.
 *   2. Consumers MUST go through this module for Academy URLs.
 *   3. If route shapes change, this file changes — nothing else.
 * ---------------------------------------------------------------
 *
 * Current route shapes (flat under /academy):
 *
 *   Category slug "online-courses"        → /academy/online-courses
 *   Category slug "certifications"        → /academy/certifications
 *   Category slug "learning-paths"        → /academy/learning-paths
 *   Category slug "enterprise-training"   → /academy/corporate-training
 *   Category slug "workshops"             → /academy/offline-training
 *   (other category slugs)                → /academy/{slug}
 *
 *   Course slug                           → /academy/courses/{slug}
 *   Learning path slug                    → /academy/learning-paths/{slug}
 *   Academy home                          → /academy
 */

import type {
  CategoryEntry,
  CourseEntry,
  LearningPathEntry,
} from "../_registry";

/** Category slug → live route path overrides. */
const CATEGORY_ROUTE_OVERRIDES: Readonly<Record<string, string>> = {
  "enterprise-training": "/academy/corporate-training",
  workshops: "/academy/offline-training",
};

/** Academy section landing. */
export function academyHomeUrl(): string {
  return "/academy";
}

/** Route URL for a category, by entity or slug. */
export function academyCategoryUrl(
  category: Pick<CategoryEntry, "slug"> | string,
): string {
  const slug = typeof category === "string" ? category : category.slug;
  return CATEGORY_ROUTE_OVERRIDES[slug] ?? `/academy/${slug}`;
}

/** Route URL for a course detail page, by entity or slug. */
export function academyCourseUrl(
  course: Pick<CourseEntry, "slug"> | string,
): string {
  const slug = typeof course === "string" ? course : course.slug;
  return `/academy/courses/${slug}`;
}

/** Route URL for a learning path detail page, by entity or slug. */
export function academyLearningPathUrl(
  path: Pick<LearningPathEntry, "slug"> | string,
): string {
  const slug = typeof path === "string" ? path : path.slug;
  return `/academy/learning-paths/${slug}`;
}
