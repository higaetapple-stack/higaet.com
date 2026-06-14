/**
 * HIGAET Registry System — Validation
 * ---------------------------------------------------------------
 * Pure, composable validators that enforce the integrity of every
 * registry across the HIGAET ecosystem.
 *
 * Layer:        src/content/_registry/validate.ts
 * Step:         Workstream A.1 — Step 3
 * Decision:     ADR-0001 (Registry Architecture)
 *
 * RULES (enforced by review):
 *   - Imports only from `./types` and `./contracts`.
 *   - No registry content. No provider logic. No generators.
 *   - Pure functions only. No I/O, no console writes outside the
 *     dev-mode reporter helpers.
 *   - Three validator families: structure, relationships, quality.
 *   - Returns a structured `ValidationReport`. The top-level
 *     `validateRegistry()` orchestrator composes the three families
 *     and returns the merged report. Callers decide whether to
 *     throw (development) or log (production).
 *   - Strict TypeScript, zero `any`.
 * ---------------------------------------------------------------
 */

import type {
  BaseEntry,
  CategoryEntry,
  CourseEntry,
  LearningPathEntry,
  TestimonialEntry,
  Status,
  Visibility,
} from "./types";

/* ================================================================
 * SECTION 1 — Report Types
 * ============================================================== */

/** Severity of a validation finding. */
export type ValidationSeverity = "error" | "warning";

/** Category of a validation finding — maps to validator family. */
export type ValidationCategory =
  | "structure"
  | "relationship"
  | "quality";

/**
 * Single validation finding. Stable across versions; callers may
 * persist or surface these in dashboards.
 */
export interface ValidationFinding {
  /** Severity — `error` fails dev; `warning` informs only. */
  severity: ValidationSeverity;
  /** Family this finding originated from. */
  category: ValidationCategory;
  /** Stable, machine-readable code (e.g. `"DUPLICATE_ID"`). */
  code: string;
  /** Human-readable description suitable for logs and dashboards. */
  message: string;
  /** Entry id the finding refers to, when applicable. */
  entryId?: string;
  /** Field name the finding refers to, when applicable. */
  field?: string;
  /** Registry the finding originated from (e.g. `"academy.courses"`). */
  source?: string;
}

/**
 * Aggregate validation report returned by every validator. The
 * shape is stable so dev/prod reporters and future dashboards can
 * consume it uniformly.
 */
export interface ValidationReport {
  /** All `severity: "error"` findings. */
  readonly errors: readonly ValidationFinding[];
  /** All `severity: "warning"` findings. */
  readonly warnings: readonly ValidationFinding[];
  /** Convenience aggregates. */
  readonly summary: {
    readonly errorCount: number;
    readonly warningCount: number;
    readonly entriesChecked: number;
    readonly ok: boolean;
  };
}

/** Input bundle accepted by the top-level orchestrator. */
export interface RegistryValidationInput {
  /** Source label for findings (e.g. `"academy"`). */
  readonly source: string;
  /** Categories under test. */
  readonly categories: readonly CategoryEntry[];
  /** Courses under test. */
  readonly courses: readonly CourseEntry[];
  /** Learning paths under test. */
  readonly learningPaths: readonly LearningPathEntry[];
  /** Testimonials under test. */
  readonly testimonials: readonly TestimonialEntry[];
}

/* ================================================================
 * SECTION 2 — Internal Helpers (module-private)
 * ============================================================== */

const VALID_STATUS: readonly Status[] = [
  "draft",
  "comingSoon",
  "published",
  "archived",
];
const VALID_VISIBILITY: readonly Visibility[] = [
  "public",
  "private",
  "internal",
];

const SEO_TITLE_MAX = 60;
const SEO_DESCRIPTION_MAX = 160;

/** Create an empty report. */
function emptyReport(entriesChecked = 0): ValidationReport {
  return {
    errors: [],
    warnings: [],
    summary: { errorCount: 0, warningCount: 0, entriesChecked, ok: true },
  };
}

/** Merge any number of reports into one. */
function mergeReports(
  reports: readonly ValidationReport[],
  entriesChecked: number,
): ValidationReport {
  const errors = reports.flatMap((r) => r.errors);
  const warnings = reports.flatMap((r) => r.warnings);
  return {
    errors,
    warnings,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      entriesChecked,
      ok: errors.length === 0,
    },
  };
}

