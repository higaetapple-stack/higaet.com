import type { ConstitutionalRule } from "./types";

export type ConstitutionVersion = {
  version: number;
  rules: ConstitutionalRule[];
  timestamp: number;
  appliedAmendments: string[];
};
