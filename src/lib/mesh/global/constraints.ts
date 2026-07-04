export type PolicyDescriptor = {
  role: string;
  action: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";
  table: string;
};

export type ConstraintResult = { valid: boolean; violations: string[] };

export function enforceGlobalConstraints(policy: PolicyDescriptor): ConstraintResult {
  const violations: string[] = [];
  if (policy.role === "anon" && (policy.action === "DELETE" || policy.action === "ALL"))
    violations.push("Global rule: anon cannot delete data");
  if (policy.table === "billing" && policy.role !== "admin" && policy.role !== "super_admin")
    violations.push("Global rule: billing access restricted to admin roles");
  if (policy.role === "anon" && policy.action === "UPDATE")
    violations.push("Global rule: anon cannot mutate data");
  return { valid: violations.length === 0, violations };
}
