import type { MCPScope } from "./scopes";

/**
 * Central, single source of truth mapping every known MCP tool name to the
 * MINIMUM scope required to invoke it. Both externally exposed tools and
 * declared-but-not-exposed internal tools are listed here so audits can
 * cross-reference the runtime guard in `internal-tool-registry.ts`.
 *
 * Adding a tool without an entry here causes `authorizeTool` to return
 * `UNKNOWN_TOOL` and the router to 403 — fail-closed by design.
 */
export const MCP_TOOL_SCOPES = {
  // PUBLIC — safe for any anonymous MCP client
  about_higaet: "public",
  list_academy_courses: "public",
  list_services: "public",

  // INSIGHTS — aggregated, no PII, read-only observability
  get_system_health_overview: "insights",
  get_sre_snapshot: "insights",

  // ANALYTICS — pre-merge risk evaluation surface
  evaluate_pr: "analytics",

  // SRE — root-cause + incident processing
  run_ai_sre_loop: "sre",
  process_sentry_issues: "sre",

  // ADMIN — control-plane operations
  risk_calibration_apply: "admin",
  rollback_signal_emit: "admin",
} as const satisfies Record<string, MCPScope>;

export type MCPToolName = keyof typeof MCP_TOOL_SCOPES;

export function getRequiredScope(tool: string): MCPScope | undefined {
  return (MCP_TOOL_SCOPES as Record<string, MCPScope>)[tool];
}
