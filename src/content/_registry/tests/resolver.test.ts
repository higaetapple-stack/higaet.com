/**
 * Resolver — orchestrator + reporters behave per contract.
 * Step: Workstream A.1 — Step 5
 */
import { describe, expect, it } from "vitest";

import {
  formatReport,
  reportRegistryDev,
  reportRegistryProd,
  validateRegistry,
} from "../index";

import {
  duplicateIdsRegistry,
  validRegistry,
} from "./fixtures/registry-fixtures";

describe("resolver — orchestrator and reporters", () => {
  it("validateRegistry merges all validator families", () => {
    const r = validateRegistry(duplicateIdsRegistry);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.summary.ok).toBe(false);
  });

  it("dev reporter throws on errors", () => {
    const r = validateRegistry(duplicateIdsRegistry);
    expect(() => reportRegistryDev(r)).toThrow(/HIGAET Registry/);
  });

  it("prod reporter never throws", () => {
    const r = validateRegistry(duplicateIdsRegistry);
    expect(() => reportRegistryProd(r)).not.toThrow();
  });

  it("formatReport returns a short OK message for clean input", () => {
    const r = validateRegistry(validRegistry);
    expect(formatReport(r)).toMatch(/Registry OK/);
  });
});
