import type { FixPlan, PatchPlan, SREAnalysis } from "./types";

/**
 * Suggest human-reviewable fixes from an SRE analysis.
 * NEVER executes changes; produces a plan suitable for a PR description
 * or a Lovable/AI code-fix agent to pick up. Every low-confidence entry
 * is flagged needsManualReview so nothing lands silently.
 */
export function planFixesFromAnalysis(analysis: SREAnalysis): FixPlan {
  const fixes = collectFixes(analysis);
  const patches = fixes.map(mapFixToPatch);
  return {
    releaseId: analysis.releaseId,
    fixes,
    patches,
    hasSafeFix: patches.some((p) => !p.needsManualReview),
  };
}

function collectFixes(a: SREAnalysis): string[] {
  const out: string[] = [];
  if (a.delta.paymentDelta <= -1) out.push("checkout retry logic improvement");
  if (a.delta.paymentDelta <= -3) out.push("payment timeout increase");
  if (a.delta.errorDelta >= 1) out.push("add null guards in API layer");
  if (a.delta.crashDelta >= 3) out.push("rollback recent unstable module");
  if (a.delta.signupDelta <= -5) out.push("fix auth validation flow");
  if (a.delta.signupDelta <= -10) out.push("reduce signup friction step");
  if (a.delta.lighthouseDelta <= -10) out.push("investigate bundle regression");
  return out;
}

const KNOWN_PATCHES: Record<string, Omit<PatchPlan, "needsManualReview">> = {
  "checkout retry logic improvement": {
    file: "src/routes/_authenticated.dashboard.payments.new.tsx",
    change: "Wrap payment submission in exponential-backoff retry.",
  },
  "payment timeout increase": {
    file: "src/lib/manual-payments.functions.ts",
    change: "Raise upstream fetch timeout from 5s → 15s.",
  },
  "add null guards in API layer": {
    file: "src/lib/api-gateway.server.ts",
    change: "Add defensive null checks on response envelope.",
  },
  "fix auth validation flow": {
    file: "src/routes/auth.login.tsx",
    change: "Tighten email/token validation before submit.",
  },
};

function mapFixToPatch(fix: string): PatchPlan {
  const hit = KNOWN_PATCHES[fix];
  if (hit) return { ...hit, needsManualReview: false };
  return { file: "manual-review-required", change: fix, needsManualReview: true };
}
