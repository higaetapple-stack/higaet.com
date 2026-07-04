/**
 * Correlate PR diff signals with historical Sentry issues. Uses the existing
 * Worker-safe SentryClient — no MCP dependency at runtime.
 */

import { SentryClient } from "@/lib/sre/ai/sentry-client";

export interface CorrelationInput {
  signals: string[];
  files?: string[];
}

export interface CorrelationResult {
  riskBoost: number;
  matches: Array<{ issueId: string; title: string; reason: string }>;
}

export async function correlateWithSentry(
  input: CorrelationInput,
  client: SentryClient = new SentryClient(),
): Promise<CorrelationResult> {
  if (!client.isConfigured()) return { riskBoost: 0, matches: [] };

  const issues = await client.listIssues({ limit: 50 }).catch(() => []);
  const matches: CorrelationResult["matches"] = [];
  let riskBoost = 0;

  const signalTerms = input.signals.map((s) => s.toLowerCase());
  const files = (input.files ?? []).map((f) => f.toLowerCase());

  for (const issue of issues) {
    const hay = `${issue.title ?? ""} ${issue.culprit ?? ""}`.toLowerCase();
    for (const term of signalTerms) {
      const key = term.split(" ")[0];
      if (key && hay.includes(key)) {
        matches.push({ issueId: issue.id, title: issue.title, reason: `signal:${key}` });
        riskBoost += 10;
        break;
      }
    }
    for (const file of files) {
      const base = file.split("/").pop() ?? "";
      if (base && hay.includes(base.replace(/\.[tj]sx?$/, ""))) {
        matches.push({ issueId: issue.id, title: issue.title, reason: `file:${base}` });
        riskBoost += 15;
        break;
      }
    }
  }
  return { riskBoost, matches };
}