/** Build a report from a flat finding array. */
function report(
  findings: readonly ValidationFinding[],
  entriesChecked: number,
): ValidationReport {
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  return {
    errors,
    warnings,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      entriesChecked,
      ok: errors.length === 0,
    },
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/* ================================================================
 * SECTION 3 — Structural Validation
 * ----------------------------------------------------------------
 * Required fields, field types, enum membership, empty strings
 * where not allowed. Operates on a single entry at a time so the
 * checker can be reused for any registry whose entries extend
 * `BaseEntry`.
 * ============================================================== */

/**
 * Validate a single entry's structural integrity.
 * Pure — does not throw, returns findings.
 */
export function validateEntryStructure(
  entry: BaseEntry,
  source: string,
): readonly ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const base = { category: "structure" as const, source, entryId: entry.id };

  if (!isNonEmptyString(entry.id)) {
    findings.push({
      ...base,
      severity: "error",
      code: "MISSING_ID",
      field: "id",
      message: "Entry has no `id`.",
    });
  }
  if (!isNonEmptyString(entry.slug)) {
    findings.push({
      ...base,
      severity: "error",
      code: "MISSING_SLUG",
      field: "slug",
      message: "Entry has no `slug`.",
    });
  }
  if (!VALID_STATUS.includes(entry.status)) {
    findings.push({
      ...base,
      severity: "error",
      code: "INVALID_STATUS",
      field: "status",
      message: `Entry status \`${String(entry.status)}\` is not a valid Status.`,
    });
  }
  if (!VALID_VISIBILITY.includes(entry.visibility)) {
    findings.push({
      ...base,
      severity: "error",
      code: "INVALID_VISIBILITY",
      field: "visibility",
      message: `Entry visibility \`${String(entry.visibility)}\` is not a valid Visibility.`,
    });
  }
  if (!entry.metadata || typeof entry.metadata !== "object") {
    findings.push({
      ...base,
      severity: "error",
      code: "MISSING_METADATA",
      field: "metadata",
      message: "Entry has no `metadata` object.",
    });
  }
  if (!entry.audit || typeof entry.audit !== "object") {
    findings.push({
      ...base,
      severity: "error",
      code: "MISSING_AUDIT",
      field: "audit",
      message: "Entry has no `audit` object.",
    });
  } else {
    if (!isNonEmptyString(entry.audit.createdAt)) {
      findings.push({
        ...base,
        severity: "error",
        code: "MISSING_CREATED_AT",
        field: "audit.createdAt",
        message: "Entry `audit.createdAt` is empty.",
      });
    }
    if (!isNonEmptyString(entry.audit.updatedAt)) {
      findings.push({
        ...base,
        severity: "error",
        code: "MISSING_UPDATED_AT",
        field: "audit.updatedAt",
        message: "Entry `audit.updatedAt` is empty.",
      });
    }
    if (
      isNonEmptyString(entry.audit.createdAt) &&
      isNonEmptyString(entry.audit.updatedAt) &&
      new Date(entry.audit.updatedAt).getTime() <
        new Date(entry.audit.createdAt).getTime()
    ) {
      findings.push({
        ...base,
        severity: "error",
        code: "AUDIT_DATE_INVERTED",
        field: "audit",
        message: "`audit.updatedAt` is earlier than `audit.createdAt`.",
      });
    }
  }

  return findings;
}

/**
 * Validate structural integrity across all entries in the input.
 */
export function validateStructure(
  input: RegistryValidationInput,
): ValidationReport {
  const all: BaseEntry[] = [
    ...input.categories,
    ...input.courses,
    ...input.learningPaths,
    ...input.testimonials,
  ];
  const findings = all.flatMap((e) =>
    validateEntryStructure(e, input.source),
  );
  return report(findings, all.length);
}

/* ================================================================
 * SECTION 4 — Relationship Validation
 * ----------------------------------------------------------------
 * IDs resolve. No orphan references. No orphan courses (every
 * course resolves to an existing category).
 * ============================================================== */

/**
 * Validate cross-entity references between categories, courses,
 * and learning paths.
 */
