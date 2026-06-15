import type { StrategyType } from "./types";

export function routeStrategy(intent: string): StrategyType {
  const i = intent.toLowerCase();
  if (i.includes("learn")) return "deep-analysis";
  if (i.includes("quick")) return "fast-path";
  if (i.includes("compare")) return "precision-mode";
  return "exploration";
}
