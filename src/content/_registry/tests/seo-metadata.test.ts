/**
 * SEO Metadata — published entries carry title and description.
 * Step: Workstream A.1 — Step 5
 */
import { describe, it } from "vitest";

import { validateQuality } from "../index";

import { expectFinding } from "./helpers/assertions";
import { missingSeoRegistry } from "./fixtures/registry-fixtures";

describe("seo-metadata — quality validation", () => {
  it("reports SEO_TITLE_EMPTY for published entries", () => {
    expectFinding(validateQuality(missingSeoRegistry), "SEO_TITLE_EMPTY");
  });

  it("reports SEO_DESCRIPTION_EMPTY for published entries", () => {
    expectFinding(
      validateQuality(missingSeoRegistry),
      "SEO_DESCRIPTION_EMPTY",
    );
  });
});
