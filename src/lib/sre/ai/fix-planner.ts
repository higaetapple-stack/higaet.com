/**
 * Maps root-cause categories to concrete, safe-change fix suggestions.
 * Suggestions are advisory — they enumerate the code area, the pattern to
 * apply, and a test recommendation. They never encode "apply this diff".
 */

import type { RootCauseReport, RootCauseHypothesis } from "./root-cause";

export interface FixSuggestion {
  category: RootCauseHypothesis["category"];
  action: string;
  targetHint: string;
  testHint: string;
  risk: "low" | "medium" | "high";
}

const PLAYBOOK: Record<RootCauseHypothesis["category"], FixSuggestion | null> = {
  auth: {
    category: "auth",
    action:
      "Add token-validation guard + refresh fallback around the failing session boundary.",
    targetHint: "src/integrations/supabase/auth-middleware.ts, useAuth hook",
    testHint: "tests/e2e/auth/session-expiry.spec.ts",
    risk: "medium",
  },
  payment: {
    category: "payment",
    action:
      "Add idempotency key + bounded retry around the payment call; expand timeout window.",
    targetHint: "src/lib/manual-payments.functions.ts and any stripe/paddle callers",
    testHint: "runbook: docs/runbooks/payment-failure.md",
    risk: "medium",
  },
  database: {
    category: "database",
    action:
      "Audit RLS policy for the affected table; verify GRANTs and role scoping.",
    targetHint: "supabase/migrations for the affected table",
    testHint: "tests/integration/rls-matrix.test.mjs",
    risk: "high",
  },
  rag: {
    category: "rag",
    action:
      "Add embedding retry + degrade-to-keyword-search fallback on RAG pipeline failure.",
    targetHint: "src/lib/rag/*",
    testHint: "tests/smoke/rag.smoke.spec.ts",
    risk: "medium",
  },
  webhook: {
    category: "webhook",
    action:
      "Re-verify signature comparison uses timing-safe equal; requeue via dispatcher.",
    targetHint: "src/lib/webhooks.functions.ts, src/routes/api/public/**",
    testHint: "runbook: docs/runbooks/webhook-failure.md",
    risk: "low",
  },
  network: {
    category: "network",
    action:
      "Wrap upstream fetch in retry-with-backoff and surface a typed error envelope.",
    targetHint: "call site identified in stack trace",
    testHint: "add Playwright regression for the failing route",
    risk: "low",
  },
  "null-safety": {
    category: "null-safety",
    action:
      "Add optional-chaining / nullish guards; validate inbound data with Zod at boundary.",
    targetHint: "component or function referenced in the stack top frame",
    testHint: "unit test covering the undefined-input branch",
    risk: "low",
  },
  validation: {
    category: "validation",
    action:
      "Tighten inputValidator schema; return typed 400 instead of throwing.",
    targetHint: "createServerFn inputValidator or route Zod parser",
    testHint: "unit test for the invalid-shape branch",
    risk: "low",
  },
  systemic: {
    category: "systemic",
    action:
      "Add regression test + Playwright coverage for the affected flow before fixing forward.",
    targetHint: "tests/e2e for the affected route",
    testHint: "add smoke coverage before merging fix",
    risk: "medium",
  },
  unknown: null,
};

export function generateFixPlan(report: RootCauseReport): FixSuggestion[] {
  const seen = new Set<string>();
  const plan: FixSuggestion[] = [];
  for (const h of report.hypotheses) {
    const suggestion = PLAYBOOK[h.category];
    if (!suggestion || seen.has(suggestion.category)) continue;
    seen.add(suggestion.category);
    plan.push(suggestion);
  }
  return plan;
}
