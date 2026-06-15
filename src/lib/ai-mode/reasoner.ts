/**
 * B.14 — AI Mode · Reasoning / Decision Interpreter Layer
 * ---------------------------------------------------------------
 * Pure interpretation over outputs of B.11 / B.12 / B.13.
 *
 * Guardrails (B.14 spec):
 *   ❌ never re-ranks or overrides B.13 fusion output
 *   ❌ never invents routes or mutates registry
 *   ❌ never touches sitemap / breadcrumbs / JSON-LD
 *   ✔ produces explanation + confidence narrative only
 */

import { resolveIntentRanked, type IntentMatch } from "@/lib/intent-router/resolve";
import {
  resolveHybrid,
  type FusionMode,
  type HybridResult,
} from "@/lib/fusion/hybrid-resolver";
import { searchSimilar, type VectorMatch } from "@/lib/vector-index";

export interface AIAlternative {
  path: string;
  title: string;
  reason: string;
  score: number;
  source: "intent" | "vector" | "fusion";
}

export interface AIResponse {
  query: string;
  primary: { path: string; title: string } | null;
  alternatives: AIAlternative[];
  explanation: string;
  confidence: number;
  intentSummary: string;
  debug?: {
    intentScore: number;
    vectorScore: number;
    fusionScore: number;
    mode: FusionMode;
  };
}

export interface RunAIModeInput {
  query: string;
  intentResult: IntentMatch[];
  vectorResult: VectorMatch[];
  fusionResult: { mode: FusionMode; results: HybridResult[] };
}

function classifySource(sources: HybridResult["sources"]): AIAlternative["source"] {
  if (sources.length > 1) return "fusion";
  return sources[0] ?? "intent";
}

function reasonFor(source: AIAlternative["source"]): string {
  switch (source) {
    case "fusion":
      return "Confirmed by both keyword intent and semantic similarity.";
    case "vector":
      return "Surfaced via semantic similarity to your query.";
    case "intent":
    default:
      return "Strong keyword / intent match.";
  }
}

function generateExplanation(
  query: string,
  primary: HybridResult | undefined,
  topIntent: IntentMatch | undefined,
  mode: FusionMode,
): string {
  if (!primary) {
    return `No confident route matched "${query}". Try a more specific term, or browse the Academy index.`;
  }
  const intentLabel = topIntent?.node.intent ?? "navigate";
  const via =
    primary.sources.length > 1
      ? "intent + semantic signals"
      : primary.sources[0] === "vector"
        ? "semantic similarity"
        : "intent matching";
  return `For "${query}" the system selected ${primary.title} (${primary.path}). Detected intent: ${intentLabel}. Decision via ${via} in fusion mode ${mode}.`;
}

export function runAIMode(input: RunAIModeInput): AIResponse {
  const { query, intentResult, vectorResult, fusionResult } = input;
  const [primary, ...rest] = fusionResult.results;
  const topIntent = intentResult[0];
  const topVector = vectorResult[0];

  const alternatives: AIAlternative[] = rest.map((r) => {
    const source = classifySource(r.sources);
    return {
      path: r.path,
      title: r.title,
      score: Number(r.score.toFixed(4)),
      source,
      reason: reasonFor(source),
    };
  });

  // Confidence = primary fusion score, bounded into a friendlier 0..1 band
  // and softened by fusion mode (FULL > SOFT > OFF).
  const rawConfidence = primary ? Math.min(1, primary.score) : 0;
  const modeFactor =
    fusionResult.mode === "FULL" ? 0.95 : fusionResult.mode === "SOFT" ? 0.85 : 0.7;
  const confidence = Number((rawConfidence * modeFactor).toFixed(3));

  return {
    query,
    primary: primary ? { path: primary.path, title: primary.title } : null,
    alternatives,
    explanation: generateExplanation(query, primary, topIntent, fusionResult.mode),
    confidence,
    intentSummary: topIntent?.node.intent ?? "unknown",
    debug: {
      intentScore: Number((topIntent?.confidence ?? 0).toFixed(4)),
      vectorScore: Number((topVector?.score ?? 0).toFixed(4)),
      fusionScore: Number((primary?.score ?? 0).toFixed(4)),
      mode: fusionResult.mode,
    },
  };
}

/**
 * Orchestrator — gathers B.11 / B.12 / B.13 outputs and returns the
 * B.14 interpretation. Vector failures fall back silently (B.13 already
 * guards this internally).
 */
export async function explainQuery(
  query: string,
  opts: { mode?: FusionMode; limit?: number } = {},
): Promise<AIResponse> {
  const mode = opts.mode ?? "SOFT";
  const limit = opts.limit ?? 5;

  const intentResult = resolveIntentRanked(query, Math.max(limit, 5));
  let vectorResult: VectorMatch[] = [];
  try {
    if (mode !== "OFF") vectorResult = await searchSimilar(query, Math.max(limit, 5));
  } catch {
    vectorResult = [];
  }
  const fusionResult = await resolveHybrid(query, { mode, limit });

  return runAIMode({ query, intentResult, vectorResult, fusionResult });
}
