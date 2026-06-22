import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  createConversation,
  getConversation,
  listConversations,
} from "@/lib/ai-chat.functions";
import { ChatWindow } from "@/components/ai/ChatWindow";
import { supabase } from "@/integrations/supabase/client";
import { Plus, MessageSquare } from "lucide-react";
import { getStarterPrompt } from "@/content/ai-prompts";

const searchSchema = z.object({
  conversationId: z.string().uuid().optional(),
  prompt: z.string().optional(),
});

export const Route = createFileRoute("/ai/chat")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AiChatPage,
});

function AiChatPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const list = useServerFn(listConversations);
  const create = useServerFn(createConversation);
  const load = useServerFn(getConversation);

  const { data: conversations = [] } = useQuery({
    queryKey: ["ai-hub-conversations"],
    enabled: authed === true,
    queryFn: () => list({ data: { limit: 30 } }),
  });

  const createMut = useMutation({
    mutationFn: () => create({ data: { contextType: "general", title: "New conversation" } }),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ["ai-hub-conversations"] });
      navigate({ to: "/ai/chat", search: { conversationId: conv.id } });
    },
  });

  // Auto-create on first visit if no conversation selected
  useEffect(() => {
    if (authed !== true) return;
    if (search.conversationId) return;
    if (createMut.isPending) return;
    if (conversations.length > 0) {
      navigate({ to: "/ai/chat", search: { conversationId: conversations[0].id, prompt: search.prompt } });
    } else {
      createMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, conversations.length, search.conversationId]);

  const { data: full } = useQuery({
    queryKey: ["ai-conversation", search.conversationId],
    enabled: !!search.conversationId && authed === true,
    queryFn: () => load({ data: { id: search.conversationId! } }),
  });

  // If launched with ?prompt=id and conversation is empty, surface the prompt text
  const starter = search.prompt ? getStarterPrompt(search.prompt) : undefined;
  const seedText = starter && full && full.messages.length === 0 ? starter.prompt : undefined;

  if (authed === false) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center p-6 rounded-lg border border-border bg-surface">
        <h2 className="font-display text-xl text-ink">Sign in to chat</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your conversations are saved to your HIGAET account so you can resume any time.
        </p>
        <Link
          to="/auth"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4 h-[calc(100vh-9rem)]">
      <aside className="border border-border rounded-lg bg-surface p-3 overflow-y-auto">
        <button
          onClick={() => createMut.mutate()}
          disabled={createMut.isPending}
          className="w-full mb-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          <Plus className="size-3.5" /> New chat
        </button>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 mb-1">Recent</div>
        <ul className="space-y-0.5">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                to="/ai/chat"
                search={{ conversationId: c.id }}
                className={`block px-2 py-1.5 rounded-md text-sm truncate ${
                  c.id === search.conversationId
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-ink"
                }`}
              >
                <MessageSquare className="size-3 inline mr-1.5 opacity-60" />
                {c.title || "Untitled"}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <section className="min-w-0">
        {full ? (
          <>
            {seedText && (
              <div className="mb-3 p-3 rounded-md border border-primary/30 bg-primary/5 text-sm text-ink">
                <strong>{starter?.title}:</strong> copy or edit the prompt below to start.
                <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{seedText}</pre>
              </div>
            )}
            <ChatWindow
              conversationId={full.conversation.id}
              contextType={full.conversation.context_type}
              contextId={full.conversation.context_id}
              initialMessages={full.messages}
              placeholder={starter ? starter.title : "Ask the HIGAET Assistant…"}
            />
          </>
        ) : (
          <div className="h-full grid place-items-center text-sm text-muted-foreground border border-border rounded-lg">
            Loading…
          </div>
        )}
      </section>
    </div>
  );
}
