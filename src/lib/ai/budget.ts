// Daily budget + global kill switch.
// Server-only.

export function killSwitchEnabled(): boolean {
  const v = process.env.AI_KILL_SWITCH?.toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function dailyBudgetUsd(): number {
  const raw = process.env.AI_BUDGET_DAILY_USD;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : Infinity;
}

/** Returns true if a request should be denied because budget is exhausted. */
export async function isBudgetExceeded(consumer: string): Promise<boolean> {
  const cap = dailyBudgetUsd();
  if (!Number.isFinite(cap)) return false;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("ai_usage")
      .select("cost_usd")
      .eq("consumer", consumer)
      .gte("created_at", since);
    if (error || !data) return false;
    const spent = data.reduce((acc: number, row: { cost_usd: number | null }) => acc + (row.cost_usd ?? 0), 0);
    return spent >= cap;
  } catch {
    return false; // Fail open — never block traffic on telemetry failure.
  }
}

/** Soft downgrade: 80% of budget consumed → return downgraded logical id. */
export async function shouldDowngrade(consumer: string): Promise<boolean> {
  const cap = dailyBudgetUsd();
  if (!Number.isFinite(cap)) return false;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from("ai_usage")
      .select("cost_usd")
      .eq("consumer", consumer)
      .gte("created_at", since);
    if (!data) return false;
    const spent = data.reduce((a: number, r: { cost_usd: number | null }) => a + (r.cost_usd ?? 0), 0);
    return spent >= cap * 0.8;
  } catch {
    return false;
  }
}
