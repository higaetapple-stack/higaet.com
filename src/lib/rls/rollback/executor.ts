import { getLatestStableVersion, type PolicyVersion } from "./store";

/**
 * Advisory rollback — computes the restore plan but does NOT execute DB writes.
 * A separate migration approval flow must apply the returned policies.
 */
export function planRollback(): { plan: PolicyVersion; timestamp: number } {
  const stable = getLatestStableVersion();
  if (!stable) throw new Error("No stable RLS version available");
  return { plan: stable, timestamp: Date.now() };
}
