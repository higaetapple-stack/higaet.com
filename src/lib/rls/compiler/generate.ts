import type { AccessIntent } from "./intent";

export type GeneratedPolicy = {
  table: string;
  role: string;
  command: AccessIntent["action"];
  using: string;
  withCheck: string | null;
};

export function generateRLS(intent: AccessIntent): GeneratedPolicy {
  const withCheck =
    intent.action === "INSERT" || intent.action === "UPDATE" || intent.action === "ALL"
      ? intent.condition
      : null;
  return {
    table: intent.table,
    role: intent.role,
    command: intent.action,
    using: intent.condition,
    withCheck,
  };
}