export function validateRelationships(
  input: RegistryValidationInput,
): ValidationReport {
  const findings: ValidationFinding[] = [];
  const categoryIds = new Set(input.categories.map((c) => c.id));
  const courseIds = new Set(input.courses.map((c) => c.id));

  for (const course of input.courses) {
    if (!categoryIds.has(course.categoryId)) {
      findings.push({
        severity: "error",
        category: "relationship",
        code: "COURSE_ORPHAN_CATEGORY",
        message: `Course \`${course.id}\` references missing category \`${course.categoryId}\`.`,
        entryId: course.id,
        field: "categoryId",
        source: input.source,
      });
    }
  }

  for (const path of input.learningPaths) {
    if (path.courseIds.length === 0) {
      findings.push({
        severity: "warning",
        category: "relationship",
        code: "PATH_EMPTY",
        message: `Learning path \`${path.id}\` has zero courses.`,
        entryId: path.id,
        field: "courseIds",
        source: input.source,
      });
    }
    for (const courseId of path.courseIds) {
      if (!courseIds.has(courseId)) {
        findings.push({
          severity: "error",
          category: "relationship",
          code: "PATH_ORPHAN_COURSE",
          message: `Learning path \`${path.id}\` references missing course \`${courseId}\`.`,
          entryId: path.id,
          field: "courseIds",
          source: input.source,
        });
      }
    }
  }

  for (const t of input.testimonials) {
    if (
      t.subjectId !== undefined &&
      !courseIds.has(t.subjectId) &&
      !categoryIds.has(t.subjectId) &&
      !input.learningPaths.some((p) => p.id === t.subjectId)
    ) {
      findings.push({
        severity: "warning",
        category: "relationship",
        code: "TESTIMONIAL_ORPHAN_SUBJECT",
        message: `Testimonial \`${t.id}\` references missing subject \`${t.subjectId}\`.`,
        entryId: t.id,
        field: "subjectId",
        source: input.source,
      });
    }
  }

  const entriesChecked =
    input.courses.length +
    input.learningPaths.length +
    input.testimonials.length;
  return report(findings, entriesChecked);
}

/* ================================================================
 * SECTION 5 — Quality Validation
 * ----------------------------------------------------------------
 * Duplicate ids/slugs, SEO metadata presence and length, optional
 * content-quality heuristics.
 * ============================================================== */

/**
 * Validate registry quality: uniqueness and SEO completeness.
 */
export function validateQuality(
  input: RegistryValidationInput,
): ValidationReport {
  const findings: ValidationFinding[] = [];
  const all: BaseEntry[] = [
    ...input.categories,
    ...input.courses,
    ...input.learningPaths,
    ...input.testimonials,
  ];

  // Duplicate id detection (global across registries).
  const seenIds = new Map<string, string>();
  for (const e of all) {
    if (!isNonEmptyString(e.id)) continue;
    const prev = seenIds.get(e.id);
    if (prev !== undefined) {
      findings.push({
        severity: "error",
        category: "quality",
        code: "DUPLICATE_ID",
        message: `Duplicate entry id \`${e.id}\`.`,
        entryId: e.id,
        source: input.source,
      });
    } else {
      seenIds.set(e.id, e.id);
    }
  }

  // Duplicate slug detection scoped per-registry-kind.
  const dupCheck = (
    entries: readonly BaseEntry[],
    kind: string,
  ): void => {
    const seen = new Set<string>();
    for (const e of entries) {
      if (!isNonEmptyString(e.slug)) continue;
      if (seen.has(e.slug)) {
        findings.push({
          severity: "error",
          category: "quality",
          code: "DUPLICATE_SLUG",
          message: `Duplicate ${kind} slug \`${e.slug}\`.`,
          entryId: e.id,
          field: "slug",
          source: input.source,
        });
      } else {
        seen.add(e.slug);
      }
    }
  };
  dupCheck(input.categories, "category");
  dupCheck(input.courses, "course");
  dupCheck(input.learningPaths, "learning-path");
  dupCheck(input.testimonials, "testimonial");

  // SEO completeness — only enforced for `status: "published"`.
  for (const e of all) {
    if (e.status !== "published") continue;
    if (!e.metadata) continue; // already reported by structure validator
    if (!isNonEmptyString(e.metadata.title)) {
      findings.push({
        severity: "error",
        category: "quality",
        code: "SEO_TITLE_EMPTY",
        message: `Published entry \`${e.id}\` has no \`metadata.title\`.`,
        entryId: e.id,
        field: "metadata.title",
        source: input.source,
      });
    } else if (e.metadata.title.length > SEO_TITLE_MAX) {
      findings.push({
        severity: "warning",
        category: "quality",
        code: "SEO_TITLE_TOO_LONG",
        message: `Published entry \`${e.id}\` title is ${e.metadata.title.length} chars (>${SEO_TITLE_MAX}).`,
        entryId: e.id,
        field: "metadata.title",
        source: input.source,
      });
    }
    if (!isNonEmptyString(e.metadata.description)) {
      findings.push({
        severity: "error",
        category: "quality",
        code: "SEO_DESCRIPTION_EMPTY",
        message: `Published entry \`${e.id}\` has no \`metadata.description\`.`,
        entryId: e.id,
        field: "metadata.description",
        source: input.source,
      });
    } else if (e.metadata.description.length > SEO_DESCRIPTION_MAX) {
      findings.push({
        severity: "warning",
        category: "quality",
        code: "SEO_DESCRIPTION_TOO_LONG",
        message: `Published entry \`${e.id}\` description is ${e.metadata.description.length} chars (>${SEO_DESCRIPTION_MAX}).`,
        entryId: e.id,
        field: "metadata.description",
        source: input.source,
      });
    }
  }

  return report(findings, all.length);
}

