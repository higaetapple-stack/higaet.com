// AI usage telemetry. Inserts one row per provider attempt.
// Server-only. Best-effort: never throws into caller.

export interface UsageRow {
  request_id: string;
  consumer: string;
  logical_id: string;
  provider: string;
  model: string;
  attempt: number;
  outcome: "success" | "fallback" | "error" | "budget_block" | "killed";
  tokens_in?: number;
  tokens_out?: number;
  latency_ms?: number;
  cost_usd?: number;
  error_code?: string;
}

export async function logUsage(row: UsageRow): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = supabaseAdmin as unknown as {
      from: (t: string) => { insert: (r: UsageRow) => Promise<{ error: unknown }> };
    };
    await client.from("ai_usage").insert(row);
  } catch {
    // swallow — telemetry must never break the request path.
  }
}

export function newRequestId(): string {
  // Lightweight UUID v4 — avoids extra deps.
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
