/**
 * AI SRE loop entry point. Pure orchestration over the analysis primitives —
 * no I/O, safe to call from tests or from the Sentry bridge alike.
 */

import { detectRootCause, type RootCauseInput, type RootCauseReport } from "./root-cause";
import { generateFixPlan, type FixSuggestion } from "./fix-planner";
import { suggestPR, type PRSuggestion } from "./pr-suggester";

export interface AISREIncident extends RootCauseInput {
  id: string;
  shortId?: string;
  permalink?: string;
}

export interface AISREAnalysis {
  issueId: string;
  shortId?: string;
  rootCause: RootCauseReport;
  fixPlan: FixSuggestion[];
  prSuggestion: PRSuggestion;
  autoPRRecommended: boolean;
}

/**
 * Only recommend actually opening a PR when confidence is high AND the plan
 * has at least one entry whose risk is not "high". This mirrors the SRE
 * engine's safety posture: advisory by default, opt-in for the loop.
 */
export function shouldRecommendAutoPR(analysis: {
  rootCause: RootCauseReport;
  fixPlan: FixSuggestion[];
}): boolean {
  if (analysis.rootCause.confidence < 0.7) return false;
  if (analysis.rootCause.topCategory === "unknown") return false;
  return analysis.fixPlan.some((f) => f.risk !== "high");
}

export function runAISRELoop(incident: AISREIncident): AISREAnalysis {
  const rootCause = detectRootCause(incident);
  const fixPlan = generateFixPlan(rootCause);
  const prSuggestion = suggestPR({
    issueTitle: incident.title ?? incident.id,
    issueShortId: incident.shortId,
    issuePermalink: incident.permalink,
    rootCause,
    fixPlan,
  });
  return {
    issueId: incident.id,
    shortId: incident.shortId,
    rootCause,
    fixPlan,
    prSuggestion,
    autoPRRecommended: shouldRecommendAutoPR({ rootCause, fixPlan }),
  };
}
