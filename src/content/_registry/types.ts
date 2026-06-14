/**
 * HIGAET Registry System — Core Type Definitions
 * ---------------------------------------------------------------
 * Single source of truth for every registry across the HIGAET
 * ecosystem: Academy, Technologies, Global Education Hub, Blog,
 * Careers, AI Platform, LMS, and the future backend API.
 *
 * Layer:        src/content/_registry/types.ts
 * Step:         Workstream A.1 — Step 1
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - Types, interfaces, and type aliases ONLY.
 *   - Zero runtime JavaScript. Zero imports. Zero `any`.
 *   - No validation logic, helpers, constants, data, or providers.
 *   - Adding optional fields: allowed (no version bump).
 *   - Renaming / removing / retyping fields: forbidden without a
 *     major bump and a superseding ADR.
 * ---------------------------------------------------------------
 */

/* ================================================================
 * SECTION 1 — Core Types
 * ============================================================== */

/**
 * Lifecycle state of any registry entry.
 *
 * - `draft`       — authoring in progress; never rendered publicly.
 * - `comingSoon`  — visible in catalogs as a teaser; not bookable.
 * - `published`   — production-ready; included in SEO and search.
 * - `archived`    — kept for history; hidden from default queries.
 */
export type Status = "draft" | "comingSoon" | "published" | "archived";

/**
 * Audience scope for a registry entry.
 *
 * - `public`    — anyone on the public website.
 * - `private`   — authenticated learners / customers.
 * - `internal`  — HIGAET staff, admins, partners.
 */
export type Visibility = "public" | "private" | "internal";

/**
 * SEO and social metadata attached to every entry.
 *
 * Consumed directly by route `head()`, JSON-LD builders, sitemap
 * generators, and Open Graph emitters. Centralizing these fields
 * guarantees that every public entry is share-ready by construction.
 */
export interface SeoMeta {
  /** `<title>` value. Should stay ≤60 characters for SERP display. */
  title: string;
  /** `<meta name="description">`. Should stay ≤160 characters. */
  description: string;
  /** Keywords used by internal search and analytics. Not emitted to `<meta name="keywords">`. */
  keywords: readonly string[];
  /** Absolute canonical URL. When omitted, derived from the entry slug. */
  canonical?: string;
  /** Open Graph / Twitter card image URL. Omit when no meaningful image exists. */
  ogImage?: string;
}

/**
 * Provenance and lifecycle metadata attached to every entry.
 *
 * Static today (author = `"HIGAET"`, dates set by hand). When the
 * v1.6 backend lands, the database will populate these fields and
 * the static defaults become initial seed values.
 */
export interface AuditMeta {
  /** ISO 8601 timestamp of original creation. Immutable. */
  createdAt: string;
  /** ISO 8601 timestamp of last meaningful update. */
  updatedAt: string;
  /** Per-entry content version (independent of registry version). */
  version: string;
  /** Author or owning team. `"HIGAET"` is the default placeholder. */
  author: string;
}

/**
 * Shape every registry entry inherits.
 *
 * Cross-references between registries use `id`, never `slug`, so
 * URLs can change without breaking data integrity or analytics.
 */
export interface BaseEntry {
  /**
   * Stable identifier used across registries, backend APIs,
   * analytics, and future databases. Never exposed in URLs.
   * Immutable after creation.
   */
  id: string;
  /**
   * URL-facing key. May be changed (with a redirect) without
   * affecting database identity or cross-references.
   */
  slug: string;
  /** Lifecycle state — controls public visibility. */
  status: Status;
  /** Audience scope — controls who may see the entry. */
  visibility: Visibility;
  /** SEO and social metadata. */
  metadata: SeoMeta;
  /** Provenance and lifecycle metadata. */
  audit: AuditMeta;
}

