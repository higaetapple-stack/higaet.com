import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  getThread,
  listReplies,
  createReply,
  toggleReaction,
  listReactions,
  checkIsAdmin,
  setThreadHidden,
  setThreadLocked,
  setThreadPinned,
  softDeleteThread,
  softDeleteReply,
} from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, Pin, EyeOff, Trash2 } from "lucide-react";
import type { ThreadRow, ReplyRow, ReactionRow } from "@/lib/community/types";

export const Route = createFileRoute("/_authenticated/community/$slug/$threadId")({
  component: ThreadView,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Thread not found.</div>,
});

const EMOJIS = ["👍", "❤️", "🎉", "🤔", "👏"];

function ThreadView() {
  const { slug, threadId } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(getThread);
  const list = useServerFn(listReplies);
  const reply = useServerFn(createReply);
  const react = useServerFn(toggleReaction);
  const reactionsFn = useServerFn(listReactions);
  const isAdminFn = useServerFn(checkIsAdmin);
  const hideFn = useServerFn(setThreadHidden);
  const lockFn = useServerFn(setThreadLocked);
  const pinFn = useServerFn(setThreadPinned);
  const deleteThreadFn = useServerFn(softDeleteThread);
  const deleteReplyFn = useServerFn(softDeleteReply);

  const { data: thread } = useQuery<ThreadRow>({
    queryKey: ["thread", threadId],
    queryFn: () => get({ data: { id: threadId } }) as Promise<ThreadRow>,
  });
  const { data: adminCheck } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => isAdminFn(),
    staleTime: 60_000,
  });
  const isAdmin = !!adminCheck?.isAdmin;
  const { data: replies = [] } = useQuery<ReplyRow[]>({
    queryKey: ["replies", threadId],
    queryFn: () => list({ data: { threadId } }) as Promise<ReplyRow[]>,
  });

  const targetIds = [threadId, ...replies.map((r) => r.id)];
  const { data: threadReactions = [] } = useQuery<ReactionRow[]>({
    queryKey: ["reactions", "thread", threadId],
    queryFn: () => reactionsFn({ data: { targetType: "thread", targetIds: [threadId] } }) as Promise<ReactionRow[]>,
  });
  const { data: replyReactions = [] } = useQuery<ReactionRow[]>({
    queryKey: ["reactions", "replies", threadId, replies.length],
    enabled: replies.length > 0,
    queryFn: () =>
      reactionsFn({ data: { targetType: "reply", targetIds: replies.map((r) => r.id) } }) as Promise<ReactionRow[]>,
  });

  // Realtime: refetch replies on new reply or reaction change
  useEffect(() => {
    const ch = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "replies", filter: `thread_id=eq.${threadId}` },
        () => qc.invalidateQueries({ queryKey: ["replies", threadId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions" },
        () => {
          qc.invalidateQueries({ queryKey: ["reactions", "thread", threadId] });
          qc.invalidateQueries({ queryKey: ["reactions", "replies", threadId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [threadId, qc]);

  const [body, setBody] = useState("");
  const replyMut = useMutation({
    mutationFn: () => reply({ data: { threadId, body } }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["replies", threadId] });
    },
  });
  const reactMut = useMutation({
    mutationFn: (v: { targetType: "thread" | "reply"; targetId: string; emoji: string }) =>
      react({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reactions", "thread", threadId] });
      qc.invalidateQueries({ queryKey: ["reactions", "replies", threadId] });
    },
  });

  if (!thread) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Link to="/community/$slug" params={{ slug }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <article className="border border-border rounded-lg p-5 bg-surface space-y-3">
        <div className="flex items-center gap-2">
          {thread.pinned && <Pin className="size-4 text-primary" />}
          {thread.locked && <Lock className="size-4 text-muted-foreground" />}
          <h1 className="text-xl font-display font-semibold text-ink">{thread.title}</h1>
          {thread.lesson_id && <Badge variant="outline" className="text-[10px]">Lesson</Badge>}
        </div>
        <div className="text-xs text-muted-foreground">
          {thread.author?.full_name ?? "Member"} · {new Date(thread.created_at).toLocaleString()}
        </div>
        <p className="text-sm text-ink whitespace-pre-wrap">{thread.body}</p>
        <ReactionBar
          reactions={threadReactions}
          onToggle={(emoji) => reactMut.mutate({ targetType: "thread", targetId: thread.id, emoji })}
        />
        {isAdmin && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border mt-3">
            <Button size="sm" variant="outline" onClick={async () => { await pinFn({ data: { id: thread.id, pinned: !thread.pinned } }); qc.invalidateQueries({ queryKey: ["thread", threadId] }); }}>
              <Pin className="size-3.5 mr-1" /> {thread.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button size="sm" variant="outline" onClick={async () => { await lockFn({ data: { id: thread.id, locked: !thread.locked } }); qc.invalidateQueries({ queryKey: ["thread", threadId] }); }}>
              <Lock className="size-3.5 mr-1" /> {thread.locked ? "Unlock" : "Lock"}
            </Button>
            <Button size="sm" variant="outline" onClick={async () => { await hideFn({ data: { id: thread.id, hidden: !thread.is_hidden } }); qc.invalidateQueries({ queryKey: ["thread", threadId] }); }}>
              <EyeOff className="size-3.5 mr-1" /> {thread.is_hidden ? "Unhide" : "Hide"}
            </Button>
            <Button size="sm" variant="destructive" onClick={async () => { if (!confirm("Delete this thread?")) return; await deleteThreadFn({ data: { id: thread.id } }); qc.invalidateQueries({ queryKey: ["thread", threadId] }); }}>
              <Trash2 className="size-3.5 mr-1" /> Delete
            </Button>
          </div>
        )}
      </article>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </h2>
        <ul className="space-y-3">
          {replies.map((r) => (
            <li key={r.id} className="border border-border rounded-lg p-4 bg-surface">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-muted-foreground">
                  {r.author?.full_name ?? "Member"} · {new Date(r.created_at).toLocaleString()}
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm("Delete this reply?")) return;
                      await deleteReplyFn({ data: { id: r.id } });
                      qc.invalidateQueries({ queryKey: ["replies", threadId] });
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap">{r.body}</p>
              <ReactionBar
                reactions={replyReactions.filter((rx) => rx.target_id === r.id)}
                onToggle={(emoji) => reactMut.mutate({ targetType: "reply", targetId: r.id, emoji })}
              />
            </li>
          ))}
        </ul>
      </section>

      {!thread.locked && (
        <div className="border border-border rounded-lg p-4 bg-surface space-y-3">
          <Textarea placeholder="Write a reply…" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          <div className="flex justify-end">
            <Button onClick={() => replyMut.mutate()} disabled={body.trim().length < 1 || replyMut.isPending}>
              Post reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReactionBar({
  reactions,
  onToggle,
}: {
  reactions: ReactionRow[];
  onToggle: (emoji: string) => void;
}) {
  const counts = new Map<string, number>();
  for (const r of reactions) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2">
      {EMOJIS.map((e) => {
        const n = counts.get(e) ?? 0;
        return (
          <button
            key={e}
            onClick={() => onToggle(e)}
            className="text-xs px-2 py-1 rounded-full border border-border bg-background hover:bg-muted/40 transition-colors"
            aria-label={`React ${e}`}
          >
            <span>{e}</span>
            {n > 0 && <span className="ml-1 text-muted-foreground">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}
