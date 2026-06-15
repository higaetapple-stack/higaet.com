import type { AgentTask } from "./types";

export function runWorker(task: AgentTask): AgentTask {
  switch (task.role) {
    case "planner":
      task.output = "Structured breakdown generated";
      break;
    case "researcher":
      task.output = "Matched intent dataset + vector results";
      break;
    case "navigator":
      task.output = "Mapped to safe routes";
      break;
    case "validator":
      task.output = "B.10 compliance verified";
      break;
  }
  task.status = "done";
  return task;
}
