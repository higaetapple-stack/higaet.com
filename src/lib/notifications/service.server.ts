// Server-only notification service. Renders templates, respects preferences,
// inserts in-app records, enqueues email sends, logs delivery.
// MUST only be imported dynamically inside server-function handlers.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { renderTemplate } from "./template";
import type {
  NotificationChannel,
  NotificationPriority,
  NotificationTemplateRow,
} from "./types";

export interface DispatchOptions {
  userId: string;
  eventType: string;
  eventId?: string | null;
  category?: string;
  vars?: Record<string, unknown>;
  priority?: NotificationPriority;
  // Override channels (default: respect user preferences for the category).
  channels?: NotificationChannel[];
  // Fallback content if no template exists for the event.
  fallback?: {
    title: string;
    body: string;
    actionUrl?: string | null;
  };
  data?: Record<string, unknown>;
  locale?: string;
}

export interface DispatchResult {
  notificationId: string | null;
  delivered: NotificationChannel[];
  skipped: NotificationChannel[];
  errors: { channel: NotificationChannel; error: string }[];
}

async function resolveChannels(
  userId: string,
  category: string,
  override?: NotificationChannel[],
): Promise<NotificationChannel[]> {
  if (override && override.length > 0) return override;
  const { data } = await supabaseAdmin
    .from("notification_preferences")
    .select("in_app, email, push")
    .eq("user_id", userId)
    .eq("category", category)
    .maybeSingle();
  // Defaults if user has no row: in_app + email on, push off.
  const prefs = data ?? { in_app: true, email: true, push: false };
  const channels: NotificationChannel[] = [];
  if (prefs.in_app) channels.push("in_app");
  if (prefs.email) channels.push("email");
  if (prefs.push) channels.push("push");
  return channels;
}

async function loadTemplates(
  eventType: string,
  locale: string,
): Promise<Record<NotificationChannel, NotificationTemplateRow | null>> {
  const { data } = await supabaseAdmin
    .from("notification_templates")
    .select("*")
    .eq("key", eventType)
    .eq("enabled", true)
    .in("locale", [locale, "en"]);
  const map: Record<NotificationChannel, NotificationTemplateRow | null> = {
    in_app: null,
    email: null,
    push: null,
  };
  for (const ch of ["in_app", "email", "push"] as NotificationChannel[]) {
    const exact = (data ?? []).find(
      (t) => t.channel === ch && t.locale === locale,
    );
    const fallback = (data ?? []).find(
      (t) => t.channel === ch && t.locale === "en",
    );
    map[ch] = (exact ?? fallback ?? null) as NotificationTemplateRow | null;
  }
  return map;
}

export async function dispatchNotification(
  opts: DispatchOptions,
): Promise<DispatchResult> {
  const category = opts.category ?? "system";
  const priority = opts.priority ?? "normal";
  const locale = opts.locale ?? "en";
  const vars = opts.vars ?? {};

  const channels = await resolveChannels(opts.userId, category, opts.channels);
  const templates = await loadTemplates(opts.eventType, locale);

  const result: DispatchResult = {
    notificationId: null,
    delivered: [],
    skipped: [],
    errors: [],
  };

  // ----- In-app -----
  if (channels.includes("in_app")) {
    const tpl = templates.in_app;
    const title =
      (tpl?.title && renderTemplate(tpl.title, vars)) ||
      opts.fallback?.title ||
      opts.eventType;
    const body =
      (tpl?.body_template && renderTemplate(tpl.body_template, vars)) ||
      opts.fallback?.body ||
      "";
    const actionUrl =
      (tpl?.action_url && renderTemplate(tpl.action_url, vars)) ||
      opts.fallback?.actionUrl ||
      null;

    const { data: notif, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: opts.userId,
        event_id: opts.eventId ?? null,
        event_type: opts.eventType,
        category,
        title,
        body,
        action_url: actionUrl,
        priority,
        data: opts.data ?? {},
      })
      .select("id")
      .single();

    if (error) {
      result.errors.push({ channel: "in_app", error: error.message });
    } else {
      result.notificationId = notif.id;
      result.delivered.push("in_app");
      await supabaseAdmin.from("notification_delivery_logs").insert({
        notification_id: notif.id,
        user_id: opts.userId,
        channel: "in_app",
        status: "delivered",
        provider: "in_app",
        delivered_at: new Date().toISOString(),
        attempts: 1,
      });
    }
  } else {
    result.skipped.push("in_app");
  }

  // ----- Email -----
  if (channels.includes("email")) {
    const tpl = templates.email;
    const subject =
      (tpl?.subject && renderTemplate(tpl.subject, vars)) ||
      opts.fallback?.title ||
      opts.eventType;
    const body =
      (tpl?.body_template && renderTemplate(tpl.body_template, vars)) ||
      opts.fallback?.body ||
      "";

    try {
      // Look up email
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", opts.userId)
        .maybeSingle();

      if (!profile?.email) {
        result.errors.push({ channel: "email", error: "no email on profile" });
      } else {
        // Try Lovable email queue if available; else log only.
        const { error: enqErr } = await supabaseAdmin.rpc(
          "enqueue_email" as never,
          {
            queue: "transactional_emails",
            payload: {
              to: profile.email,
              subject,
              html: `<div>${body}</div>`,
            },
          } as never,
        );
        const logStatus = enqErr ? "failed" : "queued";
        await supabaseAdmin.from("notification_delivery_logs").insert({
          notification_id: result.notificationId,
          user_id: opts.userId,
          channel: "email",
          status: logStatus,
          provider: "lovable_email",
          error: enqErr?.message ?? null,
          attempts: 1,
        });
        if (enqErr) {
          result.errors.push({ channel: "email", error: enqErr.message });
        } else {
          result.delivered.push("email");
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "email dispatch failed";
      result.errors.push({ channel: "email", error: msg });
    }
  } else {
    result.skipped.push("email");
  }

  // ----- Push (abstraction only, not wired to a provider yet) -----
  if (channels.includes("push")) {
    await supabaseAdmin.from("notification_delivery_logs").insert({
      notification_id: result.notificationId,
      user_id: opts.userId,
      channel: "push",
      status: "pending",
      provider: "noop",
      attempts: 0,
    });
    result.skipped.push("push");
  }

  return result;
}

// Convenience: process a domain event row by dispatching to a single user.
export async function processDomainEventForUser(
  eventId: string,
  userId: string,
  vars: Record<string, unknown>,
  category?: string,
): Promise<DispatchResult> {
  const { data: event } = await supabaseAdmin
    .from("domain_events")
    .select("event_type")
    .eq("id", eventId)
    .single();
  if (!event) {
    return {
      notificationId: null,
      delivered: [],
      skipped: [],
      errors: [{ channel: "in_app", error: "event not found" }],
    };
  }
  const res = await dispatchNotification({
    userId,
    eventType: event.event_type,
    eventId,
    category,
    vars,
  });
  await supabaseAdmin
    .from("domain_events")
    .update({
      status: res.errors.length > 0 ? "failed" : "processed",
      processed_at: new Date().toISOString(),
      error: res.errors.length > 0 ? JSON.stringify(res.errors) : null,
    })
    .eq("id", eventId);
  return res;
}
