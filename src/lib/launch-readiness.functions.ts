import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { LaunchReadinessRun } from "./launch-readiness.types";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const [{ data: a }, { data: s }] = await Promise.all([
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" }),
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" }),
  ]);
  if (!a && !s) throw new Error("Forbidden");
}

export const getLatestReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LaunchReadinessRun | null> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("launch_readiness_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as LaunchReadinessRun) ?? null;
  });

export const listReadinessHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      page?: number;
      pageSize?: number;
      branch?: string;
      environment?: string;
      status?: string;
    }) => d ?? {},
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const page = Math.max(1, data.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, data.pageSize ?? 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = context.supabase
      .from("launch_readiness_runs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.branch) q = q.eq("branch", data.branch);
    if (data.environment) q = q.eq("environment", data.environment);
    if (data.status) q = q.eq("overall_status", data.status);

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return {
      rows: (rows ?? []) as LaunchReadinessRun[],
      total: count ?? 0,
      page,
      pageSize,
    };
  });

export const getReadinessRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<LaunchReadinessRun | null> => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("launch_readiness_runs")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as LaunchReadinessRun) ?? null;
  });

export const getReadinessArtifacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("launch_readiness_runs")
      .select("artifact_urls, workflow_run_id, commit_sha")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? null;
  });
