import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runSecurityGovernor, type GovernorInput } from "@/lib/security/governance/orchestrator";
import { requireApproval } from "@/lib/security/governance/approval";
import type { KnowledgePackage, TrustLevel } from "@/lib/knowledge/types";
import { validateKnowledgePackage } from "@/lib/knowledge/validate";
import { mergeRecommendations } from "@/lib/knowledge/merge";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

// ── Record a governance decision (called by internal services) ────────────
const RecordInput = z.object({
  source: z.string().min(1).max(64),
  contexts: z.array(
    z.object({
      source: z.enum(["compiler", "predictor", "evolver", "rollback", "runtime"]),
      riskScore: z.number().min(0).max(100),
      confidence: z.number().min(0).max(1).optional(),
      explanation: z.array(z.string()).optional(),
      tenantId: z.string().optional(),
      table: z.string().optional(),
    }),
  ),
  tenantId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const recordGovernanceDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof RecordInput>) => RecordInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const input: GovernorInput = { tenantId: data.tenantId };
    for (const c of data.contexts) input[c.source] = c;
    const output = runSecurityGovernor(input);
    const approval = requireApproval(output);
    const { persistGovernanceDecision } = await import("@/lib/governance/persist.server");
    const persisted = await persistGovernanceDecision(output, {
      source: data.source,
      metadata: data.metadata,
    });
    return { output, approval, persisted };
  });

// ── List / filter decisions ───────────────────────────────────────────────
const ListInput = z.object({
  tenantId: z.string().optional(),
  decision: z.enum(["ALLOW", "WARN", "BLOCK", "REVIEW_REQUIRED"]).optional(),
  approvalStatus: z.enum(["auto", "pending", "approved", "rejected", "blocked"]).optional(),
  since: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listGovernanceDecisions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListInput>) => ListInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("governance_audit_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.tenantId) q = q.eq("tenant_id", data.tenantId);
    if (data.decision) q = q.eq("decision", data.decision);
    if (data.approvalStatus) q = q.eq("approval_status", data.approvalStatus);
    if (data.since) q = q.gte("created_at", data.since);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const getPendingApprovals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("governance_audit_events")
      .select("*")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

// ── Approve / reject a governance decision ────────────────────────────────
const DecideInput = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(2000).optional(),
});

export const decideGovernanceApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof DecideInput>) => DecideInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("governance_audit_events")
      .update({
        approval_status: data.action === "approve" ? "approved" : "rejected",
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
        metadata: { review_notes: data.notes ?? null } as unknown as never,
      })
      .eq("id", data.id)
      .eq("approval_status", "pending")
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { row };
  });

// ── Knowledge package ingest (admin-only, signed & verified) ──────────────
const KnowledgePackageSchema: z.ZodType<KnowledgePackage> = z.object({
  version: z.string(),
  generatedAt: z.string(),
  expiresAt: z.string(),
  hash: z.string(),
  signature: z.string().optional(),
  categories: z.array(z.object({ category: z.string(), frequency: z.number(), confidence: z.number() })),
  recommendations: z.array(z.object({ id: z.string(), effectiveness: z.number() })),
  calibration: z.object({ mae: z.number(), drift: z.number() }),
});

const IngestInput = z.object({
  sourceLabel: z.string().min(1).max(120),
  trust: z.enum(["internal", "staging", "partner", "experimental"]),
  package: KnowledgePackageSchema,
  localRecommendations: z
    .array(z.object({ id: z.string(), effectiveness: z.number() }))
    .default([]),
});

export const ingestKnowledgePackageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof IngestInput>) => IngestInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const trust = data.trust as TrustLevel;

    const validation = validateKnowledgePackage(data.package);
    const { verifyKnowledgePackage } = await import("@/lib/knowledge/signing.server");
    const verification = await verifyKnowledgePackage(data.package);

    const { persistKnowledgePackage, persistIngestionEvent } = await import(
      "@/lib/governance/persist.server"
    );

    if (!validation.valid || !verification.valid) {
      await persistIngestionEvent({
        packageId: null,
        sourceLabel: data.sourceLabel,
        trust,
        outcome: "rejected",
        reason: !verification.valid ? verification.reason ?? "invalid_signature" : "validation_failed",
        issues: validation.issues,
      });
      return {
        status: "REJECTED" as const,
        validation,
        verification,
      };
    }

    const persisted = await persistKnowledgePackage(data.package, trust, data.sourceLabel, verification);
    await persistIngestionEvent({
      packageId: persisted.id,
      sourceLabel: data.sourceLabel,
      trust,
      outcome: "accepted",
    });
    const recommendations = mergeRecommendations(
      data.localRecommendations,
      data.package.recommendations,
      trust,
    );
    return {
      status: "ACCEPTED_ADVISORY" as const,
      requiresApproval: true,
      packageId: persisted.id,
      verification,
      recommendations,
    };
  });

// ── List knowledge packages + ingestion events ────────────────────────────
export const listKnowledgePackages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("knowledge_packages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const listKnowledgeIngestionEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("knowledge_ingestion_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

const KpDecideInput = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(2000).optional(),
});

export const decideKnowledgePackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof KpDecideInput>) => KpDecideInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("knowledge_packages")
      .update({
        status: data.action === "approve" ? "approved" : "rejected",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        review_notes: data.notes ?? null,
      })
      .eq("id", data.id)
      .eq("status", "pending")
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { row };
  });
