import type { ConstitutionalRule } from "./types";

export type AmendmentType = "add_rule" | "modify_rule" | "remove_rule";
export type AmendmentStatus = "pending" | "approved" | "rejected";

export type ConstitutionAmendment = {
  id: string;
  type: AmendmentType;
  targetRuleId?: string;
  proposedRule?: Partial<ConstitutionalRule>;
  reason: string;
  impactScore: number;
  confidence: number;
  status: AmendmentStatus;
  priorityScore?: number;
};
