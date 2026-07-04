import type { PolicyScore } from "./scoring";

export type EvolveDrift = {
  drift: boolean;
  type: "TOO_STRICT" | "TOO_OPEN" | "STABLE" | "UNKNOWN";
  confidence: number;
};

export function detectPolicyDrift(score: PolicyScore): EvolveDrift {
  if (score.effectiveness === "INSUFFICIENT_DATA") {
    return { drift: false, type: "UNKNOWN", confidence: 0 };
  }
  if (score.effectiveness === "OVERLY_RESTRICTIVE") {
    return { drift: true, type: "TOO_STRICT", confidence: 0.85 };
  }
  if (score.effectiveness === "OVERLY_PERMISSIVE") {
    return { drift: true, type: "TOO_OPEN", confidence: 0.75 };
  }
  return { drift: false, type: "STABLE", confidence: 0.9 };
}
