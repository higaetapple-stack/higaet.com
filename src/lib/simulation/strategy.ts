export function simulateStrategySelection(intent: string): string {
  const i = intent.toLowerCase();
  if (i.includes("deep") || i.includes("analyze") || i.includes("research")) return "deep-analysis";
  if (i.includes("fast") || i.includes("quick")) return "fast-path";
  if (i.includes("precise") || i.includes("validate")) return "precision-mode";
  return "exploration";
}
