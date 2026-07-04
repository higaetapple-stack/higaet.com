/**
 * Cluster persistence — server-only (service role).
 *
 * Called from the SRE pipeline after an incident is hydrated. Idempotent:
 * safe to invoke on every webhook + cron pass. Never runs AI itself.
 */

import type { AISREAnalysis } from "@/lib/sre/ai/orchestrator";
import type { SentryIssue } from "@/lib/sre/ai/sentry-client";
import {
  computeSeverity,
  decideClusterAction,
  signatureFromIncident,
  type ClusterDecision,
} from "./cluster";
import type { AISREIncident } from "@/lib/sre/ai/orchestrator";

export interface UpsertClusterArgs {
  incident: AISREIncident;
  analysis: AISREAnalysis;
  analysisHash: string;
  issue: SentryIssue;
  force?: boolean;
}

export interface UpsertClusterResult {
  clusterId: string;
  signature: string;
  severity: number;
  decision: ClusterDecision;
}

export async function upsertIncidentCluster(
  args: UpsertClusterArgs,
): Promise<UpsertClusterResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const signature = signatureFromIncident(args.incident);
  const severity = computeSeverity({
    frequency: args.incident.frequency,
    userCount: args.incident.userCount,
    category: args.analysis.rootCause.topCategory,
    confidence: args.analysis.rootCause.confidence,
  });

  const { data: existing } = await supabaseAdmin
    .from("incident_clusters" as never)
    .select("id,severity_score,last_analysis_hash,issue_count,event_count,user_count,first_seen")
    .eq("signature", signature)
    .maybeSingle();
  const row = existing as null | {
    id: string;
    severity_score: number;
    last_analysis_hash: string | null;
    issue_count: number;
    event_count: number | string;
    user_count: number;
    first_seen: string;
  };

  const decision = decideClusterAction({
    existing: row ? { last_analysis_hash: row.last_analysis_hash, severity_score: row.severity_score } : null,
    newHash: args.analysisHash,
    newSeverity: severity,
    force: args.force,
  });

  const now = new Date().toISOString();
  const eventBump = Math.max(0, Number(args.incident.frequency ?? 0));

  if (!row) {
    const { data: inserted, error } = await supabaseAdmin
      .from("incident_clusters" as never)
      .insert({
        signature,
        title: args.issue.title ?? args.incident.title ?? signature,
        top_category: args.analysis.rootCause.topCategory,
        severity_score: severity,
        issue_count: 1,
        event_count: eventBump,
        user_count: Number(args.incident.userCount ?? 0),
        first_seen: args.issue.firstSeen ?? now,
        last_seen: args.issue.lastSeen ?? now,
        representative_issue_id: args.incident.id,
        last_analysis_hash: args.analysisHash,
        last_analyzed_at: now,
        status: "active",
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return {
      clusterId: (inserted as { id: string }).id,
      signature,
      severity,
      decision,
    };
  }

  // Existing cluster — dedup this issue in issue_count via a separate check.
  const { count: linkedCount } = await supabaseAdmin
    .from("sentry_issue_analyses" as never)
    .select("id", { count: "exact", head: true })
    .eq("cluster_id", row.id)
    .neq("issue_id", args.incident.id);
  const alreadyLinked = (linkedCount ?? 0) > 0
    ? await supabaseAdmin
        .from("sentry_issue_analyses" as never)
        .select("id", { head: true, count: "exact" })
        .eq("cluster_id", row.id)
        .eq("issue_id", args.incident.id)
        .then((r) => (r.count ?? 0) > 0)
    : false;

  const nextIssueCount = alreadyLinked ? row.issue_count : row.issue_count + 1;
  const nextEventCount = Number(row.event_count ?? 0) + eventBump;
  const nextSeverity = Math.max(row.severity_score, severity);

  const { error } = await supabaseAdmin
    .from("incident_clusters" as never)
    .update({
      issue_count: nextIssueCount,
      event_count: nextEventCount,
      user_count: Math.max(row.user_count, Number(args.incident.userCount ?? 0)),
      last_seen: args.issue.lastSeen ?? now,
      severity_score: nextSeverity,
      top_category: args.analysis.rootCause.topCategory,
      ...(decision.shouldAnalyze
        ? { last_analysis_hash: args.analysisHash, last_analyzed_at: now, representative_issue_id: args.incident.id }
        : {}),
    } as never)
    .eq("id", row.id);
  if (error) throw new Error(error.message);

  return { clusterId: row.id, signature, severity: nextSeverity, decision };
}
