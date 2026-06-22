// Phase 7.1 AI Hub — streaming chat endpoint.
// Authenticates via bearer token, injects lesson/community context, streams via Lovable AI Gateway,
// and persists user + assistant messages to ai_messages on stream completion.

import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

const TUTOR_SYSTEM = `You are HIGAET's AI Tutor — an adaptive learning assistant for students of the Helen Institute of Gen AI Engineering & Technology.

Behavior:
- Ground every answer in the supplied LESSON CONTEXT and DISCUSSION CONTEXT when present.
- If the lesson doesn't cover the question, say so explicitly before answering from general knowledge.
- Prefer concrete examples, short explanations, and follow-up checks for understanding.
- When citing community discussion, refer to it generically ("a peer noted…") — never reveal user IDs or names.
- Use markdown for code, lists, and emphasis.`;

const ASSISTANT_SYSTEM = `You are HIGAET's AI Assistant — a community-aware learning copilot.

You can:
- Summarize discussions and threads from the COMMUNITY CONTEXT block.
- Identify common confusions, FAQs, and recurring topics.
- Suggest related lessons or events when relevant.
- Answer general study, career, and study-abroad questions about HIGAET's three divisions (Academy, Global Education, Technologies).

Never reveal user IDs or personally identifying information from the context. Use markdown.`;

interface ChatBody {
  messages: UIMessage[];
  data?: {
    conversationId?: string;
    contextType?: "lesson" | "community" | "general";
    contextId?: string | null;
  };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const lovableKey = process.env.LOVABLE_API_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabasePub = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!lovableKey || !supabaseUrl || !supabasePub) {
          return new Response("AI service not configured", { status: 500 });
        }

        // Auth: read bearer token
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabase = createClient<Database>(supabaseUrl, supabasePub, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as ChatBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages required", { status: 400 });
        }
        const conversationId = body.data?.conversationId;
        const contextType = body.data?.contextType ?? "general";
        const contextId = body.data?.contextId ?? null;

        // Verify conversation belongs to user (also gates persistence)
        let convOwned = false;
        if (conversationId) {
          const { data: conv } = await supabase
            .from("ai_conversations")
            .select("id, user_id")
            .eq("id", conversationId)
            .maybeSingle();
          convOwned = !!conv && conv.user_id === userId;
        }

        // Build context block
        let contextBlock = "";
        if (contextType === "lesson" && contextId) {
          const { data: lesson } = await supabase
            .from("lessons")
            .select("title, content, description, course_id")
            .eq("id", contextId)
            .maybeSingle();
          if (lesson) {
            contextBlock += `LESSON CONTEXT — ${lesson.title}\n${(lesson.content ?? lesson.description ?? "").slice(0, 4000)}\n\n`;
          }
          const { data: threads } = await supabase
            .from("threads")
            .select("id, title, body")
            .eq("lesson_id", contextId)
            .is("deleted_at", null)
            .eq("is_hidden", false)
            .order("created_at", { ascending: false })
            .limit(5);
          if (threads && threads.length > 0) {
            contextBlock += `DISCUSSION CONTEXT (recent peer questions):\n`;
            for (const t of threads) {
              contextBlock += `- ${t.title}: ${(t.body ?? "").slice(0, 300)}\n`;
            }
            contextBlock += "\n";
          }
        } else if (contextType === "community" && contextId) {
          const { data: thread } = await supabase
            .from("threads")
            .select("title, body")
            .eq("id", contextId)
            .maybeSingle();
          if (thread) {
            contextBlock += `COMMUNITY CONTEXT — Thread "${thread.title}"\n${(thread.body ?? "").slice(0, 2000)}\n\n`;
          }
          const { data: replies } = await supabase
            .from("replies")
            .select("body")
            .eq("thread_id", contextId)
            .is("deleted_at", null)
            .eq("is_hidden", false)
            .order("created_at", { ascending: true })
            .limit(20);
          if (replies && replies.length > 0) {
            contextBlock += `REPLIES:\n${replies.map((r, i) => `${i + 1}. ${(r.body ?? "").slice(0, 400)}`).join("\n")}\n\n`;
          }
        }

        const system =
          (contextType === "lesson" ? TUTOR_SYSTEM : ASSISTANT_SYSTEM) +
          (contextBlock ? `\n\n---\n${contextBlock}---\n` : "");

        const gateway = createLovableAiGatewayProvider(lovableKey);
        const model = gateway("google/gemini-3-flash-preview");

        // Persist the latest user message immediately (so reload preserves it even if stream fails)
        const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
        if (convOwned && lastUser) {
          const text = lastUser.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("");
          if (text.trim()) {
            await supabase.from("ai_messages").insert({
              conversation_id: conversationId!,
              role: "user",
              content: text,
              metadata: { context_type: contextType, context_id: contextId },
            });
          }
        }

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(body.messages),
          onError: (err) => {
            console.error("[ai/chat] stream error", err);
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          onFinish: async ({ responseMessage }) => {
            if (!convOwned || !responseMessage) return;
            const text = responseMessage.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("");
            if (!text.trim()) return;
            const { error } = await supabase.from("ai_messages").insert({
              conversation_id: conversationId!,
              role: "assistant",
              content: text,
              metadata: { model: "google/gemini-3-flash-preview" },
            });
            if (error) console.error("[ai/chat] persist assistant message failed", error);
          },
        });
      },
    },
  },
});
