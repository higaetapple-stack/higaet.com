export type ConstitutionStats = {
  violations: number;
  totalExecutions: number;
  overBlockedRules?: string[];
  bypassedRules?: string[];
};

export type DriftReport = {
  instabilityIndex: number;
  overStrictRules: string[];
  underEnforcedRules: string[];
};

export function detectConstitutionDrift(stats: ConstitutionStats): DriftReport {
  return {
    instabilityIndex: stats.violations / (stats.totalExecutions || 1),
    overStrictRules: stats.overBlockedRules ?? [],
    underEnforcedRules: stats.bypassedRules ?? [],
  };
}
