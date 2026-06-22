import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { listConversations, deleteConversation } from "@/lib/ai-chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { Search, Trash2, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/ai/history")({
  component: AiHistoryPage,
});

function AiHistoryPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const qc = useQueryClient();
  const list = useServerFn(listConversations);
  const del = useServerFn(deleteConversation);
  const [q, setQ] = useState("");

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["ai-hub-history"],
    enabled: authed === true,
    queryFn: () => list({ data: { limit: 100 } }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-hub-history"] }),
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((c) => (c.title ?? "").toLowerCase().includes(needle));
  }, [conversations, q]);

  if (authed === false) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center p-6 rounded-lg border border-border bg-surface">
        <h2 className="font-display text-xl text-ink">Sign in to see history</h2>
        <Link to="/auth" className="mt-3 inline-flex px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <header>
        <h1 className="font-display text-2xl text-ink">Your conversations</h1>
        <p className="text-sm text-muted-foreground mt-1">Search, resume, or delete past chats.</p>
      </header>

      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title…"
          className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:border-primary/50"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-lg text-sm text-muted-foreground">
          {q ? "No conversations match your search." : "You haven't started any conversations yet."}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-surface hover:border-primary/40 transition-colors"
            >
              <Link to="/ai/chat" search={{ conversationId: c.id }} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-3.5 text-muted-foreground" />
                  <span className="text-sm text-ink truncate">{c.title || "Untitled"}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.context_type}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Updated {new Date(c.updated_at).toLocaleString()}
                </div>
              </Link>
              <button
                onClick={() => {
                  if (confirm("Delete this conversation?")) deleteMut.mutate(c.id);
                }}
                disabled={deleteMut.isPending}
                className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
