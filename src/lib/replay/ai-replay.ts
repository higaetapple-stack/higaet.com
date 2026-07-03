/**
 * Replay the AI SRE reasoning frame-by-frame across an incident timeline.
 *
 * At each snapshot the engine sees only the evidence available up to that
 * point in time (title, latest error type/value, top frame, running frequency).
 * The result is a stepwise trace showing how root-cause confidence and the
 * suggested fix plan evolved as more events arrived.
 *
 * Pure over the analysis primitives — no network here.
 */

import { detectRootCause } from "@/lib/sre/ai/root-cause";
import { generateFixPlan } from "@/lib/sre/ai/fix-planner";
import type { IncidentSnapshot, ReplayStep } from "./types";

export function replayIncident(
  issue: { id: string; title: string },
  timeline: IncidentSnapshot[],
): ReplayStep[] {
  const steps: ReplayStep[] = [];
  let prevConfidence = 0;
  let prevTopCategory: string | null = null;

  for (const frame of timeline) {
    const rootCause = detectRootCause({
      title: issue.title,
      errorType: frame.errorType ?? null,
      errorValue: frame.errorValue ?? null,
      culprit: frame.topFrame?.function ?? null,
      frames: frame.topFrame ? [frame.topFrame] : [],
      frequency: frame.eventCount,
      userCount: 0,
    });
    const fixPlan = generateFixPlan(rootCause);

    // Risk score: blended frequency × severity (systemic doubles it) × confidence gap.
    const severityMultiplier = rootCause.systemic ? 2 : 1;
    const riskScore = Number(
      (
        frame.eventCount * severityMultiplier * (0.5 + rootCause.confidence * 0.5)
      ).toFixed(2),
    );

    const detectionDelta = {
      newHypothesis: rootCause.topCategory !== prevTopCategory,
      confidenceDelta: Number((rootCause.confidence - prevConfidence).toFixed(3)),
    };

    steps.push({
      timestamp: frame.timestamp,
      eventCount: frame.eventCount,
      rootCause: rootCause.topCategory,
      hypotheses: rootCause.hypotheses.slice(0, 4).map((h) => ({
        category: h.category,
        description: h.description,
        weight: Number(h.weight.toFixed(3)),
      })),
      confidence: Number(rootCause.confidence.toFixed(3)),
      systemic: rootCause.systemic,
      riskScore,
      fixPlan: fixPlan.map((f) => ({
        action: f.action,
        category: f.category,
        risk: f.risk,
      })),
      detectionDelta,
    });

    prevConfidence = rootCause.confidence;
    prevTopCategory = rootCause.topCategory;
  }

  return steps;
}
