import type { AgentSession } from "./types";

export function runAgentStep(session: AgentSession): AgentSession {
  const step = session.steps[session.currentStep];
  if (!step) return session;

  if (step.status !== "approved") {
    step.status = "blocked";
    return session;
  }

  step.status = "executing";
  if (step.route) {
    console.log("[B.41 sandbox] navigate:", step.route);
  }
  step.status = "done";

  return { ...session, currentStep: session.currentStep + 1 };
}
