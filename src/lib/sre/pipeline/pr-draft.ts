/**
 * PR-draft composer for the unified Sentry → AI SRE pipeline.
 *
 * Pure function: takes an AI SRE analysis + minimal issue metadata, returns
 * a stored PR suggestion artifact. Never touches GitHub — this artifact is
 * what the admin dashboard renders for reviewers to copy or (in a later
 * pass) push to a real repo.
 */

import type { AISREAnalysis } from "@/lib/sre/ai/orchestrator";

export interface PRDraft {
  title: string;
  branch: string;
  body: string;
  labels: string[];
  category: string;
  confidence: number;
  fixes: Array<{
    action: string;
    risk: "low" | "medium" | "high";
    targetHint: string;
    testHint: string;
  }>;
  sentryIssueId: string;
  sentryPermalink?: string;
  requiresHumanReview: true;
}

/** Deterministic slug helper — safe for branch names. */
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildPRDraft(
  analysis: AISREAnalysis,
  issue: { id: string; shortId?: string; title: string; permalink?: string },
): PRDraft {
  const shortId = issue.shortId ?? analysis.shortId ?? issue.id;
  const category = analysis.rootCause.topCategory;
  const base = analysis.prSuggestion;

  return {
    title: base.title,
    branch: `sre/${slug(shortId)}-${slug(category)}`,
    body: base.body,
    labels: base.labels,
    category,
    confidence: analysis.rootCause.confidence,
    fixes: analysis.fixPlan.map((f) => ({
      action: f.action,
      risk: f.risk,
      targetHint: f.targetHint,
      testHint: f.testHint,
    })),
    sentryIssueId: issue.id,
    sentryPermalink: issue.permalink,
    requiresHumanReview: true,
  };
}

/**
 * Deterministic hash of the analysis payload. Lets the orchestrator detect
 * whether a re-run produced a materially different analysis (and therefore
 * whether the stored PR draft needs to change).
 */
export function computeAnalysisHash(analysis: AISREAnalysis): string {
  const canonical = JSON.stringify({
    cat: analysis.rootCause.topCategory,
    conf: Math.round(analysis.rootCause.confidence * 100) / 100,
    hyp: analysis.rootCause.hypotheses.map((h) => [h.category, h.description, h.weight]),
    plan: analysis.fixPlan.map((f) => [f.action, f.risk, f.targetHint]),
    auto: analysis.autoPRRecommended,
  });
  // Small, dependency-free FNV-1a 64-bit → hex. Good enough for change detection.
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < canonical.length; i++) {
    const c = canonical.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ c, 2246822507) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

/** Combined risk score: hypothesis weight × plan risk severity, capped 0..100. */
export function computeRiskScore(analysis: AISREAnalysis): number {
  const conf = analysis.rootCause.confidence;
  const worst = analysis.fixPlan.reduce((acc, f) => {
    const r = f.risk === "high" ? 1 : f.risk === "medium" ? 0.6 : 0.3;
    return Math.max(acc, r);
  }, 0.3);
  return Math.round(conf * worst * 100);
}
