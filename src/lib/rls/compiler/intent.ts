import type { RLSOperation } from "../types";

export type AccessIntent = {
  role: string;
  table: string;
  action: RLSOperation | "ALL";
  condition: string;
};

/**
 * Naive intent parser — deliberately conservative. Anything not recognised
 * becomes an "unknown" intent, which downstream validation will BLOCK.
 */
export function parseIntent(text: string): AccessIntent {
  const lower = text.toLowerCase();

  const roleMatch = lower.match(
    /\b(admin|super_admin|authenticated|anon|user|student|faculty|counselor|placement_officer|tech_client|enterprise_client)\b/,
  );
  const tableMatch = lower.match(
    /\b(profiles|support_tickets|certificates|projects|leads|applications|payments|[a-z_]+_tickets|[a-z_]+_leads)\b/,
  );

  let action: AccessIntent["action"] = "SELECT";
  if (/\b(manage|all|full access)\b/.test(lower)) action = "ALL";
  else if (/\b(insert|create|add)\b/.test(lower)) action = "INSERT";
  else if (/\b(update|edit|modify)\b/.test(lower)) action = "UPDATE";
  else if (/\b(delete|remove)\b/.test(lower)) action = "DELETE";
  else if (/\b(view|read|select|see|list)\b/.test(lower)) action = "SELECT";

  let condition = "false";
  if (/\bown\b/.test(lower)) condition = "auth.uid() = user_id";
  else if (roleMatch) condition = `has_role('${roleMatch[1]}')`;

  return {
    role: roleMatch?.[1] ?? "unknown",
    table: tableMatch?.[1] ?? "unknown",
    action,
    condition,
  };
}
