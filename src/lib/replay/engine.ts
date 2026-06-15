import { getEvents } from "./logger";
import type { AgentRole, ExecutionEvent } from "./types";

export function replayEvents(filter?: AgentRole): ExecutionEvent[] {
  return getEvents()
    .filter((e) => (filter ? e.agent === filter : true))
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp);
}
