/**
 * Static diff-feature extraction. Pure — signals feed the scorer and
 * predictor. Deliberately conservative: many small signals > one big claim.
 */

export interface DiffAnalysis {
  signals: string[];
  complexityScore: number;
  files: string[];
}

const HIGH_RISK_AREAS: Array<{ pattern: RegExp; signal: string }> = [
  { pattern: /auth|session|jwt|token/i, signal: "Authentication subsystem modified" },
  { pattern: /payment|stripe|paddle|checkout|invoice/i, signal: "Payment flow touched (high risk area)" },
  { pattern: /supabase|rls|policy|migration/i, signal: "Database / RLS layer modified" },
  { pattern: /webhook|signature|hmac/i, signal: "Webhook handler modified" },
  { pattern: /embedding|pgvector|rag|retriev/i, signal: "RAG pipeline modified" },
  { pattern: /useEffect|useState|useMemo/i, signal: "React lifecycle change (UI regression risk)" },
  { pattern: /\bnull\b|\bundefined\b/i, signal: "Null-safety branch modified" },
  { pattern: /catch\s*\(/i, signal: "Error-handling branch modified" },
];

export function analyzeDiff(diff: string): DiffAnalysis {
  const signals = new Set<string>();
  for (const { pattern, signal } of HIGH_RISK_AREAS) {
    if (pattern.test(diff)) signals.add(signal);
  }

  const additions = (diff.match(/^\+[^+]/gm) ?? []).length;
  const deletions = (diff.match(/^-[^-]/gm) ?? []).length;
  const complexityScore = additions * 0.2 + deletions * 0.1;

  const files = Array.from(
    new Set(
      Array.from(diff.matchAll(/^diff --git a\/(.+?) b\//gm), (m) => m[1]),
    ),
  );

  return { signals: [...signals], complexityScore, files };
}
