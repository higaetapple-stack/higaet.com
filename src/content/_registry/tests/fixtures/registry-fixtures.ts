/**
 * HIGAET Registry System — Test Fixtures
 * ---------------------------------------------------------------
 * Division-agnostic fixtures used by the parameterized registry
 * test suite. Each fixture is the smallest possible dataset that
 * exercises a single validator outcome.
 *
 * Layer:        src/content/_registry/tests/fixtures/registry-fixtures.ts
 * Step:         Workstream A.1 — Step 5
 *
 * RULES:
 *   - No Academy / Technologies / Hub specifics.
 *   - No real production content.
 *   - Imports only from the Registry System public API.
 * ---------------------------------------------------------------
 */

import type {
  AuditMeta,
  BaseEntry,
  CategoryEntry,
  CourseEntry,
  LearningPathEntry,
  RegistryValidationInput,
  SeoMeta,
  TestimonialEntry,
} from "../../index";

const AUDIT: AuditMeta = {
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  version: "1.0",
  author: "TEST",
};

const SEO = (title: string, description: string): SeoMeta => ({
  title,
  description,
  keywords: ["test"],
});

const base = <T extends BaseEntry>(overrides: Partial<T> & { id: string; slug: string }): BaseEntry => ({
  status: "published",
  visibility: "public",
  metadata: SEO("Title", "Description"),
  audit: AUDIT,
  ...overrides,
});

const cat = (over: Partial<CategoryEntry> & { id: string; slug: string }): CategoryEntry => ({
  ...(base(over) as BaseEntry),
  name: over.name ?? `Category ${over.id}`,
});

const course = (
  over: Partial<CourseEntry> & { id: string; slug: string; categoryId: string },
): CourseEntry => ({
  ...(base(over) as BaseEntry),
  title: over.title ?? `Course ${over.id}`,
  summary: over.summary ?? "Summary",
  categoryId: over.categoryId,
});

const path = (
  over: Partial<LearningPathEntry> & {
    id: string;
    slug: string;
    courseIds: readonly string[];
  },
): LearningPathEntry => ({
  ...(base(over) as BaseEntry),
  title: over.title ?? `Path ${over.id}`,
  summary: over.summary ?? "Summary",
  courseIds: over.courseIds,
});

const testimonial = (
  over: Partial<TestimonialEntry> & { id: string; slug: string },
): TestimonialEntry => ({
  ...(base(over) as BaseEntry),
  name: over.name ?? "Test Person",
  quote: over.quote ?? "A quote.",
});

/* ---------- Valid baseline ---------- */
export const validRegistry: RegistryValidationInput = {
  source: "test.valid",
  categories: [cat({ id: "cat_a", slug: "cat-a" })],
  courses: [course({ id: "crs_a", slug: "crs-a", categoryId: "cat_a" })],
  learningPaths: [path({ id: "pth_a", slug: "pth-a", courseIds: ["crs_a"] })],
  testimonials: [testimonial({ id: "tst_a", slug: "tst-a", subjectId: "crs_a" })],
};

/* ---------- Negative fixtures ---------- */
export const duplicateIdsRegistry: RegistryValidationInput = {
  source: "test.duplicate-ids",
  categories: [
    cat({ id: "dup", slug: "cat-a" }),
    cat({ id: "dup", slug: "cat-b" }),
  ],
  courses: [],
  learningPaths: [],
  testimonials: [],
};

export const duplicateSlugsRegistry: RegistryValidationInput = {
  source: "test.duplicate-slugs",
  categories: [
    cat({ id: "cat_a", slug: "same" }),
    cat({ id: "cat_b", slug: "same" }),
  ],
  courses: [],
  learningPaths: [],
  testimonials: [],
};

export const orphanCourseRegistry: RegistryValidationInput = {
  source: "test.orphan-course",
  categories: [cat({ id: "cat_a", slug: "cat-a" })],
  courses: [
    course({ id: "crs_a", slug: "crs-a", categoryId: "missing_category" }),
  ],
  learningPaths: [],
  testimonials: [],
};

export const orphanPathCourseRegistry: RegistryValidationInput = {
  source: "test.orphan-path-course",
  categories: [cat({ id: "cat_a", slug: "cat-a" })],
  courses: [course({ id: "crs_a", slug: "crs-a", categoryId: "cat_a" })],
  learningPaths: [
    path({ id: "pth_a", slug: "pth-a", courseIds: ["crs_a", "missing_course"] }),
  ],
  testimonials: [],
};

export const missingSeoRegistry: RegistryValidationInput = {
  source: "test.missing-seo",
  categories: [
    {
      ...cat({ id: "cat_a", slug: "cat-a" }),
      metadata: { title: "", description: "", keywords: [] },
    },
  ],
  courses: [],
  learningPaths: [],
  testimonials: [],
};

export const invalidEnumRegistry: RegistryValidationInput = {
  source: "test.invalid-enum",
  categories: [
    {
      ...cat({ id: "cat_a", slug: "cat-a" }),
      // Intentionally bad — cast through unknown to exercise the validator.
      status: "bogus" as unknown as CategoryEntry["status"],
    },
  ],
  courses: [],
  learningPaths: [],
  testimonials: [],
};

export const emptyPathRegistry: RegistryValidationInput = {
  source: "test.empty-path",
  categories: [cat({ id: "cat_a", slug: "cat-a" })],
  courses: [course({ id: "crs_a", slug: "crs-a", categoryId: "cat_a" })],
  learningPaths: [path({ id: "pth_a", slug: "pth-a", courseIds: [] })],
  testimonials: [],
};
