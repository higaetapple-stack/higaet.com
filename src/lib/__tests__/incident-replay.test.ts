import { describe, it, expect } from "vitest";
import { buildIncidentTimeline, type TimelineEvent } from "@/lib/replay/build-timeline";
import { replayIncident } from "@/lib/replay/ai-replay";
import { runIncidentReplay } from "@/lib/replay/replay-engine";

const base = (over: Partial<TimelineEvent>): TimelineEvent => ({
  id: "e",
  timestamp: 0,
  frames: [],
  tags: {},
  ...over,
});

describe("incident replay", () => {
  it("builds a monotonically increasing timeline with cumulative error rate", () => {
    const events: TimelineEvent[] = [
      base({ id: "1", timestamp: 1_000_000, errorType: "AuthError", errorValue: "jwt expired" }),
      base({ id: "2", timestamp: 1_060_000, errorType: "AuthError", errorValue: "jwt expired" }),
      base({ id: "3", timestamp: 1_120_000, errorType: "AuthError", errorValue: "unauthorized" }),
    ];
    const t = buildIncidentTimeline(events);
    expect(t).toHaveLength(3);
    expect(t[0].eventCount).toBe(1);
    expect(t[2].eventCount).toBe(3);
    expect(t[2].cumulativeErrorRate).toBeGreaterThan(0);
    expect(t[2].timestamp).toBeGreaterThan(t[0].timestamp);
  });

  it("replays reasoning frame-by-frame, growing confidence over repeated auth signals", () => {
    const events: TimelineEvent[] = [
      base({ id: "1", timestamp: 1_000_000, errorType: "AuthError", errorValue: "jwt expired" }),
      base({ id: "2", timestamp: 1_060_000, errorType: "AuthError", errorValue: "jwt session lost" }),
      base({ id: "3", timestamp: 1_120_000, errorType: "AuthError", errorValue: "token invalid" }),
    ];
    const timeline = buildIncidentTimeline(events);
    const steps = replayIncident({ id: "1", title: "Auth failure" }, timeline);
    expect(steps).toHaveLength(3);
    expect(steps[0].rootCause).toBe("auth");
    // Later frames should be at least as confident as earlier ones for a stable signal.
    expect(steps[2].confidence).toBeGreaterThanOrEqual(steps[0].confidence);
    // detectionDelta should be present and not mark the first frame as a new hypothesis after the initial.
    expect(steps[1].detectionDelta?.newHypothesis).toBe(false);
  });

  it("runIncidentReplay short-circuits without Sentry config and injected events", async () => {
    const replay = await runIncidentReplay("unknown-issue");
    expect(replay.steps).toHaveLength(0);
    expect(replay.summary.totalEvents).toBe(0);
  });

  it("runIncidentReplay works with injected events (test path)", async () => {
    const events: TimelineEvent[] = [
      base({ id: "1", timestamp: 1_000_000, errorType: "PaymentError", errorValue: "stripe declined" }),
      base({ id: "2", timestamp: 1_120_000, errorType: "PaymentError", errorValue: "invoice failed" }),
    ];
    const replay = await runIncidentReplay("iss-1", { events });
    expect(replay.steps).toHaveLength(2);
    expect(replay.summary.finalCategory).toBe("payment");
    expect(replay.summary.totalEvents).toBe(2);
    expect(replay.summary.durationMs).toBe(120_000);
  });
});
