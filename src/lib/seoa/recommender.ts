import type { WorkItem } from "./types";

/**
 * Human-readable strategic priorities derived from the winning plan.
 * Advisory only; never a directive.
 */
export function generateOrgStrategy(plan: WorkItem[] | null): string[] {
  if (!plan || plan.length === 0) {
    return ["No viable plan under current capacity — expand bandwidth or reduce scope."];
  }
  const priorities: string[] = [];
  if (plan.some((p) => p.domain === "auth")) {
    priorities.push("Focus on authentication stability improvements.");
  }
  if (plan.some((p) => p.domain === "payment")) {
    priorities.push("Prioritize revenue-critical payment flows.");
  }
  if (plan.some((p) => p.type === "refactor")) {
    priorities.push("Reduce system complexity via targeted refactoring.");
  }
  if (plan.some((p) => p.type === "infra")) {
    priorities.push("Invest in infrastructure to unlock future velocity.");
  }
  if (priorities.length === 0) {
    priorities.push("Ship the selected feature slate as planned.");
  }
  return priorities;
}
