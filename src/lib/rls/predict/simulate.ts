export function simulateRoleImpact(signals: string[]): string[] {
  const roles = new Set<string>();
  if (signals.some((s) => s.includes("Role-based"))) {
    roles.add("anon");
    roles.add("authenticated");
  }
  if (signals.some((s) => s.includes("restrictive"))) roles.add("guest");
  if (signals.some((s) => s.includes("Anonymous"))) roles.add("anon");
  return Array.from(roles);
}
