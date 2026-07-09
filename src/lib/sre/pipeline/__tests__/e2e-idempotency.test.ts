/**
 * Regression guard for the SRE E2E smoke canary.
 *
 * Two invariants:
 *  1. syntheticIncident must return a STABLE issueId regardless of runId,
 *     so PR dedup on (issue_id, analysis_hash) collapses repeated smoke
 *     runs into a single draft PR (previously spawned #4-#12 duplicates).
 *  2. The synthetic incident title must not masquerade as a real TypeError,
 *     which was the source of misleading "Cannot read properties of
 *     undefined (reading 'id')" PR titles.
 */
import { describe, expect, it } from "vitest";
import {
  E2E_SYNTHETIC_ISSUE_ID,
  E2E_SYNTHETIC_SHORT_ID,
  __getSyntheticIncidentForTest,
} from "../e2e-test.server";

describe("SRE E2E synthetic incident", () => {
  it("produces a stable issueId across distinct runIds (idempotency)", () => {
    const a = __getSyntheticIncidentForTest("11111111-aaaa-bbbb-cccc-111111111111");
    const b = __getSyntheticIncidentForTest("22222222-dddd-eeee-ffff-222222222222");
    expect(a.issueId).toBe(E2E_SYNTHETIC_ISSUE_ID);
    expect(b.issueId).toBe(E2E_SYNTHETIC_ISSUE_ID);
    expect(a.incident.id).toBe(b.incident.id);
    expect(a.incident.shortId).toBe(E2E_SYNTHETIC_SHORT_ID);
  });

  it("does not use a real-looking TypeError string in the title", () => {
    const { incident } = __getSyntheticIncidentForTest("run-xyz");
    expect(incident.title).toBeTruthy();
    expect(incident.title).not.toMatch(/TypeError:/i);
    expect(incident.title).not.toMatch(/Cannot read properties of undefined/i);
    expect(incident.errorType).toBe("SyntheticCanary");
  });

  it("uses defensive defaults so no field is undefined-chained downstream", () => {
    const { incident } = __getSyntheticIncidentForTest("run-defensive");
    // Guards against a future regression where a missing field would surface
    // as "Cannot read properties of undefined (reading 'id')" downstream.
    expect(incident.id).toBeDefined();
    expect(incident.shortId).toBeDefined();
    expect(Array.isArray(incident.frames)).toBe(true);
    for (const f of incident.frames ?? []) {
      expect(typeof f.filename).toBe("string");
      expect(typeof f.function).toBe("string");
    }
  });
});
