import { defineTool } from "@lovable.dev/mcp-js";
import { summarizeAccuracy } from "@/lib/risk/accuracy";
import { getLastCalibrationReport, getCurrentThresholds } from "@/lib/risk/calibration";

/**
 * INSIGHTS-scope tool: safe, high-level system health overview.
 * No PII, no internal SRE detail, no Sentry issue payloads — aggregated
 * summaries only. Everything read here is already advisory/observability data.
 */
export default defineTool({
  name: "get_system_health_overview",
  title: "System health overview",
  description:
    "Return an aggregated, read-only system health snapshot: overall risk level, calibration state, recent prediction accuracy, and observability signals. No incident details or PII.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const acc = summarizeAccuracy();
    const cal = getLastCalibrationReport();
    const thresholds = getCurrentThresholds();

    // Derive a coarse LOW/MEDIUM/HIGH from prediction reliability.
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (acc.underPredictionRate > 0.1 || acc.trend === "drifting") riskLevel = "HIGH";
    else if (acc.meanAbsError > 15) riskLevel = "MEDIUM";

    // Health score: 100 minus penalties, bounded [0, 100].
    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            acc.meanAbsError * 1.5 -
            acc.underPredictionRate * 100 -
            (acc.trend === "drifting" ? 15 : 0),
        ),
      ),
    );

    const summary = {
      risk_level: riskLevel,
      health_score: score,
      predictions: {
        samples: acc.count,
        mean_abs_error: Number(acc.meanAbsError.toFixed(2)),
        trend: acc.trend,
      },
      calibration: {
        state: cal?.state ?? "NO_DATA",
        cycle: cal?.cycle ?? 0,
        thresholds,
      },
      // Sentry release status is intentionally omitted from this tool —
      // exposing raw release IDs leaks deployment cadence. Admin dashboards
      // remain the source of truth.
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