/* ================================================================
 * SECTION 2 — Relationship Types
 * ----------------------------------------------------------------
 * Branded string aliases that document intent in function
 * signatures and prevent accidental cross-domain mixing. All are
 * structurally `string`; the names communicate purpose to readers
 * and tooling.
 * ============================================================== */

/** Identifier of a `CategoryEntry`. */
export type CategoryId = string;
/** Identifier of a `CourseEntry`. */
export type CourseId = string;
/** Identifier of a `LearningPathEntry`. */
export type LearningPathId = string;
/** Identifier of a `TestimonialEntry`. */
export type TestimonialId = string;
/** Identifier of a `SearchRecord`. */
export type SearchRecordId = string;

/* ================================================================
 * SECTION 3 — Shared Utility Types
 * ============================================================== */

/**
 * Lightweight reference to another entry by id and (optionally)
 * resolved slug. Used in derived artifacts where embedding the
 * full target entry would bloat the payload.
 */
export interface EntityReference {
  /** Target entry id. */
  id: string;
  /** Resolved slug at generation time. May be stale if the slug changes. */
  slug?: string;
  /** Optional human label for debug output. */
  label?: string;
}

/**
 * Re-export of `Status` for use in filter signatures where the
 * caller is filtering BY status rather than declaring an entry's
 * own status. Improves readability of provider signatures.
 */
export type EntityStatus = Status;

/**
 * Filter accepted by providers to narrow results by audience.
 * `"any"` bypasses the filter entirely (admin / internal tooling).
 */
export type VisibilityFilter = Visibility | "any";

/** Ascending or descending order for `SortOptions`. */
export type SortDirection = "asc" | "desc";

/**
 * Sort instruction accepted by providers.
 *
 * @typeParam TEntry — the entry type being sorted, used to constrain
 *                     `field` to its own keys.
 */
export interface SortOptions<TEntry extends BaseEntry = BaseEntry> {
  /** Key of `TEntry` to sort by. */
  field: keyof TEntry;
  /** Direction of the sort. Defaults to `"asc"` if omitted by the provider. */
  direction?: SortDirection;
}

/**
 * Pagination instruction accepted by providers. Cursor pagination
 * is intentionally omitted in v1.0 — page/limit is sufficient for
 * the current dataset sizes and trivially mappable onto SQL LIMIT/OFFSET later.
 */
export interface PaginationOptions {
  /** 1-based page index. */
  page?: number;
  /** Maximum number of entries to return. */
  limit?: number;
  /** Alternative to `page` — number of entries to skip. */
  offset?: number;
}

/**
 * Uniform query envelope accepted by every provider getter.
 *
 * Keeps consumer call sites consistent across divisions and gives
 * the v1.6 backend a stable contract to translate into SQL.
 *
 * @typeParam TEntry  — the entry type being queried.
 * @typeParam TFilter — division-specific filter extensions.
 */
export interface QueryOptions<
  TEntry extends BaseEntry = BaseEntry,
  TFilter = Record<string, unknown>,
> {
  /** Restrict by lifecycle state. Multiple values combine with OR. */
  status?: EntityStatus | readonly EntityStatus[];
  /** Restrict by audience. `"any"` bypasses the filter. */
  visibility?: VisibilityFilter;
  /** Include `draft` entries in results. Default is `false`. */
  includeDraft?: boolean;
  /** Pagination instruction. */
  pagination?: PaginationOptions;
  /** Sort instruction. */
  sort?: SortOptions<TEntry>;
  /** Division-specific filter extensions (e.g. `categoryId`). */
  filter?: TFilter;
}

/* ================================================================
 * SECTION 4 — Division Entry Types
 * ----------------------------------------------------------------
 * Concrete entries that division registries implement. Each
 * extends `BaseEntry` so cross-cutting concerns (SEO, audit,
 * status, visibility) stay uniform.
 * ============================================================== */

/**
 * Top-level pillar within a division (e.g. Academy "Online Courses",
 * Hub "Study Destinations"). Categories own a stable id and slug,
 * carry an icon name (resolved to a Lucide component at render
 * time), and provide ordering hints for nav surfaces.
 */
