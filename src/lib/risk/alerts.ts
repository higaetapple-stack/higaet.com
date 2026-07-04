/**
 * AI SRE Drift Alert Rules — pure functions over the accuracy tracker.
 * Advisory: returns alert payloads; delivery is a downstream concern.
 */

import { getAccuracySamples, summarizeAccuracy, rollingMAE } from "./accuracy";

export type AlertSeverity = "info" | "warning" | "critical";

export interface DriftAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  trend: "improving" | "steady" | "drifting";
  score: number; // 0–100
  topCategories: string[];
  affectedServices: string[];
}

const CATEGORY_TO_SERVICE: Record<string, string> = {
  auth: "auth",
  payment: "payments",
  database: "database",
  webhook: "webhooks",
  ui: "ui",
  react: "ui",
  rag: "ai/rag",
};

function inferServices(): { categories: string[]; services: string[] } {
  const samples = getAccuracySamples();
  const catCounts = new Map<string, number>();
  for (const s of samples.slice(-50)) {
    if (s.actualOutcome !== "incident") continue;
    // Predicted level acts as our category proxy when signal metadata is absent.
    const cat = s.predictedLevel.toLowerCase();
    catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
  }
  const categories = [...catCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);
  const services = [
    ...new Set(categories.map((c) => CATEGORY_TO_SERVICE[c] ?? "unknown")),
  ];
  return { categories, services };
}

export function evaluateDriftAlerts(): DriftAlert[] {
  const summary = summarizeAccuracy();
  const mae = rollingMAE(20);
  const alerts: DriftAlert[] = [];
  const { categories, services } = inferServices();

  if (summary.count < 5) return alerts;

  if (summary.trend === "drifting") {
    const severity: AlertSeverity = mae > 40 ? "critical" : "warning";
    alerts.push({
      id: "drift-trend",
      severity,
      title: "Prediction drift detected",
      message: `Recent MAE is trending worse (rolling MAE ${mae.toFixed(1)}).`,
      trend: summary.trend,
      score: Math.min(100, Math.round(mae * 1.2)),
      topCategories: categories,
      affectedServices: services,
    });
  }

  if (summary.overPredictionRate > 0.4) {
    alerts.push({
      id: "over-prediction",
      severity: "warning",
      title: "Over-prediction imbalance",
      message: `${(summary.overPredictionRate * 100).toFixed(0)}% of predictions cried wolf.`,
      trend: summary.trend,
      score: Math.round(summary.overPredictionRate * 100),
      topCategories: categories,
      affectedServices: services,
    });
  }

  if (summary.underPredictionRate > 0.15) {
    alerts.push({
      id: "under-prediction",
      severity: "critical",
      title: "Under-prediction imbalance",
      message: `${(summary.underPredictionRate * 100).toFixed(0)}% of incidents slipped past low-risk predictions.`,
      trend: summary.trend,
      score: Math.round(50 + summary.underPredictionRate * 200),
      topCategories: categories,
      affectedServices: services,
    });
  }

  return alerts;
}
