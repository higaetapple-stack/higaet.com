/**
 * Cross-organization knowledge exchange — ADVISORY ONLY.
 *
 * Guarantees:
 *  - Never mutates local RLS policies.
 *  - Never deploys code, opens PRs, or approves releases.
 *  - Rejected packages are logged; accepted ones only produce recommendations.
 */
import { validateKnowledgePackage } from "./validate";
import { mergeRecommendations, type LocalRecommendation } from "./merge";
import { trustScoreFor } from "./trust";
import type { KnowledgePackage, TrustLevel, MergedRecommendation } from "./types";

export type ExchangeResult =
  | { status: "REJECTED"; reason: string; issues: string[] }
  | {
      status: "ACCEPTED_ADVISORY";
      trust: number;
      recommendations: MergedRecommendation[];
      requiresApproval: true;
    };

const rejectionLog: { at: number; reason: string; issues: string[] }[] = [];

export function ingestKnowledgePackage(
  pkg: KnowledgePackage,
  trust: TrustLevel,
  local: LocalRecommendation[],
): ExchangeResult {
  const validation = validateKnowledgePackage(pkg);
  if (!validation.valid) {
    const entry = { at: Date.now(), reason: "validation_failed", issues: validation.issues };
    rejectionLog.push(entry);
    console.warn("[KNOWLEDGE_REJECTED]", JSON.stringify(entry));
    return { status: "REJECTED", reason: entry.reason, issues: validation.issues };
  }
  const recommendations = mergeRecommendations(local, pkg.recommendations, trust);
  return {
    status: "ACCEPTED_ADVISORY",
    trust: trustScoreFor(trust),
    recommendations,
    requiresApproval: true,
  };
}

export function getKnowledgeRejectionLog() {
  return [...rejectionLog];
}
