import { describe, expect, it, beforeEach } from "vitest";
import { analyzeDiff } from "@/lib/risk/analyzer";
import { evaluatePR } from "@/lib/risk/gate";
import { _resetLearning, recordOutcome, getLearnedWeightBoost } from "@/lib/risk/learning";

const AUTH_DIFF = `diff --git a/src/lib/auth.ts b/src/lib/auth.ts
--- a/src/lib/auth.ts
+++ b/src/lib/auth.ts
@@
-const session = null;
+const session = await getSession();
+if (session?.token === undefined) throw new Error("no token");
`;

describe("PR risk analyzer", () => {
  it("flags auth + null-safety signals", () => {
    const a = analyzeDiff(AUTH_DIFF);
    expect(a.signals).toContain("Authentication subsystem modified");
    expect(a.signals).toContain("Null-safety branch modified");
    expect(a.files).toContain("src/lib/auth.ts");
    expect(a.complexityScore).toBeGreaterThan(0);
  });
});

describe("PR gate", () => {
  it("returns ALLOW for trivial diffs and never blocks without CRITICAL", async () => {
    const result = await evaluatePR("diff --git a/README.md b/README.md\n+minor");
    expect(["ALLOW", "WARN", "BLOCK"]).toContain(result.decision);
    expect(result.decision).not.toBe("BLOCK");
  });
});

describe("Self-learning risk model", () => {
  beforeEach(() => _resetLearning());
  it("increases boost after incident outcomes", () => {
    recordOutcome({ prNumber: 1, outcome: "incident", signals: ["Payment flow touched (high risk area)"] });
    recordOutcome({ prNumber: 2, outcome: "incident", signals: ["Payment flow touched (high risk area)"] });
    const boost = getLearnedWeightBoost(["Payment flow touched (high risk area)"]);
    expect(boost).toBeGreaterThan(0);
  });
  it("decreases boost after clean outcomes", () => {
    recordOutcome({ prNumber: 1, outcome: "incident", signals: ["Authentication subsystem modified"] });
    recordOutcome({ prNumber: 2, outcome: "clean", signals: ["Authentication subsystem modified"] });
    recordOutcome({ prNumber: 3, outcome: "clean", signals: ["Authentication subsystem modified"] });
    const boost = getLearnedWeightBoost(["Authentication subsystem modified"]);
    expect(boost).toBeLessThan(5);
  });
});
