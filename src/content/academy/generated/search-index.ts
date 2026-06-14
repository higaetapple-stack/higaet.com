/**
 * HIGAET Academy — Generated Search Index
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
 * Layer:        src/content/academy/generated/search-index.ts
 * Workstream:   A.2 — Step 6
 * Contract:     `SearchRecord` (see src/content/_registry/types.ts)
 *
 * RULES (enforced by review):
 *   - Read-model only. No new business data.
 *   - Built from `published` + `visibility: "public"` entries only.
 *   - Aggregates ONLY searchable metadata (title, summary, keywords).
 *     Long-form curriculum / FAQs / outcomes are intentionally
 *     excluded — fetched lazily by the detail route when needed.
 *   - Stable, lexicographically-ordered output by `id`.
 * ---------------------------------------------------------------
 */

import type { SearchRecord } from "@/content/_registry/types";
import { ACADEMY_CATEGORIES } from "@/content/academy/categories";
import { ACADEMY_COURSES } from "@/content/academy/courses";
import { ACADEMY_LEARNING_PATHS } from "@/content/academy/learning-paths";

const DIVISION = "academy" as const;

function isPublicPublished(entry: {
  status: string;
  visibility: string;
}): boolean {
  return entry.status === "published" && entry.visibility === "public";
}

const categoryRecords: SearchRecord[] = ACADEMY_CATEGORIES.filter(
  isPublicPublished,
).map((c) => ({
  id: `search_${c.id}`,
  kind: "category",
  title: c.name,
  description: c.tagline ?? c.metadata.description,
  url: `/academy/categories/${c.slug}`,
  keywords: c.metadata.keywords,
  division: DIVISION,
}));

const courseRecords: SearchRecord[] = ACADEMY_COURSES.filter(
  isPublicPublished,
).map((c) => ({
  id: `search_${c.id}`,
  kind: "course",
  title: c.title,
  description: c.summary,
  url: `/academy/courses/${c.slug}`,
  keywords: c.metadata.keywords,
  division: DIVISION,
}));

const learningPathRecords: SearchRecord[] = ACADEMY_LEARNING_PATHS.filter(
  isPublicPublished,
).map((p) => ({
  id: `search_${p.id}`,
  kind: "learning-path",
  title: p.title,
  description: p.summary,
  url: `/academy/learning-paths/${p.slug}`,
  keywords: p.metadata.keywords,
  division: DIVISION,
}));

/**
 * Canonical, deterministic search dataset for HIGAET Academy.
 * Ordered lexicographically by `id` for stable diffs across builds.
 */
export const ACADEMY_SEARCH_INDEX: readonly SearchRecord[] = [
  ...categoryRecords,
  ...courseRecords,
  ...learningPathRecords,
]
  .slice()
  .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
