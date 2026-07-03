/**
 * Compose Sentry event fetch → timeline builder → AI SRE replay into a
 * single incident-replay object safe to return from a server function.
 */

import { SentryClient } from "@/lib/sre/ai/sentry-client";
import { buildIncidentTimeline, type TimelineEvent } from "./build-timeline";
import { replayIncident } from "./ai-replay";
import type { IncidentReplay } from "./types";

export interface RunIncidentReplayOptions {
  eventLimit?: number;
  /** For tests: bypass live fetches. */
  client?: SentryClient;
  events?: TimelineEvent[];
}

export async function runIncidentReplay(
  issueId: string,
  opts: RunIncidentReplayOptions = {},
): Promise<IncidentReplay> {
  const client = opts.client ?? new SentryClient();
  if (!opts.events && !client.isConfigured()) {
    return emptyReplay(issueId, "Sentry not configured");
  }

  const issue = opts.events
    ? { id: issueId, shortId: undefined as string | undefined, title: issueId }
    : await client.getIssue(issueId).then((i) => ({
        id: i.id,
        shortId: i.shortId,
        title: i.title,
      }));

  const events =
    opts.events ??
    (await client.listIssueEvents(issueId, { limit: opts.eventLimit ?? 25 }));

  const timeline = buildIncidentTimeline(events);
  const steps = replayIncident(issue, timeline);

  const firstSeen = timeline[0]?.timestamp;
  const lastSeen = timeline[timeline.length - 1]?.timestamp;
  const peakErrorRate = timeline.reduce(
    (max, t) => (t.cumulativeErrorRate > max ? t.cumulativeErrorRate : max),
    0,
  );
  const confidentStep = steps.find((s) => s.confidence >= 0.7);
  const finalStep = steps[steps.length - 1];

  return {
    issueId: issue.id,
    shortId: issue.shortId,
    title: issue.title,
    timeline,
    steps,
    summary: {
      firstSeen,
      lastSeen,
      durationMs: firstSeen && lastSeen ? lastSeen - firstSeen : 0,
      totalEvents: timeline.length,
      peakErrorRate,
      finalConfidence: finalStep?.confidence ?? 0,
      finalCategory: finalStep?.rootCause ?? "unknown",
      systemic: finalStep?.systemic ?? false,
      timeToConfidentDetectionMs:
        confidentStep && firstSeen ? confidentStep.timestamp - firstSeen : undefined,
    },
  };
}

function emptyReplay(issueId: string, title: string): IncidentReplay {
  return {
    issueId,
    title,
    timeline: [],
    steps: [],
    summary: {
      durationMs: 0,
      totalEvents: 0,
      peakErrorRate: 0,
      finalConfidence: 0,
      finalCategory: "unknown",
      systemic: false,
    },
  };
}
