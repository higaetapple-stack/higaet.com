// Phase 7.1 — /assistant layout: conversation sidebar + Outlet.

import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listConversations,
  createConversation,
  deleteConversation,
} from "@/lib/ai-chat.functions";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assistant")({
  component: AssistantLayout,
});

function AssistantLayout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const list = useServerFn(listConversations);
  const create = useServerFn(createConversation);
  const del = useServerFn(deleteConversation);

  const { data: conversations = [] } = useQuery({
    queryKey: ["ai-conversations", "general"],
    queryFn: () => list({ data: { contextType: undefined } }),
  });

  const newMut = useMutation({
    mutationFn: () => create({ data: { contextType: "general", title: "New conversation" } }),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ["ai-conversations"] });
      navigate({ to: "/assistant/$conversationId", params: { conversationId: conv.id } });
    },
  });

  const activeId = (useParams({ strict: false }) as { conversationId?: string }).conversationId;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <aside className="w-64 border-r border-border bg-surface p-3 flex flex-col gap-2 overflow-y-auto">
        <Button onClick={() => newMut.mutate()} disabled={newMut.isPending} size="sm" className="w-full">
          <Plus className="size-4 mr-1" /> New chat
        </Button>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mt-3 mb-1 px-1">
          History
        </div>
        <ul className="space-y-1">
          {conversations.length === 0 && (
            <li className="text-xs text-muted-foreground px-1">No conversations yet.</li>
          )}
          {conversations.map((c) => {
            const active = c.id === activeId;
            return (
              <li key={c.id} className="group flex items-center gap-1">
                <Link
                  to="/assistant/$conversationId"
                  params={{ conversationId: c.id }}
                  className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded text-sm truncate ${
                    active ? "bg-primary/10 text-ink" : "text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <MessageCircle className="size-3.5 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </Link>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this conversation?")) return;
                    await del({ data: { id: c.id } });
                    qc.invalidateQueries({ queryKey: ["ai-conversations"] });
                    if (active) navigate({ to: "/assistant" });
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
