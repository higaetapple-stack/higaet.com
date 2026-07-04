import type { ViolationEvent } from "./store";

export type ViolationCluster = { pattern: string; frequency: number };

export function clusterViolations(
  violations: ViolationEvent[],
  minFrequency = 3,
): ViolationCluster[] {
  const map = new Map<string, number>();
  for (const v of violations) {
    const key = `${v.role}.${v.table}.${v.operation}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .filter(([, count]) => count >= minFrequency)
    .map(([pattern, frequency]) => ({ pattern, frequency }));
}
