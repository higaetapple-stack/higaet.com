// Release Intelligence server functions.
// Client-safe imports; handler bodies stripped from client bundle.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildReleaseReport } from "./releases/report";
import { fetchReleaseSnapshot } from "./releases/snapshot";
import type { ReleaseReport } from "./releases/types";
import { analyzeRelease } from "./sre/engine";
import { planFixesFromAnalysis } from "./sre/auto-fix";
import { buildRollbackSignal, type RollbackSignal } from "./sre/rollback-controller";
import { predictFailure } from "./sre/predictive";
import { formatSREAlert } from "./sre/alerting";
import type { FixPlan, PredictiveContext, PredictiveResult, SREAnalysis } from "./sre/types";

const input = z.object({
  releaseId: z.string().trim().min(1).max(120).default("latest"),
});

// Uses the authenticated Supabase client from requireSupabaseAuth context.
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (isAdmin) return;
  const { data: isSuper } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin",
  });
  if (!isSuper) throw new Error("Forbidden");
}

export const adminReleaseReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<ReleaseReport> => {
    await assertAdmin(context);
    return buildReleaseReport(data.releaseId);
  });

export type SREReport = {
  analysis: SREAnalysis;
  signal: RollbackSignal;
  alert: { subject: string; body: string };
  fixPlan: FixPlan;
  predictive: PredictiveResult;
};

/**
 * AI SRE report for a release id. Pure orchestration on top of the
 * release snapshot layer — no external side effects. UI displays the
 * decision, rollback signal, planned fixes, and predictive gate result.
 */
export const adminSreReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<SREReport> => {
    await assertAdmin(context);
    const [before, after] = await Promise.all([
      fetchReleaseSnapshot(data.releaseId, "before"),
      fetchReleaseSnapshot(data.releaseId, "after"),
    ]);
    const analysis = analyzeRelease(data.releaseId, before, after);
    const signal = buildRollbackSignal(data.releaseId, analysis.decision);
    const alert = formatSREAlert(analysis);
    const fixPlan = planFixesFromAnalysis(analysis);
    const predictiveCtx: PredictiveContext = {
      paymentFailures: Math.max(0, 100 - after.paymentSuccessRate),
      errorRate: after.errorRate,
      signupDrop: Math.max(0, before.signupConversion - after.signupConversion),
      authErrors: analysis.delta.errorDelta > 0 ? analysis.delta.errorDelta : 0,
      lighthouseScore: after.lighthouseScore,
    };
    const predictive = predictFailure(predictiveCtx);
    return { analysis, signal, alert, fixPlan, predictive };
  });

