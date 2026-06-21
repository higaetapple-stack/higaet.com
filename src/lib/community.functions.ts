// Server functions for the Phase 2A Community platform.
// Communities, members (join/leave), threads, replies, reactions, events, RSVPs.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type {
  CommunityRow,
  ThreadRow,
  ReplyRow,
  ReactionRow,
  EventRow,
  EventRsvpRow,
} from "./community/types";

// Attach author profiles to rows that have author_id, in one round trip.
async function attachAuthors(
  supabase: any,
  rows: Array<{ author_id: string; author?: { full_name: string | null; avatar_url: string | null } | null }>,
) {
  if (rows.length === 0) return;
  const ids = Array.from(new Set(rows.map((r) => r.author_id).filter(Boolean)));
  if (ids.length === 0) return;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);
  const map = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  for (const p of (data ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null }>) {
    map.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
  }
  for (const r of rows) r.author = map.get(r.author_id) ?? null;
}

// ============================================================
// Communities
// ============================================================
export const listCommunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("communities")
      .select("*")
      .order("member_count", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as CommunityRow[];
  });

export const getCommunityBySlug = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("communities")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Community not found");
    const { data: mem } = await context.supabase
      .from("community_members")
      .select("user_id")
      .eq("community_id", row.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    return { community: row as CommunityRow, isMember: !!mem };
  });

export const joinCommunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ communityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("community_members")
      .insert({ community_id: data.communityId, user_id: context.userId });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const leaveCommunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ communityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("community_members")
      .delete()
      .eq("community_id", data.communityId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyCommunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("community_members")
      .select("community_id, communities!inner(*)")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return ((data ?? []).map((r: any) => r.communities) as CommunityRow[]);
  });

// ============================================================
// Threads
// ============================================================
export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      communityId: z.string().uuid().optional(),
      lessonId: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(100).default(30),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("threads")
      .select("*")
      .order("pinned", { ascending: false })
      .order("last_reply_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 30);
    if (data.communityId) q = q.eq("community_id", data.communityId);
    if (data.lessonId) q = q.eq("lesson_id", data.lessonId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const threads = (rows ?? []) as ThreadRow[];
    await attachAuthors(context.supabase, threads);
    return threads;
  });

export const getThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("threads")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Thread not found");
    const t = row as ThreadRow;
    await attachAuthors(context.supabase, [t]);
    return t;
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      communityId: z.string().uuid(),
      title: z.string().trim().min(3).max(200),
      body: z.string().trim().min(1).max(10000),
      lessonId: z.string().uuid().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("threads")
      .insert({
        community_id: data.communityId,
        author_id: context.userId,
        title: data.title,
        body: data.body,
        lesson_id: data.lessonId ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.rpc("emit_domain_event", {
      _event_type: "thread.created",
      _aggregate_type: "thread",
      _aggregate_id: row.id,
      _payload: { community_id: data.communityId, title: data.title },
    });
    return row as ThreadRow;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("threads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// Replies
// ============================================================
export const listReplies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ threadId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("replies")
      .select("*")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const replies = (rows ?? []) as ReplyRow[];
    await attachAuthors(context.supabase, replies);
    return replies;
  });

export const createReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      threadId: z.string().uuid(),
      body: z.string().trim().min(1).max(5000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("replies")
      .insert({
        thread_id: data.threadId,
        author_id: context.userId,
        body: data.body,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Notify thread author if it's not the same person
    const { data: thread } = await context.supabase
      .from("threads")
      .select("author_id, title, community_id")
      .eq("id", data.threadId)
      .maybeSingle();

    if (thread && thread.author_id !== context.userId) {
      const { dispatchNotification } = await import("@/lib/notifications/service.server");
      await dispatchNotification({
        userId: thread.author_id,
        eventType: "thread.reply_created",
        category: "community",
        fallback: {
          title: "New reply on your thread",
          body: `Someone replied to "${thread.title}".`,
          actionUrl: `/community/thread/${data.threadId}`,
        },
        data: { thread_id: data.threadId, reply_id: row.id },
      });
    }

    await context.supabase.rpc("emit_domain_event", {
      _event_type: "thread.reply_created",
      _aggregate_type: "reply",
      _aggregate_id: row.id,
      _payload: { thread_id: data.threadId },
    });

    return row as ReplyRow;
  });

export const deleteReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("replies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// Reactions
// ============================================================
const reactionInput = z.object({
  targetType: z.enum(["thread", "reply"]),
  targetId: z.string().uuid(),
  emoji: z.string().min(1).max(16),
});

export const toggleReaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => reactionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("reactions")
      .select("id")
      .eq("target_type", data.targetType)
      .eq("target_id", data.targetId)
      .eq("user_id", context.userId)
      .eq("emoji", data.emoji)
      .maybeSingle();

    if (existing) {
      const { error } = await context.supabase.from("reactions").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { added: false };
    }
    const { error } = await context.supabase.from("reactions").insert({
      target_type: data.targetType,
      target_id: data.targetId,
      user_id: context.userId,
      emoji: data.emoji,
    });
    if (error) throw new Error(error.message);
    return { added: true };
  });

export const listReactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      targetType: z.enum(["thread", "reply"]),
      targetIds: z.array(z.string().uuid()).min(1).max(200),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("reactions")
      .select("*")
      .eq("target_type", data.targetType)
      .in("target_id", data.targetIds);
    if (error) throw new Error(error.message);
    return (rows ?? []) as ReactionRow[];
  });

// ============================================================
// Events
// ============================================================
export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      upcomingOnly: z.boolean().default(true),
      communityId: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("events").select("*").order("starts_at", { ascending: true }).limit(data.limit ?? 50);
    if (data.upcomingOnly) q = q.gte("starts_at", new Date().toISOString());
    if (data.communityId) q = q.eq("community_id", data.communityId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as EventRow[];
  });

export const getEvent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("events")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Event not found");
    const { data: rsvp } = await context.supabase
      .from("event_rsvps")
      .select("*")
      .eq("event_id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    return { event: row as EventRow, myRsvp: (rsvp as EventRsvpRow | null) ?? null };
  });

export const setRsvp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      eventId: z.string().uuid(),
      status: z.enum(["going", "maybe", "declined"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("event_rsvps")
      .upsert(
        { event_id: data.eventId, user_id: context.userId, status: data.status, updated_at: new Date().toISOString() },
        { onConflict: "event_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelRsvp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ eventId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", data.eventId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin/staff: create event
export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      title: z.string().min(3).max(200),
      description: z.string().max(5000).optional().nullable(),
      startsAt: z.string(),
      endsAt: z.string(),
      location: z.string().max(500).optional().nullable(),
      virtualUrl: z.string().url().optional().nullable(),
      capacity: z.number().int().positive().optional().nullable(),
      communityId: z.string().uuid().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("events")
      .insert({
        title: data.title,
        description: data.description ?? null,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        location: data.location ?? null,
        virtual_url: data.virtualUrl ?? null,
        capacity: data.capacity ?? null,
        community_id: data.communityId ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.rpc("emit_domain_event", {
      _event_type: "event.created",
      _aggregate_type: "event",
      _aggregate_id: row.id,
      _payload: { title: data.title, starts_at: data.startsAt },
    });
    return row as EventRow;
  });
