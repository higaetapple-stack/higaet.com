/**
 * Shared types for the RLS intelligence stack.
 * All engines here are advisory-only, Worker-safe, and never mutate the DB.
 */

export type RLSOperation = "SELECT" | "INSERT" | "UPDATE" | "DELETE";

export type RLSPolicy = {
  table: string;
  operation: RLSOperation;
  role: string;
  /** Simplified boolean-ish expression (e.g. "true", "has_role('admin')", "auth.uid() = user_id"). */
  expression: string;
};

export type AccessDecision = "ALLOW" | "DENY";

export type SimulationContext = {
  role: string;
  operation: RLSOperation;
  table: string;
};

export type AccessMatrix = Record<
  string,
  Record<string, Record<RLSOperation, AccessDecision>>
>;

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type GateDecision = "ALLOW" | "WARN" | "BLOCK";
