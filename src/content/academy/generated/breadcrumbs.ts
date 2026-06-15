/**
 * HIGAET Academy — Generated Breadcrumbs
 * ---------------------------------------------------------------
 * AUTO-GENERATED (derived data — do not hand-edit).
 *
 * Derived from Academy registries:
 *   - src/content/academy/categories.ts
 *   - src/content/academy/courses.ts
 *   - src/content/academy/learning-paths.ts
 *
 * Re-running this generation with unchanged source registries
 * MUST produce byte-identical output (deterministic).
 *
 * Layer:        src/content/academy/generated/breadcrumbs.ts
 * Workstream:   A.2 — Step 6
 * Contract:     `BreadcrumbEntry` (see src/content/_registry/types.ts)
 *
 * RULES (enforced by review):
 *   - Read-model only. No new business data.
 *   - Built from `published` + `visibility: "public"` entries only.
 *   - Trails NEVER hardcoded — composed from registry relationships.
 *   - The final crumb represents the current page and omits `url`.
 *
 * TRAIL SHAPES:
 *   Category trail        →  Academy / {Category}
 *   Course trail          →  Academy / {Category} / {Course}
 *   Learning Path trail   →  Academy / Learning Paths / {Path}
 * ---------------------------------------------------------------
 */

import type { BreadcrumbEntry } from "@/content/_registry/types";
import { ACADEMY_CATEGORIES } from "@/content/academy/categories";
import { ACADEMY_COURSES } from "@/content/academy/courses";
import { ACADEMY_LEARNING_PATHS } from "@/content/academy/learning-paths";
import { academyCategoryUrl } from "@/content/providers/academy-urls";

/**
 * A breadcrumb trail keyed by the originating registry entry id.
 * `kind` identifies the target entity type for consumers.
 */
export interface BreadcrumbTrail {
  /** Originating registry entry id (category / course / learning path). */
  id: string;
  /** Target entity kind. */
  kind: "category" | "course" | "learning-path";
  /** Ordered crumbs. The last crumb represents the current page and omits `url`. */
  trail: readonly BreadcrumbEntry[];
}

/* ----------------------------------------------------------------
 * Root crumb — every Academy trail starts here.
 * ---------------------------------------------------------------- */

const ACADEMY_ROOT: BreadcrumbEntry = {
  label: "Academy",
  url: "/academy",
};

const LEARNING_PATHS_ROOT: BreadcrumbEntry = {
  label: "Learning Paths",
  url: "/academy/learning-paths",
};

function isPublicPublished(entry: {
  status: string;
  visibility: string;
}): boolean {
  return entry.status === "published" && entry.visibility === "public";
}

/* ----------------------------------------------------------------
 * Category trails  →  Academy / {Category}
 * ---------------------------------------------------------------- */

const categoryTrails: BreadcrumbTrail[] = ACADEMY_CATEGORIES.filter(
  isPublicPublished,
).map((c) => ({
  id: c.id,
  kind: "category",
  trail: [ACADEMY_ROOT, { label: c.name }],
}));

/* ----------------------------------------------------------------
 * Course trails  →  Academy / {Category} / {Course}
 *
 * Courses with an unresolved category id are SKIPPED (a missing
 * category is a validator-level error, not a generator concern).
 * ---------------------------------------------------------------- */

const categoryById = new Map(ACADEMY_CATEGORIES.map((c) => [c.id, c]));

const courseTrails: BreadcrumbTrail[] = ACADEMY_COURSES.filter(
  isPublicPublished,
)
  .map((course): BreadcrumbTrail | null => {
    const category = categoryById.get(course.categoryId);
    if (!category || !isPublicPublished(category)) return null;
    return {
      id: course.id,
      kind: "course",
      trail: [
        ACADEMY_ROOT,
        {
          label: category.name,
          url: academyCategoryUrl(category),
        },
        { label: course.title },
      ],
    };
  })
  .filter((t): t is BreadcrumbTrail => t !== null);

/* ----------------------------------------------------------------
 * Learning path trails  →  Academy / Learning Paths / {Path}
 * ---------------------------------------------------------------- */

const learningPathTrails: BreadcrumbTrail[] = ACADEMY_LEARNING_PATHS.filter(
  isPublicPublished,
).map((p) => ({
  id: p.id,
  kind: "learning-path",
  trail: [ACADEMY_ROOT, LEARNING_PATHS_ROOT, { label: p.title }],
}));

/**
 * Canonical, deterministic breadcrumb dataset for HIGAET Academy.
 * Ordered lexicographically by `id` for stable diffs across builds.
 */
export const ACADEMY_BREADCRUMBS: readonly BreadcrumbTrail[] = [
  ...categoryTrails,
  ...courseTrails,
  ...learningPathTrails,
]
  .slice()
  .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
