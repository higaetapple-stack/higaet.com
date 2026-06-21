// Server-only helper to record a security_event AND fan-out a notification
// through the Phase 3A platform. Import dynamically inside server-fn handlers.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { dispatchNotification } from "@/lib/notifications/service.server";

export type SecurityEventType =
  | "mfa.enrolled"
  | "mfa.disabled"
  | "mfa.challenged"
  | "session.revoked"
  | "password.changed"
  | "password.reset"
  | "sso.linked"
  | "sso.unlinked"
  | "login.failed"
  | "login.suspicious"
  | "role.changed"
  | "recovery_code.used"
  | "recovery_codes.regenerated";

export interface RecordSecurityEventOptions {
  userId: string | null;
  eventType: SecurityEventType;
  severity?: "info" | "warning" | "critical";
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  notify?: { title: string; body: string; actionUrl?: string };
}

export async function recordSecurityEvent(opts: RecordSecurityEventOptions) {
  const { error } = await supabaseAdmin.from("security_events").insert({
    user_id: opts.userId,
    event_type: opts.eventType,
    severity: opts.severity ?? "info",
    ip_address: opts.ip ?? null,
    user_agent: opts.userAgent ?? null,
    metadata: (opts.metadata ?? {}) as never,
  });
  if (error) console.error("[security] event insert failed", error.message);

  if (opts.userId && opts.notify) {
    try {
      await dispatchNotification({
        userId: opts.userId,
        eventType: opts.eventType,
        category: "security",
        priority: opts.severity === "critical" ? "high" : "normal",
        fallback: {
          title: opts.notify.title,
          body: opts.notify.body,
          actionUrl: opts.notify.actionUrl ?? "/dashboard/security",
        },
        data: opts.metadata,
      });
    } catch (e) {
      console.error("[security] notify failed", e);
    }
  }
}
