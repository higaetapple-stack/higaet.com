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

async function spentLast24h(consumer: string): Promise<number> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    // ai_usage table is created by a pending migration; cast through unknown
    // until generated types catch up.
    const client = supabaseAdmin as unknown as {
      from: (t: string) => {
        select: (cols: string) => {
          eq: (k: string, v: string) => {
            gte: (k: string, v: string) => Promise<{
              data: Array<{ cost_usd: number | null }> | null;
              error: unknown;
            }>;
          };
        };
      };
    };
    const { data, error } = await client
      .from("ai_usage")
      .select("cost_usd")
      .eq("consumer", consumer)
      .gte("created_at", since);
    if (error || !data) return 0;
    return data.reduce((acc, row) => acc + (row.cost_usd ?? 0), 0);
  } catch {
    return 0; // Fail open.
  }
}

/** Returns true if a request should be denied because budget is exhausted. */
export async function isBudgetExceeded(consumer: string): Promise<boolean> {
  const cap = dailyBudgetUsd();
  if (!Number.isFinite(cap)) return false;
  return (await spentLast24h(consumer)) >= cap;
}

/** Soft downgrade: 80% of budget consumed → callers may pick a cheaper model. */
export async function shouldDowngrade(consumer: string): Promise<boolean> {
  const cap = dailyBudgetUsd();
  if (!Number.isFinite(cap)) return false;
  return (await spentLast24h(consumer)) >= cap * 0.8;
}
