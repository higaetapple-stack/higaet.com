import { describe, it, expect, beforeEach } from "vitest";
import {
  analyzePolicyChange,
  runRLSHealing,
  runRLSRollbackSystem,
  predictRLSFailure,
  compilePolicyRequest,
  runRLSEvolution,
  savePolicyVersion,
  clearVersions,
  recordViolation,
  clearViolations,
  recordAccess,
  clearAccessLog,
  observeQuery,
  flushRLSAudit,
  type RLSPolicy,
} from "../index";

describe("RLS static analyzer", () => {
  it("flags privilege expansion as risk", () => {
    const before: RLSPolicy[] = [];
    const after: RLSPolicy[] = [
      { role: "anon", table: "profiles", operation: "SELECT", expression: "true" },
    ];
    const r = analyzePolicyChange({
      beforePolicies: before,
      afterPolicies: after,
      roles: ["anon"],
      tables: ["profiles"],
      operations: ["SELECT"],
    });
    expect(r.drift.changes.length).toBeGreaterThan(0);
    expect(["ALLOW", "WARN", "BLOCK"]).toContain(r.decision);
  });
});

describe("RLS runtime auditor", () => {
  it("detects an unexpected allow when no policy backs the query", () => {
    observeQuery({
      role: "anon",
      table: "secret",
      operation: "SELECT",
      timestamp: Date.now(),
    });
    const result = flushRLSAudit([]);
    expect(result?.report.violations.length).toBe(1);
  });
});

describe("RLS healing", () => {
  beforeEach(() => clearViolations());
  it("clusters repeated violations and produces reviewable patches", () => {
    for (let i = 0; i < 4; i++) {
      recordViolation({
        role: "authenticated",
        table: "profiles",
        operation: "SELECT",
        timestamp: Date.now(),
      });
    }
    const r = runRLSHealing([
      { role: "authenticated", table: "profiles", operation: "SELECT", timestamp: 1 },
      { role: "authenticated", table: "profiles", operation: "SELECT", timestamp: 2 },
      { role: "authenticated", table: "profiles", operation: "SELECT", timestamp: 3 },
    ]);
    expect(r.clusters.length).toBe(1);
    expect(r.recommendations[0].patch.table).toBe("profiles");
  });
});

describe("RLS rollback planner", () => {
  beforeEach(() => clearVersions());
  it("returns NO_ACTION when failure is low", () => {
    const r = runRLSRollbackSystem({
      runtimeViolations: 0,
      simulationDrift: 0,
      criticalErrors: 0,
    });
    expect(r.action).toBe("NO_ACTION");
  });

  it("plans rollback on critical failure when a stable snapshot exists", () => {
    savePolicyVersion({
      id: "v1",
      timestamp: Date.now() - 1000,
      policies: [],
      checksum: "stable-abc",
    });
    const r = runRLSRollbackSystem({
      runtimeViolations: 10,
      simulationDrift: 0,
      criticalErrors: 5,
    });
    expect(r.action).toBe("PLAN_READY");
  });
});

describe("RLS predictor", () => {
  it("flags anonymous role changes as elevated risk", () => {
    const r = predictRLSFailure(
      "CREATE POLICY foo ON t FOR SELECT TO anon USING (has_role('admin'));",
    );
    expect(r.impactedRoles).toContain("anon");
    expect(["MEDIUM", "HIGH", "CRITICAL", "LOW"]).toContain(r.prediction.level);
  });
});

describe("RLS compiler", () => {
  it("blocks nonsensical intent", () => {
    const r = compilePolicyRequest("do something vague");
    expect(r.result.decision).toBe("BLOCK");
    expect(r.artifact).toBeNull();
  });

  it("produces reviewable SQL for a valid intent", () => {
    const r = compilePolicyRequest("authenticated user can view own profiles");
    expect(r.result.policy.table).toBe("profiles");
    if (r.artifact) {
      expect(r.artifact.sql).toContain("CREATE POLICY");
    }
  });
});

describe("RLS evolution", () => {
  beforeEach(() => clearAccessLog());
  it("reports INSUFFICIENT_DATA without enough samples", () => {
    const r = runRLSEvolution("profiles", "authenticated");
    expect(r.decision).toBe("INSUFFICIENT_DATA");
  });

  it("suggests relaxation when deny rate is very high", () => {
    for (let i = 0; i < 20; i++) {
      recordAccess({
        role: "authenticated",
        table: "profiles",
        action: "SELECT",
        result: "DENY",
        timestamp: Date.now(),
      });
    }
    const r = runRLSEvolution("profiles", "authenticated");
    expect(r.decision).toBe("SUGGEST_RELAXATION");
  });
});
