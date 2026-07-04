import type { AuthorizeReason } from "./authorizeTool";
import type { MCPClientType } from "./auth";

export interface MCPAuditLog {
  tool: string;
  scope: string;
  clientType: MCPClientType;
  allowed: boolean;
  reason: AuthorizeReason;
  timestamp: number;
}

/**
 * Emit a single-line JSON audit record for an MCP invocation decision.
 *
 * SAFETY: never include tool arguments, response payloads, API keys, or
 * any request body. Only the fields on `MCPAuditLog` are logged — this keeps
 * the audit stream safe to ship to log aggregators without a PII review.
 */
export function logMCPRequest(entry: MCPAuditLog): void {
  console.log(
    "[MCP_AUDIT] " +
      JSON.stringify({
        level: "info",
        type: "mcp_audit",
        ...entry,
      }),
  );
}
