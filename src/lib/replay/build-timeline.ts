/**
 * Fold an ordered list of Sentry events into a cumulative incident timeline.
 * Pure — no I/O — so tests can drive it directly.
 */

import type { SentryEventDetail } from "@/lib/sre/ai/sentry-client";
import type { IncidentSnapshot } from "./types";

export type TimelineEvent = SentryEventDetail & { timestamp: number };

export function buildIncidentTimeline(events: TimelineEvent[]): IncidentSnapshot[] {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const start = sorted[0].timestamp;
  const timeline: IncidentSnapshot[] = [];

  sorted.forEach((event, i) => {
    const eventCount = i + 1;
    // Errors per minute since the first event, floor of 1 minute to avoid div/0.
    const windowMinutes = Math.max((event.timestamp - start) / 60_000, 1);
    const cumulativeErrorRate = Number((eventCount / windowMinutes).toFixed(3));
    timeline.push({
      timestamp: event.timestamp,
      eventCount,
      cumulativeErrorRate,
      errorType: event.errorType,
      errorValue: event.errorValue,
      message: event.message,
      topFrame: event.frames[0]
        ? { filename: event.frames[0].filename, function: event.frames[0].function }
        : undefined,
    });
  });

  return timeline;
}
