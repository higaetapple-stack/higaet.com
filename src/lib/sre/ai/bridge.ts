/**
 * Sentry → AI SRE bridge. Fetches issues via the Sentry REST API, hydrates
 * each with its latest event, and runs the analysis loop.
 *
 * Silent no-op when SENTRY_AUTH_TOKEN is missing — the app stays healthy
 * even before the integration is wired up.
 */

import { SentryClient, type SentryIssue } from "./sentry-client";
import { runAISRELoop, type AISREAnalysis } from "./orchestrator";

export interface ProcessSentryIssuesOptions {
  query?: string;
  limit?: number;
  hydrateEvent?: boolean;
  client?: SentryClient;
}

export interface ProcessSentryIssuesResult {
  scanned: number;
  analyses: AISREAnalysis[];
  autoPRRecommended: AISREAnalysis[];
  skippedReason?: "not-configured";
}

// In-worker throttle: at most one live Sentry sweep every 30s per isolate.
// A caller can force a fresh fetch by passing a custom client.
const CACHE_TTL_MS = 30_000;
let cache: { at: number; result: ProcessSentryIssuesResult } | null = null;

export async function processSentryIssues(
  opts: ProcessSentryIssuesOptions = {},
): Promise<ProcessSentryIssuesResult> {
  const useCache = !opts.client;
  if (useCache && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.result;
  }
  const client = opts.client ?? new SentryClient();
  if (!client.isConfigured()) {
    return { scanned: 0, analyses: [], autoPRRecommended: [], skippedReason: "not-configured" };
  }

  const issues = await client.listIssues({ query: opts.query, limit: opts.limit ?? 20 });
  const analyses: AISREAnalysis[] = [];

  for (const issue of issues) {
    const incident = await hydrateIncident(client, issue, opts.hydrateEvent ?? true);
    analyses.push(runAISRELoop(incident));
  }

  const result: ProcessSentryIssuesResult = {
    scanned: issues.length,
    analyses,
    autoPRRecommended: analyses.filter((a) => a.autoPRRecommended),
  };
  if (useCache) cache = { at: Date.now(), result };
  return result;
}

/** Clear the throttle cache (test / manual-refresh use only). */
export function _clearSentryInsightsCache() {
  cache = null;
}

async function hydrateIncident(client: SentryClient, issue: SentryIssue, hydrateEvent: boolean) {
  const base = {
    id: issue.id,
    shortId: issue.shortId,
    permalink: issue.permalink,
    title: issue.title,
    culprit: issue.culprit,
    errorType: issue.metadata?.type ?? null,
    errorValue: issue.metadata?.value ?? null,
    frequency: typeof issue.count === "string" ? Number(issue.count) : issue.count ?? 0,
    userCount: issue.userCount ?? 0,
    frames: [] as Array<{ filename?: string; function?: string }>,
  };

  if (!hydrateEvent) return base;

  try {
    const event = await client.getLatestEvent(issue.id);
    if (event) {
      base.errorType = event.errorType ?? base.errorType;
      base.errorValue = event.errorValue ?? base.errorValue;
      base.frames = event.frames.slice(0, 10).map((f) => ({
        filename: f.filename,
        function: f.function,
      }));
    }
  } catch {
    // Non-fatal — analyze on the issue-level signal alone.
  }
  return base;
}
