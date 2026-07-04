export function analyzeRLSDiff(diff: string): string[] {
  const signals: string[] = [];
  if (/\bDENY\b/i.test(diff)) signals.push("New restrictive rule introduced");
  if (/\bUSING\b|\bWITH CHECK\b/i.test(diff)) {
    signals.push("Row-level access condition modified");
  }
  if (/auth\.role|has_role\(/i.test(diff)) {
    signals.push("Role-based access logic changed");
  }
  if (/TO\s+anon/i.test(diff)) {
    signals.push("Anonymous role grant modified");
  }
  if (/DROP\s+POLICY/i.test(diff)) {
    signals.push("Policy removed");
  }
  return signals;
}
