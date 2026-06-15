import type { ConstitutionAmendment } from "./amendments";

export function scoreAmendments(
  amendments: ConstitutionAmendment[],
): ConstitutionAmendment[] {
  return amendments
    .map((a) => ({ ...a, priorityScore: a.impactScore * a.confidence }))
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
}
