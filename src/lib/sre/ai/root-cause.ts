/**
 * Root-cause hypothesis generator. Pure function — takes a normalized
 * incident shape, returns ranked hypotheses with a confidence score.
 *
 * Confidence heuristic: each matched signal contributes weight, capped at 0.95.
 * The engine intentionally under-claims certainty; downstream fix planner
 * treats < 0.5 as "advisory only, do not auto-open PR".
 */

export interface RootCauseInput {
  title?: string;
  errorType?: string | null;
  errorValue?: string | null;
  culprit?: string | null;
  frames?: Array<{ filename?: string; function?: string }>;
  frequency?: number;
  userCount?: number;
}

export interface RootCauseHypothesis {
  category:
    | "auth"
    | "payment"
    | "database"
    | "rag"
    | "webhook"
    | "network"
    | "null-safety"
    | "validation"
    | "systemic"
    | "unknown";
  description: string;
  weight: number;
  evidence: string[];
}

export interface RootCauseReport {
  hypotheses: RootCauseHypothesis[];
  confidence: number;
  systemic: boolean;
  topCategory: RootCauseHypothesis["category"];
}

const CATEGORY_MATCHERS: Array<{
  category: RootCauseHypothesis["category"];
  description: string;
  patterns: RegExp[];
  weight: number;
}> = [
  {
    category: "auth",
    description: "Auth / session / token handling failure",
    patterns: [/auth/i, /jwt/i, /session/i, /unauthorized/i, /token/i],
    weight: 0.3,
  },
  {
    category: "payment",
    description: "Payment pipeline failure or provider mismatch",
    patterns: [/payment/i, /stripe/i, /paddle/i, /checkout/i, /invoice/i],
    weight: 0.35,
  },
  {
    category: "database",
    description: "Database / RLS / query failure",
    patterns: [/supabase/i, /postgres/i, /rls/i, /policy/i, /42501/i],
    weight: 0.3,
  },
  {
    category: "rag",
    description: "RAG pipeline (embeddings / vector search) failure",
    patterns: [/embedding/i, /pgvector/i, /rag/i, /retriev/i],
    weight: 0.25,
  },
  {
    category: "webhook",
    description: "Webhook delivery / signature / dispatcher failure",
    patterns: [/webhook/i, /signature/i, /hmac/i, /dispatcher/i],
    weight: 0.25,
  },
  {
    category: "network",
    description: "Upstream / network fetch failure",
    patterns: [/fetch failed/i, /ECONN/i, /ETIMEDOUT/i, /5\d\d/],
    weight: 0.2,
  },
  {
    category: "null-safety",
    description: "Missing null guard / undefined property access",
    patterns: [/TypeError/i, /undefined/i, /null.*property/i, /cannot read/i],
    weight: 0.25,
  },
  {
    category: "validation",
    description: "Input validation / schema mismatch",
    patterns: [/ZodError/i, /validation/i, /invalid input/i, /parse/i],
    weight: 0.2,
  },
];

export function detectRootCause(input: RootCauseInput): RootCauseReport {
  const haystack = [
    input.title,
    input.errorType,
    input.errorValue,
    input.culprit,
    ...(input.frames ?? []).map((f) => `${f.filename ?? ""} ${f.function ?? ""}`),
  ]
    .filter(Boolean)
    .join("\n");

  const hypotheses: RootCauseHypothesis[] = [];

  for (const matcher of CATEGORY_MATCHERS) {
    const matches = matcher.patterns.filter((p) => p.test(haystack));
    if (matches.length === 0) continue;
    hypotheses.push({
      category: matcher.category,
      description: matcher.description,
      weight: Math.min(0.5, matcher.weight * matches.length),
      evidence: matches.map((p) => `matched /${p.source}/`),
    });
  }

  const frequency = input.frequency ?? 0;
  const userCount = input.userCount ?? 0;
  const systemic = frequency >= 10 || userCount >= 20;
  if (systemic) {
    hypotheses.push({
      category: "systemic",
      description: "High-frequency regression — likely systemic, not isolated",
      weight: 0.2,
      evidence: [`frequency=${frequency}`, `userCount=${userCount}`],
    });
  }

  hypotheses.sort((a, b) => b.weight - a.weight);

  if (hypotheses.length === 0) {
    return {
      hypotheses: [
        {
          category: "unknown",
          description: "No pattern matched — needs manual trace inspection",
          weight: 0.05,
          evidence: [],
        },
      ],
      confidence: 0.05,
      systemic: false,
      topCategory: "unknown",
    };
  }

  const confidence = Math.min(0.95, hypotheses.reduce((s, h) => s + h.weight, 0));
  return {
    hypotheses,
    confidence,
    systemic,
    topCategory: hypotheses[0].category,
  };
}
