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
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listGovernanceDecisions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListInput>) => ListInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("governance_audit_events")
      .select("*", data.cursor ? undefined : { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.tenantId) q = q.eq("tenant_id", data.tenantId);
    if (data.decision) q = q.eq("decision", data.decision);
    if (data.approvalStatus) q = q.eq("approval_status", data.approvalStatus);
    if (data.since) q = q.gte("created_at", data.since);
    if (data.cursor) q = q.lt("created_at", data.cursor);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    const nextCursor = list.length === data.limit ? list[list.length - 1].created_at : null;
    return { rows: list, nextCursor, total: count ?? null };
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
  tenantId: z.string().max(120).optional(),
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

    const { persistKnowledgePackage, persistIngestionEvent, persistSignatureFailure } = await import(
      "@/lib/governance/persist.server"
    );

    if (!validation.valid || !verification.valid) {
      const reason = !verification.valid
        ? verification.reason ?? "invalid_signature"
        : "validation_failed";
      await persistIngestionEvent({
        packageId: null,
        sourceLabel: data.sourceLabel,
        trust,
        outcome: "rejected",
        reason,
        issues: validation.issues,
      });
      // Also record a structured signature-failure audit entry so the admin
      // dashboard can filter by tenant / reason without wading through the
      // wider ingestion event log.
      await persistSignatureFailure({
        sourceLabel: data.sourceLabel,
        trust,
        tenantId: data.tenantId ?? null,
        reason,
        keyId: verification.keyId ?? null,
        packageHash: data.package.hash ?? null,
        schemaVersion: data.package.version ?? null,
        generatedAt: data.package.generatedAt ?? null,
        expiresAt: data.package.expiresAt ?? null,
        issues: validation.issues,
      });
      return { status: "REJECTED" as const, validation, verification };
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

// ── List knowledge packages + ingestion events (cursor paginated) ─────────
const KpListInput = z.object({
  status: z.string().optional(),
  trust: z.string().optional(),
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listKnowledgePackages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof KpListInput>) => KpListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("knowledge_packages")
      .select("*", data.cursor ? undefined : { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    if (data.trust) q = q.eq("trust_level", data.trust);
    if (data.cursor) q = q.lt("created_at", data.cursor);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    const nextCursor = list.length === data.limit ? list[list.length - 1].created_at : null;
    return { rows: list, nextCursor, total: count ?? null };
  });

const KieListInput = z.object({
  trust: z.string().optional(),
  sourceLabel: z.string().optional(),
  outcome: z.enum(["accepted", "rejected"]).optional(),
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listKnowledgeIngestionEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof KieListInput>) => KieListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("knowledge_ingestion_events")
      .select("*", data.cursor ? undefined : { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.trust) q = q.eq("trust_level", data.trust);
    if (data.sourceLabel) q = q.eq("source_label", data.sourceLabel);
    if (data.outcome) q = q.eq("outcome", data.outcome);
    if (data.cursor) q = q.lt("created_at", data.cursor);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    const nextCursor = list.length === data.limit ? list[list.length - 1].created_at : null;
    return { rows: list, nextCursor, total: count ?? null };
  });

// ── Signature failure audit log (dashboard-facing) ────────────────────────
const KsfListInput = z.object({
  tenantId: z.string().optional(),
  reason: z.string().optional(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(100),
});

export const listSignatureFailures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof KsfListInput>) => KsfListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = (context.supabase as any)
      .from("knowledge_signature_failures")
      .select("*", data.cursor ? undefined : { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.tenantId) q = q.eq("tenant_id", data.tenantId);
    if (data.reason) q = q.eq("reason", data.reason);
    if (data.since) q = q.gte("created_at", data.since);
    if (data.until) q = q.lte("created_at", data.until);
    if (data.cursor) q = q.lt("created_at", data.cursor);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    const list = (rows ?? []) as any[];
    const nextCursor = list.length === data.limit ? list[list.length - 1].created_at : null;
    return { rows: list, nextCursor, total: count ?? null };
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

// ── CSV export server functions (called by the admin dashboard) ───────────
import { toCsv } from "@/lib/governance/api-helpers.server";

const ExportDecisionsInput = z.object({
  tenantId: z.string().optional(),
  decision: z.enum(["ALLOW", "WARN", "BLOCK", "REVIEW_REQUIRED"]).optional(),
  approvalStatus: z.enum(["auto", "pending", "approved", "rejected", "blocked"]).optional(),
  since: z.string().datetime().optional(),
});

export const exportGovernanceDecisionsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ExportDecisionsInput>) => ExportDecisionsInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("governance_audit_events")
      .select(
        "id,created_at,tenant_id,source,decision,risk_score,confidence,requires_human_approval,approval_status",
      )
      .order("created_at", { ascending: false })
      .limit(10000);
    if (data.tenantId) q = q.eq("tenant_id", data.tenantId);
    if (data.decision) q = q.eq("decision", data.decision);
    if (data.approvalStatus) q = q.eq("approval_status", data.approvalStatus);
    if (data.since) q = q.gte("created_at", data.since);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return {
      csv: toCsv(rows ?? [], [
        "id",
        "created_at",
        "tenant_id",
        "source",
        "decision",
        "risk_score",
        "confidence",
        "requires_human_approval",
        "approval_status",
      ]),
    };
  });

const ExportKpInput = z.object({
  status: z.string().optional(),
  trust: z.string().optional(),
});

export const exportKnowledgePackagesCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ExportKpInput>) => ExportKpInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("knowledge_packages")
      .select(
        "id,created_at,source_label,trust_level,schema_version,generated_at,expires_at,signature_valid,status,reviewed_at",
      )
      .order("created_at", { ascending: false })
      .limit(10000);
    if (data.status) q = q.eq("status", data.status);
    if (data.trust) q = q.eq("trust_level", data.trust);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return {
      csv: toCsv(rows ?? [], [
        "id",
        "created_at",
        "source_label",
        "trust_level",
        "schema_version",
        "generated_at",
        "expires_at",
        "signature_valid",
        "status",
        "reviewed_at",
      ]),
    };
  });

export const exportSignatureFailuresCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof KsfListInput>) => KsfListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = (context.supabase as any)
      .from("knowledge_signature_failures")
      .select(
        "id,created_at,tenant_id,source_label,trust_level,reason,key_id,schema_version,package_hash,generated_at,expires_at",
      )
      .order("created_at", { ascending: false })
      .limit(10000);
    if (data.tenantId) q = q.eq("tenant_id", data.tenantId);
    if (data.reason) q = q.eq("reason", data.reason);
    if (data.since) q = q.gte("created_at", data.since);
    if (data.until) q = q.lte("created_at", data.until);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return {
      csv: toCsv((rows ?? []) as any[], [
        "id",
        "created_at",
        "tenant_id",
        "source_label",
        "trust_level",
        "reason",
        "key_id",
        "schema_version",
        "package_hash",
        "generated_at",
        "expires_at",
      ]),
    };
  });

