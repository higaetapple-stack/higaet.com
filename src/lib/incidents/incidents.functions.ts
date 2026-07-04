/**
 * Admin server functions for the Incident Clusters layer.
 *
 * Reads only — writes happen exclusively inside the SRE pipeline via the
 * service role. Gated by assertGovernanceAdmin.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ListInput = z.object({
  status: z.enum(["active", "resolved", "muted"]).optional(),
  category: z.string().max(64).optional(),
  minSeverity: z.number().int().min(0).max(100).optional(),
  cursor: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export const listIncidentClusters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListInput>) => ListInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin, decodeCursor, paginateList } = await import(
      "@/lib/governance/rbac.server"
    );
    await assertGovernanceAdmin(context);
    let q = (context.supabase as any)
      .from("incident_clusters")
      .select("*", data.cursor ? undefined : { count: "exact" })
      .order("last_seen", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    if (data.category) q = q.eq("top_category", data.category);
    if (typeof data.minSeverity === "number") q = q.gte("severity_score", data.minSeverity);
    return paginateList(q, {
      cursor: decodeCursor(data.cursor),
      limit: data.limit,
      timestampColumn: "last_seen",
    });
  });

const GetInput = z.object({ clusterId: z.string().uuid() });

export const getIncidentCluster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof GetInput>) => GetInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    await assertGovernanceAdmin(context);
    const { data: cluster, error } = await (context.supabase as any)
      .from("incident_clusters")
      .select("*")
      .eq("id", data.clusterId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const { data: issues } = await (context.supabase as any)
      .from("sentry_issue_analyses")
      .select("id,issue_id,short_id,title,category,confidence,risk_score,status,trigger,created_at,sentry_permalink,auto_pr_recommended")
      .eq("cluster_id", data.clusterId)
      .order("created_at", { ascending: false })
      .limit(100);
    return { cluster, issues: issues ?? [] };
  });

const StatusInput = z.object({
  clusterId: z.string().uuid(),
  status: z.enum(["active", "resolved", "muted"]),
});

export const setClusterStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof StatusInput>) => StatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    await assertGovernanceAdmin(context);
    const { error } = await (context.supabase as any)
      .from("incident_clusters")
      .update({ status: data.status })
      .eq("id", data.clusterId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ExportInput = z.object({
  status: z.enum(["active", "resolved", "muted"]).optional(),
  category: z.string().max(64).optional(),
  minSeverity: z.number().int().min(0).max(100).optional(),
});

export const exportIncidentClustersCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ExportInput>) => ExportInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    const { toCsv } = await import("@/lib/governance/api-helpers.server");
    await assertGovernanceAdmin(context);
    let q = (context.supabase as any)
      .from("incident_clusters")
      .select(
        "last_seen,first_seen,signature,title,top_category,severity_score,issue_count,event_count,user_count,status,representative_issue_id",
      )
      .order("last_seen", { ascending: false })
      .limit(5000);
    if (data.status) q = q.eq("status", data.status);
    if (data.category) q = q.eq("top_category", data.category);
    if (typeof data.minSeverity === "number") q = q.gte("severity_score", data.minSeverity);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const csv = toCsv(rows ?? [], [
      "last_seen",
      "first_seen",
      "signature",
      "title",
      "top_category",
      "severity_score",
      "issue_count",
      "event_count",
      "user_count",
      "status",
      "representative_issue_id",
    ]);
    return { csv, count: (rows ?? []).length };
  });
