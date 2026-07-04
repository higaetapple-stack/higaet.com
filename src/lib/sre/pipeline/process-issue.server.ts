/**
 * Unified Sentry → AI SRE pipeline entry point.
 *
 * SINGLE orchestrator called by BOTH inputs (real-time webhook + cron
 * backfill). Never invoked directly by client code. Guarantees:
 *   - one analysis row per Sentry issue (upsert by issue_id)
 *   - deduplicated by TTL unless force=true
 *   - PR draft is a derived artifact, never a separate side-effect
 *
 * Server-only: uses supabaseAdmin (service role) so both public webhook
 * and cron routes can persist without a user session. The webhook and
 * cron routes are responsible for authenticating their own callers before
 * invoking this function.
 */

import { SentryClient, type SentryIssue } from "@/lib/sre/ai/sentry-client";
import { runAISRELoop, type AISREIncident } from "@/lib/sre/ai/orchestrator";
import { buildPRDraft, computeAnalysisHash, computeRiskScore } from "./pr-draft";

const DEDUP_TTL_MS = 15 * 60 * 1000; // 15 minutes

export type PipelineTrigger = "webhook" | "cron" | "manual";

export interface ProcessSentryIssueInput {
  issueId: string;
  trigger: PipelineTrigger;
  force?: boolean;
}

export interface ProcessSentryIssueResult {
  status: "processed" | "skipped" | "failed" | "not-configured";
  analysisId?: string;
  prSuggested?: boolean;
  reason?: string;
  error?: string;
}

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function hydrateIncident(issue: SentryIssue, event: Awaited<ReturnType<SentryClient["getLatestEvent"]>>): AISREIncident {
  return {
    id: issue.id,
    shortId: issue.shortId,
    permalink: issue.permalink,
    title: issue.title,
    culprit: issue.culprit ?? null,
    errorType: event?.errorType ?? issue.metadata?.type ?? null,
    errorValue: event?.errorValue ?? issue.metadata?.value ?? null,
    frequency: typeof issue.count === "string" ? Number(issue.count) : issue.count ?? 0,
    userCount: issue.userCount ?? 0,
    frames: (event?.frames ?? []).slice(0, 10).map((f) => ({
      filename: f.filename,
      function: f.function,
    })),
  };
}

export async function processSentryIssue(
  input: ProcessSentryIssueInput,
  deps: { client?: SentryClient } = {},
): Promise<ProcessSentryIssueResult> {
  const { issueId, trigger, force = false } = input;
  const admin = await getAdmin();

  // Dedup guard — cheap read before any Sentry API call.
  if (!force) {
    const { data: existing } = await admin
      .from("sentry_issue_analyses" as never)
      .select("id,status,updated_at")
      .eq("issue_id", issueId)
      .maybeSingle();
    const row = existing as { id: string; status: string; updated_at: string } | null;
    if (row && row.status === "processed") {
      const age = Date.now() - Date.parse(row.updated_at);
      if (Number.isFinite(age) && age < DEDUP_TTL_MS) {
        return { status: "skipped", analysisId: row.id, reason: "recent-analysis" };
      }
    }
  }

  const client = deps.client ?? new SentryClient();
  if (!client.isConfigured()) {
    return { status: "not-configured" };
  }

  try {
    const issue = await client.getIssue(issueId);
    const event = await client.getLatestEvent(issueId).catch(() => null);
    const incident = hydrateIncident(issue, event);
    const analysis = runAISRELoop(incident);
    const hash = computeAnalysisHash(analysis);
    const risk = computeRiskScore(analysis);

    // Clustering: dedup near-identical issues into a single incident and let
    // the cluster decide whether AI SRE + PR draft should re-fire.
    const { upsertIncidentCluster } = await import("@/lib/incidents/upsert.server");
    const clusterResult = await upsertIncidentCluster({
      incident,
      analysis,
      analysisHash: hash,
      issue,
      force,
    });

    const prDraft =
      analysis.autoPRRecommended && clusterResult.decision.shouldSuggestPR
        ? buildPRDraft(analysis, issue)
        : null;

    const { data: upserted, error } = await admin
      .from("sentry_issue_analyses" as never)
      .upsert(
        {
          issue_id: issueId,
          short_id: issue.shortId ?? null,
          title: issue.title ?? issueId,
          sentry_permalink: issue.permalink ?? null,
          category: analysis.rootCause.topCategory,
          confidence: analysis.rootCause.confidence,
          risk_score: risk,
          root_cause: analysis.rootCause as never,
          fix_plan: analysis.fixPlan as never,
          pr_suggestion: prDraft as never,
          auto_pr_recommended: analysis.autoPRRecommended && clusterResult.decision.shouldSuggestPR,
          analysis_hash: hash,
          status: "processed",
          error: null,
          trigger,
          cluster_id: clusterResult.clusterId,
          signature: clusterResult.signature,
          analyzed_at: new Date().toISOString(),
        } as never,
        { onConflict: "issue_id" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const id = (upserted as { id: string } | null)?.id;

    // Release regression correlation — only when this is a new cluster or a
    // drift event. Non-blocking: correlation failure never fails the pipeline.
    if (clusterResult.decision.isNew || clusterResult.decision.drift) {
      try {
        const { correlateCluster } = await import("@/lib/releases/sync.server");
        await correlateCluster({
          clusterId: clusterResult.clusterId,
          firstSeen: issue.firstSeen ?? new Date().toISOString(),
          severityScore: clusterResult.severity,
          eventCount: incident.frequency,
        });
      } catch {
        // Correlation is advisory — do not surface as a pipeline failure.
      }
    }

    return { status: "processed", analysisId: id, prSuggested: !!prDraft };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    try {
      await admin
        .from("sentry_issue_analyses" as never)
        .upsert(
          {
            issue_id: issueId,
            title: issueId,
            status: "failed",
            error: msg.slice(0, 500),
            trigger,
            analyzed_at: new Date().toISOString(),
          } as never,
          { onConflict: "issue_id" },
        );
    } catch {
      // Persistence failure on the failure path — swallow to avoid masking the root error.
    }
    return { status: "failed", error: msg };
  }
}
