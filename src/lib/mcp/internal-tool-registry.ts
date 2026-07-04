/**
 * Internal MCP tool registry — declared for auditability, NEVER exposed via /mcp.
 *
 * Design principle: "Declared internally, enforced at runtime, invisible at
 * protocol layer." These capabilities exist in the codebase (AI SRE, risk
 * engine, Sentry processing) but are intentionally kept out of the MCP manifest
 * and router. The runtime guard below hard-fails any accidental attempt to
 * route one through the public MCP surface.
 *
 * Add new internal capabilities here so security reviewers and future
 * refactors have a single source of truth for "what exists vs what is exposed".
 */

export type InternalExposure =
  | "none" // fully internal, no runtime path exposes it
  | "server_only" // callable only from server functions / trusted code
  | "admin_server_only"; // additionally requires an authenticated admin session

export interface InternalToolDescriptor {
  type: "internal";
  exposure: InternalExposure;
  description: string;
}

export const INTERNAL_MCP_TOOLS = {
  evaluate_pr: {
    type: "internal",
    exposure: "server_only",
    description: "Pre-merge risk evaluation (CI + AI SRE).",
  },
  run_ai_sre_loop: {
    type: "internal",
    exposure: "admin_server_only",
    description: "Sentry → root cause → fix planning loop.",
  },
  process_sentry_issues: {
    type: "internal",
    exposure: "server_only",
    description: "Fetch + analyze Sentry issues via REST API.",
  },
  risk_calibration_apply: {
    type: "internal",
    exposure: "admin_server_only",
    description: "Apply calibrated risk thresholds to the pre-merge gate.",
  },
  rollback_signal_emit: {
    type: "internal",
    exposure: "admin_server_only",
    description: "Emit rollback recommendation signal (advisory only).",
  },
} as const satisfies Record<string, InternalToolDescriptor>;

export type InternalMcpToolName = keyof typeof INTERNAL_MCP_TOOLS;

export function isInternalTool(name: string): name is InternalMcpToolName {
  return Object.prototype.hasOwnProperty.call(INTERNAL_MCP_TOOLS, name);
}

/**
 * Runtime guard — call from any code path that could theoretically route a
 * tool name through the MCP handler. Throws loudly rather than silently
 * denying, so accidental exposure surfaces in tests and logs immediately.
 */
export function assertMCPExposure(toolName: string): true {
  if (isInternalTool(toolName)) {
    throw new Error(
      `[MCP BLOCKED] Attempted external access to internal tool: ${toolName}`,
    );
  }
  return true;
}
