/**
 * Admin server functions for the Release Regression layer.
 *
 * Reads gated by assertGovernanceAdmin. `syncReleases` and `retagStatus`
 * are the only writes; sync pulls from Sentry, retagStatus lets an admin
 * confirm / dismiss a suspected regression correlation.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ListReleasesInput = z.object({
  cursor: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(200).default(50),
  environment: z.string().max(64).optional(),
});

export const listReleases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListReleasesInput>) => ListReleasesInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin, decodeCursor, paginateList } = await import(
      "@/lib/governance/rbac.server"
    );
    await assertGovernanceAdmin(context);
    let q = (context.supabase as any)
      .from("releases")
      .select("*", data.cursor ? undefined : { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.environment) q = q.eq("environment", data.environment);
    return paginateList(q, { cursor: decodeCursor(data.cursor), limit: data.limit });
  });

const ReleaseDetailInput = z.object({ releaseId: z.string().uuid() });

export const getReleaseWithCorrelations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ReleaseDetailInput>) => ReleaseDetailInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    await assertGovernanceAdmin(context);
    const { data: release, error } = await (context.supabase as any)
      .from("releases")
      .select("*")
      .eq("id", data.releaseId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const { data: correlations } = await (context.supabase as any)
      .from("cluster_release_correlations")
      .select(
        "id,regression_score,time_delta_seconds,event_count_delta,status,reason,cluster_id,incident_clusters(title,severity_score,issue_count,event_count,top_category,status,signature)",
      )
      .eq("release_id", data.releaseId)
      .order("regression_score", { ascending: false });
    return { release, correlations: correlations ?? [] };
  });

const ClusterCorrelationsInput = z.object({ clusterId: z.string().uuid() });

export const getClusterCorrelations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ClusterCorrelationsInput>) => ClusterCorrelationsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    await assertGovernanceAdmin(context);
    const { data: rows } = await (context.supabase as any)
      .from("cluster_release_correlations")
      .select(
        "id,regression_score,time_delta_seconds,event_count_delta,status,reason,release_id,releases(version,short_version,deployed_at,permalink,commit_sha,commit_message,commit_count,new_groups)",
      )
      .eq("cluster_id", data.clusterId)
      .order("regression_score", { ascending: false });
    return { correlations: rows ?? [] };
  });

const StatusInput = z.object({
  correlationId: z.string().uuid(),
  status: z.enum(["suspected", "confirmed", "dismissed"]),
});

export const setCorrelationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof StatusInput>) => StatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    await assertGovernanceAdmin(context);
    const { error } = await (context.supabase as any)
      .from("cluster_release_correlations")
      .update({ status: data.status })
      .eq("id", data.correlationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncReleases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    await assertGovernanceAdmin(context);
    const { syncReleasesFromSentry } = await import("@/lib/releases/sync.server");
    return syncReleasesFromSentry({ limit: 50 });
  });
