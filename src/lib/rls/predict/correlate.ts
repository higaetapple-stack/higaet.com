import { violationStore } from "../healing/store";

export function correlateWithHistory(signals: string[]): number {
  let riskBoost = 0;
  for (const v of violationStore) {
    for (const s of signals) {
      if (s.toLowerCase().includes(v.table.toLowerCase())) riskBoost += 5;
      if (s.includes("Role-based") && v.role === "anon") riskBoost += 10;
      if (s.includes("Anonymous") && v.role === "anon") riskBoost += 15;
    }
  }
  return riskBoost;
}
