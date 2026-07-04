/**
 * Admin-gated server function — surfaces AI SRE calibration + accuracy
 * metrics for the /dashboard/admin/sre-metrics page. Read-only.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { summarizeAccuracy, getAccuracySamples, rollingMAE } from "@/lib/risk/accuracy";
import {
  runCalibrationCycle,
  getCurrentThresholds,
  type CalibrationReport,
  type CalibrationThresholds,
} from "@/lib/risk/calibration";
import { evaluateDriftAlerts, type DriftAlert } from "@/lib/risk/alerts";
import { simulate, casesFromAccuracy, type SimulationSummary } from "@/lib/risk/simulation";

export interface SREMetricsPayload {
  timestamp: number;
  accuracy: ReturnType<typeof summarizeAccuracy>;
  rollingMae: number;
  timeseries: Array<{ t: number; abs: number; predicted: number; actual: number }>;
  calibration: CalibrationReport;
  currentThresholds: CalibrationThresholds;
  alerts: DriftAlert[];
  simulationPreview: SimulationSummary;
}

async function assertAdmin(ctx: {
  supabase: {
    rpc: (
      name: "has_role",
      args: { _user_id: string; _role: "admin" | "super_admin" },
    ) => Promise<{ data: boolean | null; error: { message: string } | null }>;
  };
  userId: string;
}) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (isAdmin) return;
  const { data: isSuper } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin",
  });
  if (!isSuper) throw new Error("Forbidden");
}

export const adminGetSreMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SREMetricsPayload> => {
    await assertAdmin(context as never);

    const accuracy = summarizeAccuracy();
    const samples = getAccuracySamples();
    const timeseries = samples.map((s) => ({
      t: s.timestamp,
      abs: Math.abs(s.delta),
      predicted: s.predictedRisk,
      actual: s.delta + s.predictedRisk,
    }));

    const calibration = runCalibrationCycle();
    const alerts = evaluateDriftAlerts();
    // Preview what would happen if we accepted the proposed thresholds.
    const simulationPreview = simulate(calibration.proposed, casesFromAccuracy());

    return {
      timestamp: Date.now(),
      accuracy,
      rollingMae: rollingMAE(20),
      timeseries,
      calibration,
      currentThresholds: getCurrentThresholds(),
      alerts,
      simulationPreview,
    };
  });
