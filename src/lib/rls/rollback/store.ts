import type { RLSPolicy } from "../types";

export type PolicyVersion = {
  id: string;
  timestamp: number;
  policies: RLSPolicy[];
  /** Version tag; prefix with "stable-" for known-good snapshots. */
  checksum: string;
};

export const policyVersions: PolicyVersion[] = [];

export function savePolicyVersion(version: PolicyVersion): void {
  policyVersions.push(version);
}

export function getLatestStableVersion(): PolicyVersion | undefined {
  return policyVersions
    .filter((v) => v.checksum.startsWith("stable"))
    .sort((a, b) => b.timestamp - a.timestamp)[0];
}

export function clearVersions(): void {
  policyVersions.length = 0;
}
