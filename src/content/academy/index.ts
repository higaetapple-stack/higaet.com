/**
 * HIGAET Academy — Internal Registry Barrel
 * ---------------------------------------------------------------
 * The internal organizing point for the Academy registry module.
 *
 * THIS IS NOT THE PUBLIC API.
 *
 * The public API for application code is and remains:
 *
 *   import { ... } from "@/content/providers";
 *
 * Importing Academy registries directly from outside the provider
 * layer is forbidden by ESLint `no-restricted-imports` (ADR-0001).
 *
 * Layer:        src/content/academy/index.ts
 * Workstream:   A.2 — Step 7
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - Re-exports + a single development-only validation invocation.
 *   - No business logic, no UI logic, no provider logic.
 *   - Dependency direction is strictly one-way:
 *
 *       academy/*  →  academy/index.ts  →  providers/academy.ts
 *
 *   - Never import from `@/content/providers/*` here — that would
 *     create a cycle.
 *
 * VALIDATION GATE
 * ---------------------------------------------------------------
 * On import, this barrel runs `validateAndReport` against the
 * fully-populated Academy registry input.
 *
 *   - Development → `reportRegistryDev` logs errors loudly.
 *   - Production  → `reportRegistryProd` reports without crashing
 *                   the application.
 *
 * This mirrors the Registry SDK behavior and keeps misconfiguration
 * obvious during local development without taking down production.
 * ---------------------------------------------------------------
 */

import { validateAndReport } from "@/content/_registry/validate";

import {
  ACADEMY_REGISTRY_NAME,
  ACADEMY_REGISTRY_VERSION,
  ACADEMY_REGISTRY_MAJOR,
  COMPATIBLE_REGISTRY_SYSTEM_MAJOR,
} from "@/content/academy/version";

import {
  ACADEMY_CATEGORIES,
  ACADEMY_CATEGORY_IDS,
} from "@/content/academy/categories";

import {
  ACADEMY_COURSES,
  ACADEMY_COURSE_IDS,
} from "@/content/academy/courses";

import {
  ACADEMY_LEARNING_PATHS,
  ACADEMY_LEARNING_PATH_IDS,
} from "@/content/academy/learning-paths";

import {
  ACADEMY_TESTIMONIALS,
  ACADEMY_TESTIMONIAL_IDS,
} from "@/content/academy/testimonials";

import { ACADEMY_SEARCH_INDEX } from "@/content/academy/generated/search-index";
import {
  ACADEMY_SITEMAP,
  ACADEMY_SITEMAP_BASE_URL,
} from "@/content/academy/generated/sitemap";
import {
  ACADEMY_BREADCRUMBS,
  type BreadcrumbTrail,
} from "@/content/academy/generated/breadcrumbs";

/* ----------------------------------------------------------------
 * Re-exports — Version
 * ---------------------------------------------------------------- */

export {
  ACADEMY_REGISTRY_NAME,
  ACADEMY_REGISTRY_VERSION,
  ACADEMY_REGISTRY_MAJOR,
  COMPATIBLE_REGISTRY_SYSTEM_MAJOR,
};

/* ----------------------------------------------------------------
 * Re-exports — Registries
 * ---------------------------------------------------------------- */

export {
  ACADEMY_CATEGORIES,
  ACADEMY_CATEGORY_IDS,
  ACADEMY_COURSES,
  ACADEMY_COURSE_IDS,
  ACADEMY_LEARNING_PATHS,
  ACADEMY_LEARNING_PATH_IDS,
  ACADEMY_TESTIMONIALS,
  ACADEMY_TESTIMONIAL_IDS,
};

/* ----------------------------------------------------------------
 * Re-exports — Generated Read Models
 * ---------------------------------------------------------------- */

export {
  ACADEMY_SEARCH_INDEX,
  ACADEMY_SITEMAP,
  ACADEMY_SITEMAP_BASE_URL,
  ACADEMY_BREADCRUMBS,
};

export type { BreadcrumbTrail };

/* ----------------------------------------------------------------
 * Validation Gate (runs at import time)
 * ---------------------------------------------------------------- */

validateAndReport(
  {
    source: ACADEMY_REGISTRY_NAME,
    categories: ACADEMY_CATEGORIES,
    courses: ACADEMY_COURSES,
    learningPaths: ACADEMY_LEARNING_PATHS,
    testimonials: ACADEMY_TESTIMONIALS,
  },
  import.meta.env.DEV,
);
