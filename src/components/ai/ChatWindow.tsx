// Shared chat surface used by AiTutor + /assistant.
// Hydrates with persisted messages from the DB, streams new replies via /api/chat.

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import type { AiMessageRow } from "@/lib/ai-chat.functions";

interface Props {
  conversationId: string;
  contextType: "lesson" | "community" | "general";
  contextId?: string | null;
  initialMessages?: AiMessageRow[];
  placeholder?: string;
  compact?: boolean;
}

function rowsToUIMessages(rows: AiMessageRow[]): UIMessage[] {
  return rows
    .filter((r) => r.role !== "system")
    .map((r) => ({
      id: r.id,
      role: r.role as "user" | "assistant",
      parts: [{ type: "text", text: r.content }],
    }));
}

export function ChatWindow({
  conversationId,
  contextType,
  contextId,
  initialMessages,
  placeholder = "Ask anything…",
  compact = false,
}: Props) {
  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: async ({ messages, body }) => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        return {
          headers,
          body: {
            messages,
            data: { conversationId, contextType, contextId },
            ...(body ?? {}),
          },
        };
      },
    }),
  ).current;

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: initialMessages ? rowsToUIMessages(initialMessages) : [],
    transport,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId, status]);

  const busy = status === "submitted" || status === "streaming";

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  };

  return (
    <div className={`flex flex-col ${compact ? "h-[480px]" : "h-[calc(100vh-12rem)]"} border border-border rounded-lg bg-surface`}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="size-4" /> {placeholder}
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-ink border border-border"
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{text}</p>
                ) : (
                  <div className="prose prose-sm max-w-none prose-pre:bg-background prose-pre:border prose-pre:border-border">
                    <ReactMarkdown>{text || "…"}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {status === "submitted" && (
          <div className="text-xs text-muted-foreground">Thinking…</div>
        )}
        {error && (
          <div className="text-xs text-destructive">
            {error.message || "Something went wrong. Try again."}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 flex items-end gap-2">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="resize-none min-h-[40px] max-h-[160px]"
        />
        <Button onClick={() => void send()} disabled={busy || input.trim().length === 0} size="sm">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
