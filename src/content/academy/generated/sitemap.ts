/**
 * HIGAET Academy — Generated Sitemap
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
 * Layer:        src/content/academy/generated/sitemap.ts
 * Workstream:   A.2 — Step 6
 * Contract:     `SitemapEntry` (see src/content/_registry/types.ts)
 *
 * RULES (enforced by review):
 *   - Read-model only. No new business data.
 *   - Built from `published` + `visibility: "public"` entries only
 *     so draft / internal content NEVER reaches the public sitemap.
 *   - `lastmod` comes from `audit.updatedAt` (deterministic).
 *   - URLs are absolute and rooted at `ACADEMY_SITEMAP_BASE_URL`.
 *   - Stable, lexicographically-ordered output by `loc`.
 * ---------------------------------------------------------------
 */

import type { SitemapEntry } from "@/content/_registry/types";
import { ACADEMY_CATEGORIES } from "@/content/academy/categories";
import { ACADEMY_COURSES } from "@/content/academy/courses";
import { ACADEMY_LEARNING_PATHS } from "@/content/academy/learning-paths";

/**
 * Public base URL for HIGAET Academy sitemap entries.
 * Canonical production domain — single source of truth (Workstream B.2 · Step 7).
 */
export const ACADEMY_SITEMAP_BASE_URL = "https://higaet.com" as const;

function isPublicPublished(entry: {
  status: string;
  visibility: string;
}): boolean {
  return entry.status === "published" && entry.visibility === "public";
}

function url(path: string): string {
  return `${ACADEMY_SITEMAP_BASE_URL}${path}`;
}

const categoryEntries: SitemapEntry[] = ACADEMY_CATEGORIES.filter(
  isPublicPublished,
).map((c) => ({
  loc: url(`/academy/categories/${c.slug}`),
  lastmod: c.audit.updatedAt,
  changefreq: "monthly",
  priority: 0.7,
}));

const courseEntries: SitemapEntry[] = ACADEMY_COURSES.filter(
  isPublicPublished,
).map((c) => ({
  loc: url(`/academy/courses/${c.slug}`),
  lastmod: c.audit.updatedAt,
  changefreq: "weekly",
  priority: 0.8,
}));

const learningPathEntries: SitemapEntry[] = ACADEMY_LEARNING_PATHS.filter(
  isPublicPublished,
).map((p) => ({
  loc: url(`/academy/learning-paths/${p.slug}`),
  lastmod: p.audit.updatedAt,
  changefreq: "monthly",
  priority: 0.8,
}));

/**
 * Canonical, deterministic sitemap dataset for HIGAET Academy.
 * Mapped directly into the public `/sitemap.xml` server route.
 * Ordered lexicographically by `loc` for stable diffs across builds.
 */
export const ACADEMY_SITEMAP: readonly SitemapEntry[] = [
  ...categoryEntries,
  ...courseEntries,
  ...learningPathEntries,
]
  .slice()
  .sort((a, b) => (a.loc < b.loc ? -1 : a.loc > b.loc ? 1 : 0));
