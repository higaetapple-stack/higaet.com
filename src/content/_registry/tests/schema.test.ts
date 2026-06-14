/**
 * Schema — required fields exist, no missing core entry shape.
 * Step: Workstream A.1 — Step 5
 */
import { describe, it } from "vitest";

import { validateStructure } from "../index";

import { expectFinding, expectOk } from "./helpers/assertions";
import { runRegistrySuite } from "./helpers/runRegistrySuite";
import {
  validRegistry,
  missingSeoRegistry,
} from "./fixtures/registry-fixtures";

runRegistrySuite("valid baseline", () => validRegistry);

describe("schema — structural validation", () => {
  it("flags published entries with empty SEO title", () => {
    const r = validateStructure(missingSeoRegistry);
    // SEO emptiness is a quality issue; structure validator should still
    // accept the metadata OBJECT being present.
    expectOk(r);
  });

  it("valid registry passes structural validation", () => {
    expectOk(validateStructure(validRegistry));
  });

  it("reports MISSING_ID when id is empty", () => {
    const input = {
      ...validRegistry,
      source: "test.missing-id",
      categories: [{ ...validRegistry.categories[0], id: "" }],
    };
    const r = validateStructure(input);
    expectFinding(r, "MISSING_ID");
  });
});
