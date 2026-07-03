import { describe, expect, it, vi } from "vitest";
import { analyzeRelease } from "@/lib/sre/engine";
import { runSRECycle } from "@/lib/sre/orchestrator";
import { predictFailure } from "@/lib/sre/predictive";
import { planFixesFromAnalysis } from "@/lib/sre/auto-fix";
import type { ReleaseSnapshot } from "@/lib/releases/types";

const baseline: ReleaseSnapshot = {
  releaseId: "rc",
  timestamp: 0,
  errorRate: 2,
  crashCount: 1,
  signupConversion: 40,
  paymentSuccessRate: 92,
  revenue: 10000,
  lighthouseScore: 80,
};

describe("sre engine", () => {
  it("recommends rollback on hard payment drop", () => {
    const a = analyzeRelease("rc", baseline, { ...baseline, paymentSuccessRate: 85 });
    expect(a.decision).toBe("ROLLBACK_RECOMMENDED");
    expect(a.reasons.join(" ")).toMatch(/Payment success/);
  });

  it("warns on mild negative score", () => {
    const a = analyzeRelease("rc", baseline, { ...baseline, signupConversion: 39, lighthouseScore: 78 });
    expect(a.decision).toBe("WARN");
  });

  it("allows on improvement", () => {
    const a = analyzeRelease("rc", baseline, { ...baseline, paymentSuccessRate: 95, revenue: 11000 });
    expect(a.decision).toBe("ALLOW");
  });
});

describe("sre orchestrator", () => {
  it("notifies slack for every cycle and github on rollback", async () => {
    const notifier = vi.fn();
    const { signal } = await runSRECycle(
      { releaseId: "rc-1", before: baseline, after: { ...baseline, crashCount: 8 } },
      notifier,
    );
    expect(signal.action).toBe("ROLLBACK_SIGNAL_SENT");
    const channels = notifier.mock.calls.map((c) => c[0].channel);
    expect(channels).toContain("slack");
    expect(channels).toContain("github");
  });

  it("does not open a github issue when allowed", async () => {
    const notifier = vi.fn();
    await runSRECycle(
      { releaseId: "rc-2", before: baseline, after: { ...baseline, paymentSuccessRate: 94 } },
      notifier,
    );
    const channels = notifier.mock.calls.map((c) => c[0].channel);
    expect(channels).toEqual(["slack"]);
  });
});

describe("predictive gate", () => {
  it("blocks HIGH risk deploys", () => {
    const p = predictFailure({
      paymentFailures: 10, errorRate: 5, signupDrop: 20, authErrors: 3, lighthouseScore: 60,
    });
    expect(p.riskLevel).toBe("HIGH");
    expect(p.allowDeploy).toBe(false);
  });
  it("allows healthy baseline", () => {
    const p = predictFailure({
      paymentFailures: 0, errorRate: 1, signupDrop: 0, authErrors: 0, lighthouseScore: 92,
    });
    expect(p.riskLevel).toBe("LOW");
    expect(p.allowDeploy).toBe(true);
  });
});

describe("auto-fix planner", () => {
  it("produces reviewable patches for payment regression", () => {
    const a = analyzeRelease("rc", baseline, { ...baseline, paymentSuccessRate: 88 });
    const plan = planFixesFromAnalysis(a);
    expect(plan.fixes.length).toBeGreaterThan(0);
    expect(plan.hasSafeFix).toBe(true);
    expect(plan.patches.every((p) => p.file.length > 0)).toBe(true);
  });
  it("emits an empty plan when nothing regressed", () => {
    const a = analyzeRelease("rc", baseline, baseline);
    const plan = planFixesFromAnalysis(a);
    expect(plan.fixes).toEqual([]);
    expect(plan.hasSafeFix).toBe(false);
  });
});
