import type { CompileResult } from "./orchestrator";

export type PolicyArtifact = {
  sql: string;
  metadata: {
    risk: string | undefined;
    decision: string;
    source: "AI_RLS_COMPILER";
  };
};

export function buildPolicyArtifact(result: CompileResult): PolicyArtifact {
  const { policy, intent } = result;
  const command = policy.command === "ALL" ? "ALL" : policy.command;
  const sql = [
    "-- AUTO-GENERATED RLS POLICY — REVIEW BEFORE APPLY",
    `CREATE POLICY "${intent.role}_${intent.table}_${String(command).toLowerCase()}"`,
    `ON public.${policy.table}`,
    `FOR ${command}`,
    `TO ${intent.role}`,
    `USING (${policy.using})`,
    policy.withCheck ? `WITH CHECK (${policy.withCheck});` : ";",
  ].join("\n");
  return {
    sql,
    metadata: {
      risk: result.prediction.prediction.level,
      decision: result.decision,
      source: "AI_RLS_COMPILER",
    },
  };
}
