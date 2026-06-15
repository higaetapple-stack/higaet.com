import type { AggregatedHealth, SystemHealthSnapshot } from "./types";

export function aggregateHealth(data: SystemHealthSnapshot): AggregatedHealth {
  const totalFriction = Object.values(data.friction).reduce((a, b) => a + b, 0);
  const systemStability = Math.max(0, Math.min(1, 1 - totalFriction / 100));

  const bottlenecks = Object.entries(data.friction).sort((a, b) => b[1] - a[1]);

  const strategyEntries = Object.entries(data.strategyDistribution);
  const dominantStrategy =
    strategyEntries.length > 0
      ? strategyEntries.sort((a, b) => b[1] - a[1])[0][0]
      : null;

  return { systemStability, bottlenecks, dominantStrategy };
}
