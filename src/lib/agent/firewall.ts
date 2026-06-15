import type { AgentStep } from "./types";

const FORBIDDEN = ["filesystem", "network_write", "auth_change", "server_mutation"];

export function validateAgentAction(step: Pick<AgentStep, "action">) {
  if (FORBIDDEN.includes(step.action)) {
    return { allowed: false, reason: "Blocked by B.10 safety firewall" };
  }
  return { allowed: true as const };
}
