import { describe, expect, it } from "vitest";
import { authorizeTool } from "../authorizeTool";

describe("authorizeTool", () => {
  it("allows public tool for public scope", () => {
    const d = authorizeTool({ tool: "about_higaet", clientScope: "public", isAdminInternal: false });
    expect(d).toEqual({ allowed: true, reason: "SCOPE_GRANTED", requiredScope: "public" });
  });

  it("denies insights tool for public scope with 403 reason", () => {
    const d = authorizeTool({ tool: "get_sre_snapshot", clientScope: "public", isAdminInternal: false });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("INSUFFICIENT_SCOPE");
  });

  it("allows sre tool for admin scope via hierarchy", () => {
    const d = authorizeTool({ tool: "run_ai_sre_loop", clientScope: "admin", isAdminInternal: false });
    expect(d.allowed).toBe(true);
    expect(d.reason).toBe("SCOPE_GRANTED");
  });

  it("admin_internal overrides for known tools", () => {
    const d = authorizeTool({ tool: "risk_calibration_apply", clientScope: "public", isAdminInternal: true });
    expect(d).toMatchObject({ allowed: true, reason: "ADMIN_INTERNAL_OVERRIDE" });
  });

  it("admin_internal cannot invoke unknown tools (fail-closed)", () => {
    const d = authorizeTool({ tool: "does_not_exist", clientScope: "public", isAdminInternal: true });
    expect(d).toEqual({ allowed: false, reason: "UNKNOWN_TOOL" });
  });
});
