export type MeshEvent = {
  tenantId: string;
  table: string;
  decision: "ALLOW" | "WARN" | "BLOCK" | "REVIEW_REQUIRED";
};

export function detectCrossTenantAnomalies(events: MeshEvent[]): string[] {
  const anomalies: string[] = [];
  const failed = events.filter((e) => e.decision === "BLOCK");
  if (failed.length > 10) anomalies.push("Systemic misconfiguration detected across tenants");

  const perTable = new Map<string, number>();
  for (const e of failed) perTable.set(e.table, (perTable.get(e.table) ?? 0) + 1);
  for (const [table, count] of perTable) {
    if (count > 5) anomalies.push(`Hotspot detected in table: ${table}`);
  }
  return anomalies;
}