export interface CategoryEntry extends BaseEntry {
  /** Display name shown in nav, mega-menu, and breadcrumbs. */
  name: string;
  /** Short tagline used under the category name. */
  tagline?: string;
  /** Lucide icon name. Resolved at render time, not stored as a component. */
  icon?: string;
  /** Lower numbers sort first in nav surfaces. */
  order?: number;
}

/**
 * Course offered by a HIGAET division. Future LMS records will
 * extend this contract with enrollment, cohort, and progress data.
 */
export interface CourseEntry extends BaseEntry {
  /** Display title shown on the course card and detail page. */
  title: string;
  /** One-sentence summary for cards and search results. */
  summary: string;
  /** Owning category. References `CategoryEntry.id`. */
  categoryId: CategoryId;
  /** Human-readable duration label (e.g. `"12 weeks"`). */
  duration?: string;
  /** Skill level. */
  level?: "beginner" | "intermediate" | "advanced";
  /** Delivery mode. */
  mode?: "online" | "offline" | "hybrid";
  /** Outcome bullets shown on the detail page. */
  outcomes?: readonly string[];
  /** Ordered module / week titles. */
  curriculum?: readonly string[];
  /** Frequently asked questions block. */
  faqs?: readonly { question: string; answer: string }[];
}

/**
 * Career or capability track composed of ordered course references.
 * Renders as a multi-step learning journey on the public site.
 */
export interface LearningPathEntry extends BaseEntry {
  /** Display title of the path. */
  title: string;
  /** Marketing summary shown on cards and the detail page. */
  summary: string;
  /** Ordered course references. References `CourseEntry.id`. */
  courseIds: readonly CourseId[];
  /** Estimated total duration label. */
  duration?: string;
  /** Target audience (e.g. `"working professionals"`). */
  audience?: string;
}

/**
 * Alumni or customer quote attached to a division. Optional
 * `subjectId` lets a testimonial be associated with a specific
 * course or learning path for contextual display.
 */
export interface TestimonialEntry extends BaseEntry {
  /** Quoted person's display name. */
  name: string;
  /** Role / title at quote time. */
  role?: string;
  /** Company or organization at quote time. */
  company?: string;
  /** The quote itself. Plain text; no HTML. */
  quote: string;
  /** Optional avatar URL. */
  avatar?: string;
  /** Optional related entry id (course, learning path, etc.). */
  subjectId?: string;
}

/**
 * Flat record produced by the generated search index. Optimized
 * for client-side fuzzy search today and Meilisearch / Algolia
 * ingestion later.
 */
export interface SearchRecord {
  /** Stable identifier for the search record. */
  id: SearchRecordId;
  /** Origin entry kind. */
  kind: "category" | "course" | "learning-path" | "page";
  /** Display title shown in search results. */
  title: string;
  /** Optional description / snippet shown under the title. */
  description?: string;
  /** Internal route the record links to. */
  url: string;
  /** Keywords aggregated from the source entry. */
  keywords: readonly string[];
  /** Owning division — enables cross-division federated search. */
  division: "academy" | "technologies" | "hub";
}

/**
 * Sitemap row emitted by the generated sitemap. Mapped directly to
 * `<url>` entries in the public sitemap.xml.
 */
export interface SitemapEntry {
  /** Absolute URL of the page. */
  loc: string;
  /** ISO 8601 last-modified timestamp. */
  lastmod?: string;
  /** Update frequency hint for crawlers. */
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  /** Relative priority (0.0 – 1.0). */
  priority?: number;
}

/**
 * Single hop in a breadcrumb trail. Generated from the registry
 * graph so every public page has a consistent crumb chain.
 */
export interface BreadcrumbEntry {
  /** Display label for the crumb. */
  label: string;
  /** Internal route the crumb links to. Omit for the current page. */
  url?: string;
}
