export type InferredFix = { pattern: string; suggestions: string[] };

export function inferPolicyFix(pattern: string): InferredFix {
  const [role, table, operation] = pattern.split(".");
  const suggestions: string[] = [
    `Consider adding ALLOW policy for ${role}.${table}.${operation}`,
  ];
  if (role.includes("user") && table.includes("support")) {
    suggestions.push("Review staff-role mapping for support tables");
  }
  if (role === "anon") {
    suggestions.push("Anon patterns require explicit TO anon SELECT policy");
  }
  return { pattern, suggestions };
}
