import type { AgentContext } from "./types";
import { runWorker } from "./workers";

export function runMultiAgentSystem(context: AgentContext): AgentContext {
  return { ...context, tasks: context.tasks.map((t) => runWorker(t)) };
}
