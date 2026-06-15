import type { ExecutionEvent, TimelineStep } from "./types";

export function buildTimeline(events: ExecutionEvent[]): TimelineStep[] {
  return events.map((e, index) => ({
    step: index + 1,
    timestamp: e.timestamp,
    agent: e.agent,
    action: e.action,
    strategy: e.metadata?.strategy ?? "default",
    memoryKeys: e.metadata?.memoryKeys ?? [],
    blocked: e.metadata?.blocked ?? false,
  }));
}
