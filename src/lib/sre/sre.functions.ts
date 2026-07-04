/**
 * Admin-facing server functions for the Sentry AI SRE pipeline.
 *
 * All reads/writes gated behind assertGovernanceAdmin — the same admin/
 * super_admin gate used by the governance dashboard.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ListInput = z.object({
  status: z.enum(["processed", "failed", "skipped"]).optional(),
  trigger: z.enum(["webhook", "cron", "manual"]).optional(),
  category: z.string().max(64).optional(),
  autoPROnly: z.boolean().optional(),
  cursor: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(500).default(50),
});

export const listSentryAnalyses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ListInput>) => ListInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin, decodeCursor, paginateList } = await import(
      "@/lib/governance/rbac.server"
    );
    await assertGovernanceAdmin(context);
    let q = (context.supabase as any)
      .from("sentry_issue_analyses")
      .select("*", data.cursor ? undefined : { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status);
    if (data.trigger) q = q.eq("trigger", data.trigger);
    if (data.category) q = q.eq("category", data.category);
    if (data.autoPROnly) q = q.eq("auto_pr_recommended", true);
    return paginateList(q, { cursor: decodeCursor(data.cursor), limit: data.limit });
  });

const GetInput = z.object({ issueId: z.string().min(1).max(64) });

export const getSentryAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof GetInput>) => GetInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    await assertGovernanceAdmin(context);
    const { data: row, error } = await (context.supabase as any)
      .from("sentry_issue_analyses")
      .select("*")
      .eq("issue_id", data.issueId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { row };
  });

const ReprocessInput = z.object({ issueId: z.string().min(1).max(64) });

export const reprocessSentryIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ReprocessInput>) => ReprocessInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    await assertGovernanceAdmin(context);
    const { processSentryIssue } = await import("@/lib/sre/pipeline/process-issue.server");
    return processSentryIssue({ issueId: data.issueId, trigger: "manual", force: true });
  });

const ExportInput = z.object({
  status: z.enum(["processed", "failed", "skipped"]).optional(),
  trigger: z.enum(["webhook", "cron", "manual"]).optional(),
  category: z.string().max(64).optional(),
  autoPROnly: z.boolean().optional(),
});

export const exportSentryAnalysesCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ExportInput>) => ExportInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertGovernanceAdmin } = await import("@/lib/governance/rbac.server");
    const { toCsv } = await import("@/lib/governance/api-helpers.server");
    await assertGovernanceAdmin(context);
    let q = (context.supabase as any)
      .from("sentry_issue_analyses")
      .select(
        "created_at,issue_id,short_id,title,category,confidence,risk_score,auto_pr_recommended,status,trigger,sentry_permalink",
      )
      .order("created_at", { ascending: false })
      .limit(5000);
    if (data.status) q = q.eq("status", data.status);
    if (data.trigger) q = q.eq("trigger", data.trigger);
    if (data.category) q = q.eq("category", data.category);
    if (data.autoPROnly) q = q.eq("auto_pr_recommended", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const csv = toCsv(rows ?? [], [
      "created_at",
      "issue_id",
      "short_id",
      "title",
      "category",
      "confidence",
      "risk_score",
      "auto_pr_recommended",
      "status",
      "trigger",
      "sentry_permalink",
    ]);
    return { csv, count: (rows ?? []).length };
  });
