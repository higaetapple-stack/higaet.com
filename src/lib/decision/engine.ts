import type { DecisionOption } from "./types";

export function generateDecisions(input: {
  intent: string;
  predictions: Array<{ route?: string }>;
  memoryBias: number;
  currentRoute: string;
}): DecisionOption[] {
  const base: DecisionOption[] = [];

  base.push({
    action: "Continue recommended learning path",
    route: input.predictions[0]?.route,
    confidence: 0.85,
    reasoning: "Highest intent match + past behavior alignment",
    impactScore: 0.9,
  });

  base.push({
    action: "Explore alternative paths",
    route: "/academy/programs",
    confidence: 0.65,
    reasoning: "User shows moderate exploration behavior",
    impactScore: 0.6,
  });

  if (input.memoryBias > 0.6) {
    base.push({
      action: "Go deeper into current topic",
      route: input.currentRoute,
      confidence: 0.7,
      reasoning: "High historical engagement depth detected",
      impactScore: 0.75,
    });
  }

  return base.sort((a, b) => b.confidence - a.confidence);
}
