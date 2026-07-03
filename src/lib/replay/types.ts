/**
 * Incident replay data model. All snapshots are plain DTOs so they can cross
 * the server-function RPC boundary without special serialization.
 */

import type { RootCauseHypothesis } from "@/lib/sre/ai/root-cause";
import type { FixSuggestion } from "@/lib/sre/ai/fix-planner";

export interface IncidentSnapshot {
  timestamp: number;
  eventCount: number;
  cumulativeErrorRate: number;
  errorType?: string;
  errorValue?: string;
  message?: string;
  topFrame?: { filename?: string; function?: string };
}

export interface ReplayStep {
  timestamp: number;
  eventCount: number;
  rootCause: RootCauseHypothesis["category"];
  hypotheses: Array<{ category: string; description: string; weight: number }>;
  confidence: number;
  systemic: boolean;
  riskScore: number;
  fixPlan: Array<{ action: string; category: string; risk: FixSuggestion["risk"] }>;
  detectionDelta?: {
    newHypothesis: boolean;
    confidenceDelta: number;
  };
}

export interface IncidentReplay {
  issueId: string;
  shortId?: string;
  title: string;
  timeline: IncidentSnapshot[];
  steps: ReplayStep[];
  summary: {
    firstSeen?: number;
    lastSeen?: number;
    durationMs: number;
    totalEvents: number;
    peakErrorRate: number;
    finalConfidence: number;
    finalCategory: RootCauseHypothesis["category"];
    timeToConfidentDetectionMs?: number;
    systemic: boolean;
  };
}
