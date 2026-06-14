/**
 * HIGAET Registry System — Test Assertions
 * ---------------------------------------------------------------
 * Tiny assertion helpers shared across the parameterized suite.
 *
 * Layer: src/content/_registry/tests/helpers/assertions.ts
 * Step:  Workstream A.1 — Step 5
 * ---------------------------------------------------------------
 */

import { expect } from "vitest";

import type { ValidationFinding, ValidationReport } from "../../index";

/** Assert the report is fully clean. */
export function expectOk(report: ValidationReport): void {
  expect(
    report.summary.ok,
    `Expected clean report, got:\n${JSON.stringify(report, null, 2)}`,
  ).toBe(true);
  expect(report.errors).toHaveLength(0);
}

/** Assert at least one finding with the given code exists. */
export function expectFinding(
  report: ValidationReport,
  code: string,
): ValidationFinding {
  const found = [...report.errors, ...report.warnings].find(
    (f) => f.code === code,
  );
  expect(
    found,
    `Expected finding code "${code}". Got: ${JSON.stringify(
      [...report.errors, ...report.warnings].map((f) => f.code),
    )}`,
  ).toBeDefined();
  return found as ValidationFinding;
}

/** Assert no finding with the given code exists. */
export function expectNoFinding(
  report: ValidationReport,
  code: string,
): void {
  const found = [...report.errors, ...report.warnings].find(
    (f) => f.code === code,
  );
  expect(found, `Did not expect finding "${code}".`).toBeUndefined();
}
