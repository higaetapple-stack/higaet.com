import { TRUST_SCORES, type TrustLevel } from "./types";

export function trustScoreFor(level: TrustLevel): number {
  return TRUST_SCORES[level];
}

export function isTrustedForAdoption(level: TrustLevel, minScore = 0.6): boolean {
  return TRUST_SCORES[level] >= minScore;
}
