/**
 * Generators — placeholder suite reserved for `generated/*` artifacts.
 *
 * The Registry SDK ships generator CONTRACTS (search, sitemap,
 * breadcrumbs). Generator IMPLEMENTATIONS live in each division
 * (`<division>/generated/`). This file holds shape assertions
 * against the contracts so divisions inherit uniform coverage
 * when they bind a generator to the contract.
 *
 * Step: Workstream A.1 — Step 5
 */
import { describe, expectTypeOf, it } from "vitest";

import type {
  BreadcrumbGeneratorContract,
  SearchGeneratorContract,
  SitemapGeneratorContract,
} from "../index";

describe("generators — contract shape", () => {
  it("SearchGeneratorContract is a function type", () => {
    expectTypeOf<SearchGeneratorContract>().toBeFunction();
  });
  it("SitemapGeneratorContract is a function type", () => {
    expectTypeOf<SitemapGeneratorContract>().toBeFunction();
  });
  it("BreadcrumbGeneratorContract is a function type", () => {
    expectTypeOf<BreadcrumbGeneratorContract>().toBeFunction();
  });
});
