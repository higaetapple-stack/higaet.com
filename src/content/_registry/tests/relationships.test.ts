/**
 * Relationships — cross-entity references resolve.
 * Step: Workstream A.1 — Step 5
 */
import { describe, it } from "vitest";

import { validateRelationships } from "../index";

import { expectFinding } from "./helpers/assertions";
import {
  emptyPathRegistry,
  orphanCourseRegistry,
  orphanPathCourseRegistry,
} from "./fixtures/registry-fixtures";

describe("relationships — referential integrity", () => {
  it("reports COURSE_ORPHAN_CATEGORY", () => {
    expectFinding(
      validateRelationships(orphanCourseRegistry),
      "COURSE_ORPHAN_CATEGORY",
    );
  });

  it("reports PATH_ORPHAN_COURSE", () => {
    expectFinding(
      validateRelationships(orphanPathCourseRegistry),
      "PATH_ORPHAN_COURSE",
    );
  });

  it("reports PATH_EMPTY", () => {
    expectFinding(validateRelationships(emptyPathRegistry), "PATH_EMPTY");
  });
});
