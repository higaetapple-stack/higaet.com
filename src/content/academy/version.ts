/**
 * HIGAET Academy Registry — Version Manifest
 * ---------------------------------------------------------------
 * Single authoritative source of identity and version semantics
 * for the Academy division registry (categories, courses, learning
 * paths, testimonials, generated artifacts).
 *
 * Layer:        src/content/academy/version.ts
 * Workstream:   A.2 — Step 1
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - No imports. No runtime logic. No helpers.
 *   - Constants and `as const` literals only.
 *   - Treat this file as the Academy registry's package manifest.
 *
 * RELATIONSHIP TO THE REGISTRY SDK
 * ---------------------------------------------------------------
 * The Academy registry version is INDEPENDENT of the shared
 * Registry SDK version (`REGISTRY_SYSTEM_VERSION`). Academy
 * declares the Registry SDK major version it was authored
 * against via `COMPATIBLE_REGISTRY_SYSTEM_MAJOR`. A mismatch at
 * load time indicates a breaking SDK change that requires an
 * Academy migration.
 *
 * VERSION GOVERNANCE
 * ---------------------------------------------------------------
 * | Change                                  | Academy bump        |
 * | --------------------------------------- | ------------------- |
 * | Add a new course / category / path      | None (data only)    |
 * | Add a new optional field on an entry    | Minor (1.0 → 1.1)   |
 * | Add a new entry family                  | Minor (1.0 → 1.1)   |
 * | Remove / rename a public field          | Major (1.x → 2.0)   |
 * | Remove a published slug (URL breakage)  | Major (1.x → 2.0)   |
 *
 * Major bumps require a new ADR documenting the migration path
 * for SEO, sitemap, and consumer compatibility.
 * ---------------------------------------------------------------
 */

/**
 * Human-readable identifier for the Academy division registry.
 */
export const ACADEMY_REGISTRY_NAME = "higaet-academy" as const;

/**
 * Current version of the Academy registry payload (data + shape).
 */
export const ACADEMY_REGISTRY_VERSION = "1.0" as const;

/**
 * Major version line of the Academy registry. Consumers may pin
 * to this to detect breaking Academy-level changes.
 */
export const ACADEMY_REGISTRY_MAJOR = 1 as const;

/**
 * The Registry SDK major version this Academy registry was
 * authored against. A runtime mismatch with
 * `REGISTRY_SYSTEM_MAJOR` indicates a breaking SDK change.
 */
export const COMPATIBLE_REGISTRY_SYSTEM_MAJOR = 1 as const;
