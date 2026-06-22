// Server-only webhook dispatcher: lease, sign, POST, retry, dead-letter.
import { createHmac, randomUUID } from "node:crypto";

const MAX_BATCH = 25;
const LEASE_SECONDS = 60;
const TIMEOUT_MS = 10_000;

function backoffSeconds(attempt: number): number {
  // 30s, 2m, 8m, 30m, 2h, 8h
  const base = 30 * Math.pow(4, Math.max(0, attempt - 1));
  return Math.min(base, 8 * 3600);
}

export function signPayload(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export async function dispatchPendingWebhooks(): Promise<{
  leased: number;
  delivered: number;
  failed: number;
  dead: number;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: leased, error: leaseErr } = await supabaseAdmin.rpc("lease_webhook_deliveries", {
    _limit: MAX_BATCH,
    _lease_seconds: LEASE_SECONDS,
  });
  if (leaseErr) throw new Error(`lease failed: ${leaseErr.message}`);
  const rows = (leased ?? []) as Array<{
    id: number;
    subscription_id: string;
    event_type: string;
    payload: unknown;
    attempt: number;
    max_attempts: number;
  }>;
  if (rows.length === 0) return { leased: 0, delivered: 0, failed: 0, dead: 0 };

  const subIds = Array.from(new Set(rows.map((r) => r.subscription_id)));
  const { data: subs } = await supabaseAdmin
    .from("api_webhook_subscriptions")
    .select("id, url, signing_secret, status")
    .in("id", subIds);
  const subMap = new Map((subs ?? []).map((s) => [s.id, s]));

  let delivered = 0;
  let failed = 0;
  let dead = 0;

  await Promise.all(
    rows.map(async (row) => {
      const sub = subMap.get(row.subscription_id);
      if (!sub || sub.status !== "active") {
        await supabaseAdmin
          .from("api_webhook_deliveries")
          .update({ status: "dead", error: "subscription inactive", leased_until: null })
          .eq("id", row.id);
        dead++;
        return;
      }

      const body = JSON.stringify(row.payload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const deliveryId = randomUUID();
      const signature = signPayload(sub.signing_secret, timestamp, body);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      let status = 0;
      let responseBody = "";
      let errorMsg: string | null = null;
      try {
        const res = await fetch(sub.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-HIGAET-Event": row.event_type,
            "X-HIGAET-Timestamp": timestamp,
            "X-HIGAET-Signature": signature,
            "X-HIGAET-Delivery-Id": deliveryId,
          },
          body,
          signal: controller.signal,
        });
        status = res.status;
        responseBody = (await res.text().catch(() => "")).slice(0, 2000);
      } catch (e: any) {
        errorMsg = String(e?.message ?? e).slice(0, 500);
      } finally {
        clearTimeout(timer);
      }

      const ok = status >= 200 && status < 300;
      if (ok) {
        await Promise.all([
          supabaseAdmin
            .from("api_webhook_deliveries")
            .update({
              status: "success",
              response_status: status,
              response_body: responseBody,
              error: null,
              delivered_at: new Date().toISOString(),
              leased_until: null,
              next_attempt_at: null,
            })
            .eq("id", row.id),
          supabaseAdmin
            .from("api_webhook_subscriptions")
            .update({ last_success_at: new Date().toISOString() })
            .eq("id", sub.id),
        ]);
        delivered++;
        return;
      }

      const isDead = row.attempt >= row.max_attempts;
      const nextStatus = isDead ? "dead" : "failed";
      const nextAt = isDead
        ? null
        : new Date(Date.now() + backoffSeconds(row.attempt) * 1000).toISOString();

      await Promise.all([
        supabaseAdmin
          .from("api_webhook_deliveries")
          .update({
            status: nextStatus,
            response_status: status || null,
            response_body: responseBody || null,
            error: errorMsg,
            next_attempt_at: nextAt,
            leased_until: null,
          })
          .eq("id", row.id),
        supabaseAdmin
          .from("api_webhook_subscriptions")
          .update({ last_failure_at: new Date().toISOString() })
          .eq("id", sub.id),
      ]);
      if (isDead) dead++;
      else failed++;
    }),
  );

  return { leased: rows.length, delivered, failed, dead };
}
