export type TenantResult = {
  tenant: string;
  decision: "ALLOW" | "WARN" | "BLOCK" | "REVIEW_REQUIRED";
  riskScore: number;
};

export type MeshSystemState = {
  systemHealth: "HEALTHY" | "STABLE_RISK" | "DEGRADED";
  totalBlocks: number;
  avgRisk: number;
};

export function aggregateMeshState(tenantResults: TenantResult[]): MeshSystemState {
  const totalBlocks = tenantResults.filter((t) => t.decision === "BLOCK").length;
  const risks = tenantResults.map((t) => t.riskScore);
  const avgRisk = risks.length ? risks.reduce((a, b) => a + b, 0) / risks.length : 0;
  const systemHealth: MeshSystemState["systemHealth"] =
    avgRisk > 70 ? "DEGRADED" : avgRisk > 40 ? "STABLE_RISK" : "HEALTHY";
  return { systemHealth, totalBlocks, avgRisk };
}
