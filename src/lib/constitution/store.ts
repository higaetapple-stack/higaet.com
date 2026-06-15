import { CONSTITUTION } from "./rules";
import type { ConstitutionVersion } from "./versioning";

const history: ConstitutionVersion[] = [
  {
    version: 1,
    rules: [...CONSTITUTION],
    timestamp: Date.now(),
    appliedAmendments: [],
  },
];

export function getConstitution(): ConstitutionVersion {
  return history[history.length - 1];
}

export function getHistory(): ConstitutionVersion[] {
  return [...history];
}

export function pushVersion(v: ConstitutionVersion): ConstitutionVersion {
  history.push(v);
  return v;
}

export function rollback(toVersion: number): ConstitutionVersion | null {
  const target = history.find((h) => h.version === toVersion);
  if (!target) return null;
  const next: ConstitutionVersion = {
    version: history[history.length - 1].version + 1,
    rules: [...target.rules],
    timestamp: Date.now(),
    appliedAmendments: [...target.appliedAmendments, `rollback:v${toVersion}`],
  };
  history.push(next);
  return next;
}
