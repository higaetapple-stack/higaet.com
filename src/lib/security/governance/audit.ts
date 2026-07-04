import type { GovernanceResult } from "./types";

export type GovernanceAuditEvent = {
  timestamp: number;
  decision: GovernanceResult["decision"];
  riskScore: number;
  confidence: number;
  explanation: string[];
  tenantId?: string;
};

const auditLog: GovernanceAuditEvent[] = [];

export function logGovernanceEvent(
  event: GovernanceResult & { tenantId?: string },
): GovernanceAuditEvent {
  const entry: GovernanceAuditEvent = {
    timestamp: Date.now(),
    decision: event.decision,
    riskScore: event.riskScore,
    confidence: event.confidence,
    explanation: event.explanation,
    tenantId: event.tenantId,
  };
  auditLog.push(entry);
  console.log("[GOVERNANCE_AUDIT]", JSON.stringify(entry));
  return entry;
}

export function getGovernanceAuditLog(): readonly GovernanceAuditEvent[] {
  return auditLog;
}

export function clearGovernanceAuditLog(): void {
  auditLog.length = 0;
}
