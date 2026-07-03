import { scoreSprintItem } from "./scoring";
import type { SprintItem } from "./types";

/**
 * Greedy knapsack by risk-adjusted score. Simple, predictable, and fast.
 * Handles the common "many small tasks + a few large ones" backlog shape.
 */
export function buildOptimalSprint(items: SprintItem[], capacity: number): SprintItem[] {
  const sorted = [...items].sort((a, b) => scoreSprintItem(b) - scoreSprintItem(a));
  const sprint: SprintItem[] = [];
  let used = 0;
  for (const item of sorted) {
    if (used + item.effort <= capacity) {
      sprint.push(item);
      used += item.effort;
    }
  }
  return sprint;
}
