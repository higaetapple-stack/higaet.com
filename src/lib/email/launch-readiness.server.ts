// Launch-readiness helpers for the email subsystem.
// Server-only. Import dynamically from inside server-fn handlers.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { pingBrevo } from "./brevo";

export interface EmailHealthCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  value?: number | string | null;
}

export async function checkEmailHealth(): Promise<EmailHealthCheck[]> {
  const checks: EmailHealthCheck[] = [];

  // 1. Brevo API reachable
  const ping = await pingBrevo();
  checks.push({
    name: "brevo_api_reachable",
    status: ping.ok ? "pass" : "fail",
    detail: ping.ok ? "Brevo /v3/account responded OK" : ping.error ?? "unreachable",
  });

  // 2. Delivery success rate (last 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabaseAdmin
    .from("notification_delivery_logs")
    .select("status")
    .eq("channel", "email")
    .gte("created_at", since);
  const total = rows?.length ?? 0;
  const sent = (rows ?? []).filter((r) => r.status === "sent" || r.status === "delivered").length;
  const failed = (rows ?? []).filter((r) => r.status === "failed").length;
  const rate = total === 0 ? 1 : sent / total;
  checks.push({
    name: "email_success_rate_24h",
    status: total === 0 ? "warn" : rate >= 0.95 ? "pass" : rate >= 0.8 ? "warn" : "fail",
    detail: `${sent}/${total} succeeded in last 24h`,
    value: Number(rate.toFixed(3)),
  });

  // 3. Failed count
  checks.push({
    name: "email_failed_count_24h",
    status: failed === 0 ? "pass" : failed < 5 ? "warn" : "fail",
    detail: `${failed} email failures in last 24h`,
    value: failed,
  });

  // 4. Last successful send
  const { data: lastSent } = await supabaseAdmin
    .from("notification_delivery_logs")
    .select("delivered_at, created_at")
    .eq("channel", "email")
    .eq("status", "sent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastTs = lastSent?.delivered_at ?? lastSent?.created_at ?? null;
  checks.push({
    name: "email_last_successful_send",
    status: lastTs ? "pass" : "warn",
    detail: lastTs ? `Last send at ${lastTs}` : "No successful sends recorded yet",
    value: lastTs,
  });

  // 5. Queue/backlog (pending email delivery logs)
  const { count: pendingCount } = await supabaseAdmin
    .from("notification_delivery_logs")
    .select("id", { count: "exact", head: true })
    .eq("channel", "email")
    .eq("status", "pending");
  checks.push({
    name: "email_pending_backlog",
    status: (pendingCount ?? 0) < 50 ? "pass" : "warn",
    detail: `${pendingCount ?? 0} pending email entries`,
    value: pendingCount ?? 0,
  });

  return checks;
}
