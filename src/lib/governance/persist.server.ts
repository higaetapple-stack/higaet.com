/**
 * Persistent audit sinks for governance + knowledge exchange.
 * All writes use the service-role client and are called only from
 * authorized server functions or verified server routes.
 */
import type { GovernorOutput } from "@/lib/security/governance/orchestrator";
import type { KnowledgePackage, TrustLevel } from "@/lib/knowledge/types";
import type { VerifyResult } from "@/lib/knowledge/signing.server";

export type PersistedGovernanceEvent = {
  id: string;
  created_at: string;
  tenant_id: string | null;
  source: string;
  decision: string;
  risk_score: number;
  confidence: number;
  explanation: string[];
  requires_human_approval: boolean;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  metadata: Record<string, unknown>;
};

export async function persistGovernanceDecision(
  output: GovernorOutput,
  opts: { source: string; metadata?: Record<string, unknown> } = { source: "orchestrator" },
): Promise<PersistedGovernanceEvent> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("governance_audit_events")
    .insert({
      tenant_id: output.tenantId ?? null,
      source: opts.source,
      decision: output.decision,
      risk_score: output.riskScore,
      confidence: output.confidence,
      explanation: output.explanation as unknown as never,
      requires_human_approval: output.requiresHumanApproval,
      approval_status: output.requiresHumanApproval ? "pending" : output.decision === "BLOCK" ? "blocked" : "auto",
      metadata: (opts.metadata ?? {}) as unknown as never,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as PersistedGovernanceEvent;
}

export type PersistedKnowledgePackage = {
  id: string;
  created_at: string;
  source_label: string;
  trust_level: string;
  schema_version: string;
  generated_at: string;
  expires_at: string;
  hash: string;
  signature_valid: boolean;
  status: string;
  categories: unknown;
  recommendations: unknown;
};

export async function persistKnowledgePackage(
  pkg: KnowledgePackage,
  trust: TrustLevel,
  sourceLabel: string,
  verification: VerifyResult,
): Promise<PersistedKnowledgePackage> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const status = !verification.valid ? "rejected" : "pending";
  const { data, error } = await supabaseAdmin
    .from("knowledge_packages")
    .insert({
      source_label: sourceLabel,
      trust_level: trust,
      schema_version: pkg.version,
      generated_at: pkg.generatedAt,
      expires_at: pkg.expiresAt,
      hash: pkg.hash,
      signature_valid: verification.valid,
      payload: pkg as unknown as never,
      categories: pkg.categories as unknown as never,
      recommendations: pkg.recommendations as unknown as never,
      status,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as PersistedKnowledgePackage;
}

export async function persistIngestionEvent(input: {
  packageId: string | null;
  sourceLabel: string;
  trust: TrustLevel;
  outcome: "accepted" | "rejected";
  reason?: string;
  issues?: string[];
}): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("knowledge_ingestion_events").insert({
    package_id: input.packageId,
    source_label: input.sourceLabel,
    trust_level: input.trust,
    outcome: input.outcome,
    reason: input.reason ?? null,
    issues: input.issues ?? [],
  });
  if (error) throw new Error(error.message);
}
