import { defineTool } from "@lovable.dev/mcp-js";
import { summarizeAccuracy } from "@/lib/risk/accuracy";
import {
  getCurrentThresholds,
  getLastCalibrationReport,
} from "@/lib/risk/calibration";
import { getLearnedStats } from "@/lib/risk/learning";

/**
 * INSIGHTS-scope tool: current SRE calibration + top learned signals.
 * Returns aggregated model state only — no PR diffs, no incident bodies,
 * no Sentry payloads, no user identifiers.
 */
export default defineTool({
  name: "get_sre_snapshot",
  title: "AI SRE snapshot",
  description:
    "Return the current AI SRE risk thresholds, calibration mode, prediction-accuracy summary, and top learned root-cause signal categories. Aggregated only — no incident or PR detail.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const thresholds = getCurrentThresholds();
    const cal = getLastCalibrationReport();
    const acc = summarizeAccuracy();
    const stats = getLearnedStats();

    const topSignals = Object.entries(stats)
      .sort(([, a], [, b]) => Math.abs(b.weight) - Math.abs(a.weight))
      .slice(0, 5)
      .map(([signal, s]) => ({
        signal,
        weight: Number(s.weight.toFixed(3)),
        samples: s.samples,
      }));

    const snapshot = {
      thresholds,
      calibration_mode: cal?.state ?? "NO_DATA",
      calibration_reason: cal?.reason ?? "no cycle run yet",
      accuracy: {
        samples: acc.count,
        mean_abs_error: Number(acc.meanAbsError.toFixed(2)),
        over_prediction_rate: Number(acc.overPredictionRate.toFixed(3)),
        under_prediction_rate: Number(acc.underPredictionRate.toFixed(3)),
        trend: acc.trend,
      },
      top_signals: topSignals,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }],
      structuredContent: snapshot,
    };
  },
});
