/**
 * Release ingestion + correlation attachment — server-only (service role).
 *
 * `syncReleasesFromSentry` pulls the latest Sentry releases into `releases`.
 * `correlateCluster` finds the best-matching release for a newly-seen (or
 * drifted) cluster and upserts a `cluster_release_correlations` row.
 *
 * Both are idempotent: safe to call from webhook, cron, and manual admin
 * triggers without producing duplicate rows.
 */

import { SentryClient } from "@/lib/sre/ai/sentry-client";
import { pickBestCorrelation, type ReleaseCandidate } from "./correlate";

const CORRELATION_LOOKBACK_MS = 48 * 60 * 60 * 1000; // 48h — wider than scoring window

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface SyncReleasesResult {
  fetched: number;
  upserted: number;
  skipped: number;
}

export async function syncReleasesFromSentry(
  deps: { client?: SentryClient; limit?: number } = {},
): Promise<SyncReleasesResult> {
  const client = deps.client ?? new SentryClient();
  if (!client.isConfigured()) return { fetched: 0, upserted: 0, skipped: 0 };
  const releases = await client.listReleases({ limit: deps.limit ?? 25 });
  const supa = await admin();
  let upserted = 0;
  let skipped = 0;
  for (const r of releases) {
    const deployedAt = r.dateReleased ?? r.dateCreated;
    if (!r.version || !deployedAt) {
      skipped += 1;
      continue;
    }
    const { error } = await supa
      .from("releases" as never)
      .upsert(
        {
          version: r.version,
          short_version: r.shortVersion ?? null,
          deployed_at: deployedAt,
          commit_sha: r.lastCommit?.id ?? null,
          commit_message: r.lastCommit?.message ?? null,
          new_groups: r.newGroups ?? null,
          commit_count: r.commitCount ?? 0,
          permalink: r.permalink,
          source: "sentry",
        } as never,
        { onConflict: "version" },
      );
    if (error) {
      skipped += 1;
    } else {
      upserted += 1;
    }
  }
  return { fetched: releases.length, upserted, skipped };
}

export interface CorrelateClusterInput {
  clusterId: string;
  firstSeen: string;
  severityScore: number;
  eventCount?: number;
}

export interface CorrelateClusterResult {
  correlated: boolean;
  releaseId?: string;
  score?: number;
  reason?: string;
}

export async function correlateCluster(
  input: CorrelateClusterInput,
): Promise<CorrelateClusterResult> {
  const supa = await admin();
  const since = new Date(Date.parse(input.firstSeen) - CORRELATION_LOOKBACK_MS).toISOString();
  const { data: rows, error } = await supa
    .from("releases" as never)
    .select("id,deployed_at,commit_count,new_groups")
    .gte("deployed_at", since)
    .lte("deployed_at", input.firstSeen)
    .order("deployed_at", { ascending: false })
    .limit(25);
  if (error || !rows || rows.length === 0) return { correlated: false };

  const candidates = rows as ReleaseCandidate[];
  const best = pickBestCorrelation(
    { first_seen: input.firstSeen, severity_score: input.severityScore },
    candidates,
  );
  if (!best) return { correlated: false };

  const { error: upsertErr } = await supa
    .from("cluster_release_correlations" as never)
    .upsert(
      {
        cluster_id: input.clusterId,
        release_id: best.releaseId,
        regression_score: best.score,
        time_delta_seconds: best.timeDeltaSeconds,
        event_count_delta: input.eventCount ?? 0,
        first_seen_after_release: best.firstSeenAfterRelease,
        status: best.score >= 60 ? "suspected" : "suspected",
        reason: best.reason,
      } as never,
      { onConflict: "cluster_id,release_id" },
    );
  if (upsertErr) return { correlated: false };
  return { correlated: true, releaseId: best.releaseId, score: best.score, reason: best.reason };
}