/* ================================================================
 * SECTION 6 — Orchestrator and Reporters
 * ============================================================== */

/**
 * Top-level orchestrator. Composes structure, relationship, and
 * quality validators into a single `ValidationReport`. Division-
 * specific validators can call this and then append their own
 * findings before returning.
 */
export function validateRegistry(
  input: RegistryValidationInput,
): ValidationReport {
  const reports: ValidationReport[] = [
    validateStructure(input),
    validateRelationships(input),
    validateQuality(input),
  ];
  const entriesChecked =
    input.categories.length +
    input.courses.length +
    input.learningPaths.length +
    input.testimonials.length;
  return mergeReports(reports, entriesChecked);
}

/**
 * Format a `ValidationReport` as a multi-line human-readable string.
 * Used by dev-mode reporter; production reporters may emit JSON.
 */
export function formatReport(report: ValidationReport): string {
  if (report.summary.ok && report.warnings.length === 0) {
    return `Registry OK — ${report.summary.entriesChecked} entries checked.`;
  }
  const lines: string[] = [];
  lines.push(
    `Registry check — ${report.summary.entriesChecked} entries, ${report.summary.errorCount} error(s), ${report.summary.warningCount} warning(s).`,
  );
  for (const f of [...report.errors, ...report.warnings]) {
    const where = f.entryId ? ` [${f.entryId}${f.field ? `.${f.field}` : ""}]` : "";
    lines.push(`  ${f.severity.toUpperCase()} ${f.code}${where}: ${f.message}`);
  }
  return lines.join("\n");
}

/**
 * Reporter for development. Throws on any error so misconfigured
 * registries fail fast at module import.
 */
export function reportRegistryDev(report: ValidationReport): void {
  if (report.summary.errorCount > 0) {
    throw new Error(`[HIGAET Registry] ${formatReport(report)}`);
  }
  if (report.summary.warningCount > 0 && typeof console !== "undefined") {
    console.warn(`[HIGAET Registry] ${formatReport(report)}`);
  }
}

/**
 * Reporter for production. Never throws. Logs errors and warnings
 * via `console` when available so production stability is preserved
 * while diagnostics remain visible.
 */
export function reportRegistryProd(report: ValidationReport): void {
  if (typeof console === "undefined") return;
  if (report.summary.errorCount > 0) {
    console.error(`[HIGAET Registry] ${formatReport(report)}`);
  } else if (report.summary.warningCount > 0) {
    console.warn(`[HIGAET Registry] ${formatReport(report)}`);
  }
}

/**
 * Convenience wrapper: runs `validateRegistry` and dispatches to
 * the dev or prod reporter based on `isDev`. Callers pass
 * `import.meta.env.DEV` from the consuming module.
 */
export function validateAndReport(
  input: RegistryValidationInput,
  isDev: boolean,
): ValidationReport {
  const r = validateRegistry(input);
  if (isDev) reportRegistryDev(r);
  else reportRegistryProd(r);
  return r;
}
