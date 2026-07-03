import { describe, it, expect } from "vitest";
import { detectRootCause } from "@/lib/sre/ai/root-cause";
import { generateFixPlan } from "@/lib/sre/ai/fix-planner";
import { suggestPR } from "@/lib/sre/ai/pr-suggester";
import { runAISRELoop, shouldRecommendAutoPR } from "@/lib/sre/ai/orchestrator";

describe("AI SRE — root cause", () => {
  it("classifies auth failures", () => {
    const r = detectRootCause({
      title: "Unauthorized: JWT expired",
      errorType: "AuthApiError",
      frames: [{ filename: "src/hooks/useAuth.ts", function: "refreshSession" }],
    });
    expect(r.topCategory).toBe("auth");
    expect(r.confidence).toBeGreaterThan(0.2);
  });

  it("classifies payment failures with systemic flag", () => {
    const r = detectRootCause({
      title: "Stripe checkout timed out",
      errorType: "PaymentError",
      frequency: 42,
      userCount: 30,
    });
    expect(r.topCategory).toBe("payment");
    expect(r.systemic).toBe(true);
  });

  it("returns unknown when no signal matches", () => {
    const r = detectRootCause({ title: "mystery" });
    expect(r.topCategory).toBe("unknown");
    expect(r.confidence).toBeLessThan(0.1);
  });
});

describe("AI SRE — fix plan", () => {
  it("produces distinct plan entries per category", () => {
    const r = detectRootCause({
      title: "TypeError: cannot read property 'id' of undefined in payment flow",
      errorType: "TypeError",
      frequency: 5,
    });
    const plan = generateFixPlan(r);
    const categories = plan.map((p) => p.category);
    expect(new Set(categories).size).toBe(categories.length);
    expect(plan.length).toBeGreaterThan(0);
  });
});

describe("AI SRE — orchestrator", () => {
  it("returns advisory analysis and blocks auto-PR on low confidence", () => {
    const analysis = runAISRELoop({ id: "1", title: "mystery" });
    expect(analysis.autoPRRecommended).toBe(false);
    expect(analysis.prSuggestion.requiresHumanReview).toBe(true);
  });

  it("recommends auto-PR when confidence is high and risk is manageable", () => {
    const analysis = runAISRELoop({
      id: "2",
      shortId: "HIGAET-42",
      title: "TypeError: undefined property in auth flow",
      errorType: "TypeError",
      frames: [{ filename: "src/hooks/useAuth.ts" }],
      frequency: 15,
      userCount: 25,
    });
    expect(analysis.rootCause.confidence).toBeGreaterThanOrEqual(0.7);
    expect(analysis.autoPRRecommended).toBe(true);
    expect(analysis.prSuggestion.labels).toContain("ai-sre");
  });

  it("shouldRecommendAutoPR rejects high-risk-only plans", () => {
    const rootCause = detectRootCause({
      title: "RLS policy denied on supabase table",
      errorType: "PostgrestError",
      frequency: 20,
    });
    const fixPlan = generateFixPlan(rootCause);
    const onlyHigh = fixPlan.filter((p) => p.risk === "high");
    expect(shouldRecommendAutoPR({ rootCause, fixPlan: onlyHigh })).toBe(false);
  });
});

describe("AI SRE — PR suggester", () => {
  it("composes a markdown body containing hypotheses and boundary note", () => {
    const rootCause = detectRootCause({
      title: "Stripe webhook signature mismatch",
      frequency: 3,
    });
    const fixPlan = generateFixPlan(rootCause);
    const pr = suggestPR({
      issueTitle: "Stripe webhook signature mismatch",
      issueShortId: "HIGAET-99",
      rootCause,
      fixPlan,
    });
    expect(pr.title).toContain("Stripe");
    expect(pr.body).toContain("AI SRE");
    expect(pr.body).toContain("human review");
    expect(pr.branchHint).toMatch(/^sre\/higaet-99-/);
  });
});
