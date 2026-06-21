// Server functions for the notification platform.
// Client-safe to import — handler bodies are stripped from client bundles.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type {
  NotificationChannel,
  NotificationRow,
  NotificationPreferenceRow,
  NotificationTemplateRow,
  NotificationPriority,
} from "./notifications/types";

// ---------- List my notifications ----------
const listInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
    onlyUnread: z.boolean().default(false),
  })
  .partial();

export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.onlyUnread) q = q.is("read_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as NotificationRow[];
  });

// ---------- Unread count ----------
export const getUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc(
      "notifications_unread_count",
    );
    if (error) throw new Error(error.message);
    return (data as number) ?? 0;
  });

// ---------- Mark one read ----------
export const markRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Mark all read ----------
export const markAllRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc(
      "notifications_mark_all_read",
    );
    if (error) throw new Error(error.message);
    return { updated: (data as number) ?? 0 };
  });

// ---------- Archive ----------
export const archiveNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Preferences ----------
export const getMyPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []) as NotificationPreferenceRow[];
  });

const updatePrefInput = z.object({
  category: z.string().min(1).max(64),
  in_app: z.boolean(),
  email: z.boolean(),
  push: z.boolean(),
});

export const upsertMyPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updatePrefInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: context.userId,
          category: data.category,
          in_app: data.in_app,
          email: data.email,
          push: data.push,
        },
        { onConflict: "user_id,category" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: templates ----------
export const adminListTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_any_role", {
      _user_id: context.userId,
      _roles: ["admin", "super_admin"],
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("notification_templates")
      .select("*")
      .order("key", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as NotificationTemplateRow[];
  });

const upsertTemplateInput = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(128),
  channel: z.enum(["in_app", "email", "push"]),
  locale: z.string().min(2).max(8).default("en"),
  subject: z.string().max(255).optional().nullable(),
  title: z.string().max(255).optional().nullable(),
  body_template: z.string().min(1),
  action_url: z.string().max(1024).optional().nullable(),
  category: z.string().min(1).max(64).default("system"),
  enabled: z.boolean().default(true),
});

export const adminUpsertTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertTemplateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_any_role", {
      _user_id: context.userId,
      _roles: ["admin", "super_admin"],
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("notification_templates")
      .upsert(data, { onConflict: "key,channel,locale" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: send test notification to self ----------
const testInput = z.object({
  eventType: z.string().min(1),
  category: z.string().default("system"),
  title: z.string().default("Test notification"),
  body: z.string().default("This is a test notification from HIGAET."),
  priority: z
    .enum(["low", "normal", "high", "critical"])
    .default("normal") as z.ZodType<NotificationPriority>,
  channels: z
    .array(z.enum(["in_app", "email", "push"]))
    .optional() as z.ZodType<NotificationChannel[] | undefined>,
});

export const adminSendTestToSelf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => testInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_any_role", {
      _user_id: context.userId,
      _roles: ["admin", "super_admin"],
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { dispatchNotification } = await import(
      "./notifications/service.server"
    );
    return dispatchNotification({
      userId: context.userId,
      eventType: data.eventType,
      category: data.category,
      priority: data.priority,
      channels: data.channels,
      fallback: { title: data.title, body: data.body },
    });
  });

// ---------- Emit a domain event (server-side; usable from any feature) ----------
const emitInput = z.object({
  eventType: z.string().min(1).max(128),
  aggregateType: z.string().max(64).optional(),
  aggregateId: z.string().max(128).optional(),
  payload: z.record(z.unknown()).default({}),
});

export const emitDomainEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => emitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc(
      "emit_domain_event",
      {
        _event_type: data.eventType,
        _aggregate_type: data.aggregateType ?? undefined,
        _aggregate_id: data.aggregateId ?? undefined,
        _payload: data.payload as never,
      },
    );
    if (error) throw new Error(error.message);
    return { eventId: id as string };
  });
