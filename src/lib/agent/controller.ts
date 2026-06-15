import type { AgentSession } from "./types";
import { validateAgentAction } from "./firewall";
import { runAgentStep } from "./runtime";

export function stepAgent(session: AgentSession): AgentSession {
  const step = session.steps[session.currentStep];
  if (!step) return session;

  const check = validateAgentAction(step);
  if (!check.allowed) {
    step.status = "blocked";
    return session;
  }
  return runAgentStep(session);
}
