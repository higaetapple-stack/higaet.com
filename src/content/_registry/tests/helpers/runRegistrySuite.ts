/**
 * HIGAET Registry System — Parameterized Suite Runner
 * ---------------------------------------------------------------
 * Division-agnostic entry point that runs the full validation
 * matrix against ANY registry input. Future divisions plug into
 * this by calling `runRegistrySuite(name, () => buildInput())`.
 *
 * Layer: src/content/_registry/tests/helpers/runRegistrySuite.ts
 * Step:  Workstream A.1 — Step 5
 * ---------------------------------------------------------------
 */

import { describe, expect, it } from "vitest";

import {
  validateQuality,
  validateRegistry,
  validateRelationships,
  validateStructure,
  type RegistryValidationInput,
  type ValidationReport,
} from "../../index";

import { expectOk } from "./assertions";

/**
 * Validation matrix. Each row is one check the suite runs against
 * every registry passed in. Future categories (state, resolver,
 * generated) are exercised by dedicated suites below.
 */
const MATRIX = [
  { name: "structure",     run: validateStructure },
  { name: "relationships", run: validateRelationships },
  { name: "quality",       run: validateQuality },
  { name: "aggregate",     run: validateRegistry },
] as const;

/**
 * Run the shared validation matrix against a registry. Use this
 * from any division's test file to guarantee uniform coverage.
 *
 * @param name  — display name for the suite (e.g. `"academy"`).
 * @param build — function returning the registry input under test.
 */
export function runRegistrySuite(
  name: string,
  build: () => RegistryValidationInput,
): void {
  describe(`Registry suite — ${name}`, () => {
    for (const { name: matrixName, run } of MATRIX) {
      it(`${matrixName}: produces a clean report`, () => {
        const report: ValidationReport = run(build());
        expectOk(report);
      });
    }

    it("aggregate: summary numbers add up", () => {
      const r = validateRegistry(build());
      expect(r.summary.errorCount).toBe(r.errors.length);
      expect(r.summary.warningCount).toBe(r.warnings.length);
      expect(r.summary.ok).toBe(r.errors.length === 0);
    });
  });
}
