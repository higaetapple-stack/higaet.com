export type IsolationRequest = {
  tenantId?: string;
  scope?: "read" | "write" | "cross-tenant-read" | "cross-tenant-write";
};

export type IsolationResult = { allowed: boolean; reason?: string };

export function enforceTenantIsolation(request: IsolationRequest): IsolationResult {
  if (!request.tenantId) return { allowed: false, reason: "Missing tenant context" };
  if (request.scope === "cross-tenant-write")
    return { allowed: false, reason: "Cross-tenant mutation forbidden" };
  return { allowed: true };
}
