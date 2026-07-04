/** Advisory failure-mode predictions from a risk report. Pure. */

import type { RiskReport } from "@/lib/risk/scorer";

export function predictFailureMode(risk: RiskReport): string[] {
  const out: string[] = [];
  const has = (s: string) => risk.signals.some((x) => x.startsWith(s));

  if (has("Authentication")) out.push("Potential login / session regression");
  if (has("Payment")) out.push("Possible transaction failure or duplicate-charge risk");
  if (has("Database")) out.push("RLS or query regression — verify policy tests");
  if (has("Webhook")) out.push("Webhook signature or dispatcher regression risk");
  if (has("RAG")) out.push("Embedding pipeline drift risk");
  if (has("React lifecycle")) out.push("UI regression on affected routes");
  if (risk.level === "CRITICAL") out.push("Systemic regression likely within next deploy cycle");
  return out;
}
