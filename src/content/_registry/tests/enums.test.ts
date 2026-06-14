/**
 * Enums — status and visibility values are bounded.
 * Step: Workstream A.1 — Step 5
 */
import { describe, it } from "vitest";

import { validateStructure } from "../index";

import { expectFinding } from "./helpers/assertions";
import { invalidEnumRegistry } from "./fixtures/registry-fixtures";

describe("enums — bounded value validation", () => {
  it("reports INVALID_STATUS", () => {
    expectFinding(validateStructure(invalidEnumRegistry), "INVALID_STATUS");
  });
});
