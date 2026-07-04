import { compileRLS } from "./orchestrator";
import { buildPolicyArtifact, type PolicyArtifact } from "./artifact";

export function compilePolicyRequest(intentText: string): {
  result: ReturnType<typeof compileRLS>;
  artifact: PolicyArtifact | null;
  message: string;
} {
  const result = compileRLS(intentText);
  const artifact = result.decision !== "BLOCK" ? buildPolicyArtifact(result) : null;
  return {
    result,
    artifact,
    message:
      result.decision === "BLOCK"
        ? "Policy generation blocked due to safety or risk constraints"
        : result.decision === "WARN"
          ? "Policy generated with warnings — human review required"
          : "Policy generated successfully",
  };
}
