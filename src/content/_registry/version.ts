/**
 * HIGAET Registry System — Version Manifest
 * ---------------------------------------------------------------
 * Single authoritative source of identity and version semantics
 * for the canonical Registry System used across the HIGAET
 * ecosystem (Academy, Technologies, Global Education Hub, Blog,
 * Careers, AI Platform, LMS, and the future backend API).
 *
 * Layer:        src/content/_registry/version.ts
 * Step:         Workstream A.1 — Step 4
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - No imports. No runtime logic. No helpers.
 *   - Constants and `as const` literals only.
 *   - Treat this file as the package manifest of the Registry System.
 *
 * VERSION GOVERNANCE
 * ---------------------------------------------------------------
 * The Registry System version is independent of any division
 * registry version (e.g. `ACADEMY_REGISTRY_VERSION`). Division
 * registries declare which Registry System major version they
 * target via `COMPATIBLE_REGISTRY_SYSTEM_MAJOR`.
 *
 * | Change                          | System version bump  |
 * | ------------------------------- | -------------------- |
 * | Add optional field to a type    | None                 |
 * | Add new optional contract       | Minor (1.0 → 1.1)    |
 * | Add new validator family        | Minor (1.0 → 1.1)    |
 * | Rename / remove / retype field  | Major (1.x → 2.0)    |
 * | Remove an exported symbol       | Major (1.x → 2.0)    |
 *
 * Major bumps require a superseding ADR; the prior ADR's status
 * is updated to `Superseded by ADR-NNNN` and never edited otherwise.
 * ---------------------------------------------------------------
 */

/**
 * Current version of the canonical HIGAET Registry System.
 * Use this for compatibility checks at registry load time and as
 * a versioned key for future API negotiations.
 */
export const REGISTRY_SYSTEM_VERSION = "1.0" as const;

/**
 * Major version line of the current Registry System. Division
 * registries declare the major version they were authored against;
 * a mismatch indicates a breaking change that requires migration.
 */
export const REGISTRY_SYSTEM_MAJOR = 1 as const;

/**
 * Minor version line of the current Registry System. Incremented
 * for additive changes (new optional fields, new contracts, new
 * validator families) that remain backward compatible.
 */
export const REGISTRY_SYSTEM_MINOR = 0 as const;

/**
 * Stable identifier for the Registry System. Used in logs,
 * dashboards, and future API headers so multiple systems can
 * coexist without ambiguity.
 */
export const REGISTRY_SYSTEM_ID = "higaet.registry" as const;

/**
 * Human label for the Registry System. Surfaced in dev tools and
 * admin diagnostics.
 */
export const REGISTRY_SYSTEM_LABEL = "HIGAET Registry System" as const;

/**
 * Date this version was accepted (ISO 8601). Mirrors ADR-0001.
 */
export const REGISTRY_SYSTEM_RELEASED_AT = "2026-06-14" as const;
