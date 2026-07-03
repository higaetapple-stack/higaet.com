/**
 * Admin-gated server function that surfaces the AI SRE analysis of live
 * Sentry issues to the admin dashboard. Read-only, advisory: never opens
 * PRs, never mutates provider state.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { processSentryIssues } from "@/lib/sre/ai/bridge";
import type { AISREAnalysis } from "@/lib/sre/ai/orchestrator";

export interface SentryInsightsSummaryItem {
  issueId: string;
  shortId?: string;
  title: string;
  permalink?: string;
  topCategory: AISREAnalysis["rootCause"]["topCategory"];
  confidence: number;
  systemic: boolean;
  hypotheses: Array<{ category: string; description: string; weight: number }>;
  fixPlan: Array<{ category: string; action: string; targetHint: string; testHint: string; risk: string }>;
  autoPRRecommended: boolean;
  pr: { title: string; body: string; labels: string[]; branchHint: string };
}

export interface SentryInsightsPayload {
  timestamp: number;
  configured: boolean;
  scanned: number;
  autoPRRecommendedCount: number;
  items: SentryInsightsSummaryItem[];
}

async function assertAdmin(ctx: {
  supabase: {
    rpc: (
      name: "has_role",
      args: { _user_id: string; _role: "admin" | "super_admin" },
    ) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  };
  userId: string;
}) {
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

function toSummary(a: AISREAnalysis): SentryInsightsSummaryItem {
  return {
    issueId: a.issueId,
    shortId: a.shortId,
    title: a.prSuggestion.title,
    permalink: undefined,
    topCategory: a.rootCause.topCategory,
    confidence: a.rootCause.confidence,
    systemic: a.rootCause.systemic,
    hypotheses: a.rootCause.hypotheses.map((h) => ({
      category: h.category,
      description: h.description,
      weight: h.weight,
    })),
    fixPlan: a.fixPlan.map((f) => ({
      category: f.category,
      action: f.action,
      targetHint: f.targetHint,
      testHint: f.testHint,
      risk: f.risk,
    })),
    autoPRRecommended: a.autoPRRecommended,
    pr: {
      title: a.prSuggestion.title,
      body: a.prSuggestion.body,
      labels: a.prSuggestion.labels,
      branchHint: a.prSuggestion.branchHint,
    },
  };
}

export const adminGetSentryInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SentryInsightsPayload> => {
    await assertAdmin(context as never);
    const result = await processSentryIssues({ limit: 20 });
    return {
      timestamp: Date.now(),
      configured: result.skippedReason !== "not-configured",
      scanned: result.scanned,
      autoPRRecommendedCount: result.autoPRRecommended.length,
      items: result.analyses.map(toSummary),
    };
  });
