/**
 * Duplicates — duplicate IDs and slugs are reported.
 * Step: Workstream A.1 — Step 5
 */
import { describe, it } from "vitest";

import { validateQuality } from "../index";

import { expectFinding } from "./helpers/assertions";
import {
  duplicateIdsRegistry,
  duplicateSlugsRegistry,
} from "./fixtures/registry-fixtures";

describe("duplicates — uniqueness validation", () => {
  it("reports DUPLICATE_ID", () => {
    expectFinding(validateQuality(duplicateIdsRegistry), "DUPLICATE_ID");
  });

  it("reports DUPLICATE_SLUG", () => {
    expectFinding(validateQuality(duplicateSlugsRegistry), "DUPLICATE_SLUG");
  });
});
