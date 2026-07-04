import { SCOPE_HIERARCHY, type MCPScope } from "./scopes";
import { getRequiredScope } from "./tool-scopes";

export type AuthorizeReason =
  | "ADMIN_INTERNAL_OVERRIDE"
  | "SCOPE_GRANTED"
  | "INSUFFICIENT_SCOPE"
  | "UNKNOWN_TOOL";

export interface AuthorizeDecision {
  allowed: boolean;
  reason: AuthorizeReason;
  requiredScope?: MCPScope;
}

export function authorizeTool(params: {
  tool: string;
  clientScope: MCPScope;
  isAdminInternal: boolean;
}): AuthorizeDecision {
  const required = getRequiredScope(params.tool);

  if (!required) {
    // Unknown tool: fail-closed even for admin_internal — a call to an
    // unregistered name is a bug or probe, not a legitimate override.
    return { allowed: false, reason: "UNKNOWN_TOOL" };
  }

  if (params.isAdminInternal) {
    return { allowed: true, reason: "ADMIN_INTERNAL_OVERRIDE", requiredScope: required };
  }

  const clientLevel = SCOPE_HIERARCHY[params.clientScope] ?? 0;
  const requiredLevel = SCOPE_HIERARCHY[required];

  if (clientLevel >= requiredLevel) {
    return { allowed: true, reason: "SCOPE_GRANTED", requiredScope: required };
  }
  return { allowed: false, reason: "INSUFFICIENT_SCOPE", requiredScope: required };
}
