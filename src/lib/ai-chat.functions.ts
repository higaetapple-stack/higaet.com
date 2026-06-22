// Phase 7.1 AI Hub — conversation & message server functions.
// Per-user, RLS-scoped persistence for tutor/assistant chats.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AiContextType = "lesson" | "community" | "general";
export type AiMessageRole = "user" | "assistant" | "system";

export interface AiConversationRow {
  id: string;
  user_id: string;
  context_type: AiContextType;
  context_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessageRow {
  id: string;
  conversation_id: string;
  role: AiMessageRole;
  content: string;
  token_count: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const contextSchema = z.enum(["lesson", "community", "general"]);

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      contextType: contextSchema.default("general"),
      contextId: z.string().uuid().optional().nullable(),
      title: z.string().min(1).max(200).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ai_conversations")
      .insert({
        user_id: context.userId,
        context_type: data.contextType,
        context_id: data.contextId ?? null,
        title: data.title ?? "New conversation",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as AiConversationRow;
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      contextType: contextSchema.optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.contextType) q = q.eq("context_type", data.contextType);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as AiConversationRow[];
  });

export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: conv, error } = await context.supabase
      .from("ai_conversations")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conv) throw new Error("Conversation not found");

    const { data: msgs, error: mErr } = await context.supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    return {
      conversation: conv as AiConversationRow,
      messages: (msgs ?? []) as AiMessageRow[],
    };
  });

export const renameConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_conversations")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_conversations")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Find-or-create a conversation for a lesson-scoped tutor session.
export const getOrCreateLessonConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ lessonId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", context.userId)
      .eq("context_type", "lesson")
      .eq("context_id", data.lessonId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return existing as AiConversationRow;

    const { data: row, error } = await context.supabase
      .from("ai_conversations")
      .insert({
        user_id: context.userId,
        context_type: "lesson",
        context_id: data.lessonId,
        title: "Tutor",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as AiConversationRow;
  });
