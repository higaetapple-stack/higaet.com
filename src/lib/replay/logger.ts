import type { ExecutionEvent } from "./types";

/**
 * B.48 — In-memory ring buffer for execution events.
 * Read-only after capture. Never mutates runtime behavior.
 * Bounded to avoid unbounded memory growth.
 */
const MAX_EVENTS = 1000;
const eventLog: ExecutionEvent[] = [];

export function logEvent(event: ExecutionEvent): void {
  eventLog.push(event);
  if (eventLog.length > MAX_EVENTS) {
    eventLog.splice(0, eventLog.length - MAX_EVENTS);
  }
}

export function getEvents(): ReadonlyArray<ExecutionEvent> {
  return eventLog;
}

export function clearEvents(): void {
  eventLog.length = 0;
}

// Seed a small deterministic trace so the replay UI has content out of the box.
// Real captures come from B.42 agents calling logEvent() at decision points.
if (eventLog.length === 0) {
  const t = Date.now() - 60_000;
  const seed: ExecutionEvent[] = [
    { id: "e1", timestamp: t, agent: "planner", action: "decompose-goal", input: { goal: "demo" }, output: { steps: 3 }, metadata: { strategy: "deep-analysis" } },
    { id: "e2", timestamp: t + 5_000, agent: "researcher", action: "gather-context", input: {}, output: { docs: 4 }, metadata: { strategy: "deep-analysis", memoryKeys: ["ctx:demo"] } },
    { id: "e3", timestamp: t + 12_000, agent: "navigator", action: "route-map", input: {}, output: { route: "/technologies" }, metadata: { strategy: "fast-path", blocked: true } },
    { id: "e4", timestamp: t + 18_000, agent: "validator", action: "approve", input: {}, output: { ok: true }, metadata: { strategy: "precision-mode", memoryKeys: ["policy:b10"] } },
  ];
  seed.forEach(logEvent);
}
