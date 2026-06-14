/**
 * HIGAET Registry System — Public API
 * ---------------------------------------------------------------
 * Aggregation barrel. Everything exported from this file is part
 * of the STABLE PUBLIC API of the Registry System and is governed
 * by the rules in `./version.ts`.
 *
 * Layer:        src/content/_registry/index.ts
 * Step:         Workstream A.1 — Step 4
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - Re-exports only. No business logic.
 *   - No execution of validators. No provider instantiation.
 *   - No imports from `../academy/*`, `../providers/*`, or any
 *     division registry. The Registry System is division-agnostic.
 *   - Internal helpers must NOT be re-exported here unless they
 *     are intended as long-term public API.
 *
 * BACKEND BOUNDARY (per ADR-0001)
 * ---------------------------------------------------------------
 * Everything under `src/content/` is a temporary frontend data
 * source. Components must depend ONLY on the provider layer
 * (`@/content/providers`), never on a division registry directly.
 * When v1.6 introduces the Node.js + Express + MySQL API, only
 * the provider implementation changes — every consumer using this
 * public API remains untouched.
 * ---------------------------------------------------------------
 */

/* ---- Core Types ---------------------------------------------- */
export type {
  BaseEntry,
  SeoMeta,
  AuditMeta,
  Status,
  Visibility,
} from "./types";

/* ---- Relationship Types -------------------------------------- */
export type {
  CategoryId,
  CourseId,
  LearningPathId,
  TestimonialId,
  SearchRecordId,
} from "./types";

/* ---- Shared Utility Types ------------------------------------ */
export type {
  EntityReference,
  EntityStatus,
  VisibilityFilter,
  SortDirection,
  SortOptions,
  PaginationOptions,
  QueryOptions,
} from "./types";

/* ---- Division Entry Types ------------------------------------ */
export type {
  CategoryEntry,
  CourseEntry,
  LearningPathEntry,
  TestimonialEntry,
  SearchRecord,
  SitemapEntry,
  BreadcrumbEntry,
} from "./types";

/* ---- Registry Contracts -------------------------------------- */
export type {
  RegistryContract,
  CategoryContract,
  CourseContract,
  LearningPathContract,
  TestimonialContract,
  SearchRecordContract,
  SitemapContract,
  BreadcrumbContract,
} from "./contracts";

/* ---- Provider Contracts -------------------------------------- */
export type {
  ProviderResult,
  ProviderFilter,
  ProviderPagination,
  ProviderSort,
  ProviderOptions,
  ProviderGetter,
  ProviderResolver,
} from "./contracts";

/* ---- Generator Contracts ------------------------------------- */
export type {
  SearchGeneratorContract,
  BreadcrumbGeneratorContract,
  SitemapGeneratorContract,
} from "./contracts";

/* ---- Validation: Types --------------------------------------- */
export type {
  ValidationSeverity,
  ValidationCategory,
  ValidationFinding,
  ValidationReport,
  RegistryValidationInput,
} from "./validate";

/* ---- Validation: Functions ----------------------------------- */
export {
  validateEntryStructure,
  validateStructure,
  validateRelationships,
  validateQuality,
  validateRegistry,
  formatReport,
  reportRegistryDev,
  reportRegistryProd,
  validateAndReport,
} from "./validate";

/* ---- Version Manifest ---------------------------------------- */
export {
  REGISTRY_SYSTEM_VERSION,
  REGISTRY_SYSTEM_MAJOR,
  REGISTRY_SYSTEM_MINOR,
  REGISTRY_SYSTEM_ID,
  REGISTRY_SYSTEM_LABEL,
  REGISTRY_SYSTEM_RELEASED_AT,
} from "./version";
