// Phase 2B — Lesson Discussion embed.
// Renders a lesson-scoped thread list with inline create + per-thread links.
// Requires a host communityId (e.g. the course's community) to anchor threads.

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { listThreads, createThread } from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus } from "lucide-react";
import type { ThreadRow } from "@/lib/community/types";

interface Props {
  lessonId: string;
  communityId: string;
  communitySlug: string;
}

export function LessonDiscussion({ lessonId, communityId, communitySlug }: Props) {
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);

  const queryKey = ["lesson-threads", lessonId];
  const { data: threads = [], isLoading } = useQuery<ThreadRow[]>({
    queryKey,
    queryFn: () => list({ data: { lessonId } }) as Promise<ThreadRow[]>,
  });

  // Realtime: new threads attached to this lesson
  useEffect(() => {
    const ch = supabase
      .channel(`lesson-threads:${lessonId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "threads", filter: `lesson_id=eq.${lessonId}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      create({ data: { communityId, lessonId, title: title.trim(), body: body.trim() } }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      setOpen(false);
      qc.invalidateQueries({ queryKey });
    },
  });

  return (
    <section className="border border-border rounded-lg bg-surface">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <h3 className="text-sm font-medium text-ink">Lesson discussion</h3>
          <span className="text-xs text-muted-foreground">({threads.length})</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          <Plus className="size-4 mr-1" /> New
        </Button>
      </header>

      {open && (
        <div className="p-4 border-b border-border space-y-2">
          <Input
            placeholder="Question or topic"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          <Textarea
            placeholder="Add details, code snippets, or context…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={10000}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMut.mutate()}
              disabled={title.trim().length < 3 || body.trim().length < 1 || createMut.isPending}
            >
              Post
            </Button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-border">
        {isLoading && (
          <li className="p-4 text-sm text-muted-foreground">Loading discussion…</li>
        )}
        {!isLoading && threads.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">
            No discussion yet. Be the first to ask a question.
          </li>
        )}
        {threads.map((t) => (
          <li key={t.id} className="p-4 hover:bg-muted/30 transition-colors">
            <Link
              to="/community/$slug/$threadId"
              params={{ slug: communitySlug, threadId: t.id }}
              className="block"
            >
              <div className="text-sm font-medium text-ink line-clamp-1">{t.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {t.author?.full_name ?? "Member"} · {t.reply_count} replies ·{" "}
                {new Date(t.created_at).toLocaleDateString()}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
