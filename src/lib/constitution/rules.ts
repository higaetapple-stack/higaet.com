import type { ConstitutionalRule } from "./types";

export const CONSTITUTION: ConstitutionalRule[] = [
  {
    id: "safe-execution-only",
    name: "No high-risk execution without high confidence",
    category: "safety",
    priority: 1,
    condition: (ctx) => ctx.risk > 0.7 && ctx.confidence < 0.8,
    action: "block",
  },
  {
    id: "simulation-required",
    name: "Low-confidence decisions must be simulated",
    category: "stability",
    priority: 2,
    condition: (ctx) => ctx.confidence < 0.6,
    action: "downgrade",
  },
  {
    id: "friction-awareness",
    name: "High friction reduces execution priority",
    category: "efficiency",
    priority: 3,
    condition: (ctx) => ctx.friction > 0.5,
    action: "downgrade",
  },
  {
    id: "simulation-floor",
    name: "Simulation score below 0.4 is not actionable",
    category: "safety",
    priority: 1,
    condition: (ctx) => (ctx.simulationScore ?? 1) < 0.4,
    action: "block",
  },
  {
    id: "urgency-vs-risk",
    name: "Urgent + risky decisions must be downgraded",
    category: "stability",
    priority: 2,
    condition: (ctx) => (ctx.urgency ?? 0) > 0.7 && ctx.risk > 0.5,
    action: "downgrade",
  },
];
