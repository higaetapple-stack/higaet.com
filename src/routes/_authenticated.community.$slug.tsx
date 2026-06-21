import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  getCommunityBySlug,
  listThreads,
  joinCommunity,
  leaveCommunity,
  createThread,
} from "@/lib/community.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, ArrowLeft, Pin, Lock } from "lucide-react";
import type { CommunityRow, ThreadRow } from "@/lib/community/types";

export const Route = createFileRoute("/_authenticated/community/$slug")({
  component: CommunityDetail,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Community not found.</div>,
});

function CommunityDetail() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const get = useServerFn(getCommunityBySlug);
  const list = useServerFn(listThreads);
  const join = useServerFn(joinCommunity);
  const leave = useServerFn(leaveCommunity);
  const create = useServerFn(createThread);

  const { data, isLoading } = useQuery<{ community: CommunityRow; isMember: boolean }>({
    queryKey: ["community", slug],
    queryFn: () => get({ data: { slug } }) as Promise<{ community: CommunityRow; isMember: boolean }>,
  });
  const community = data?.community;
  const isMember = data?.isMember ?? false;

  const { data: threads = [] } = useQuery<ThreadRow[]>({
    queryKey: ["threads", community?.id],
    enabled: !!community,
    queryFn: () => list({ data: { communityId: community!.id } }) as Promise<ThreadRow[]>,
  });

  const joinMut = useMutation({
    mutationFn: () => join({ data: { communityId: community!.id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community", slug] }),
  });
  const leaveMut = useMutation({
    mutationFn: () => leave({ data: { communityId: community!.id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community", slug] }),
  });

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const createMut = useMutation({
    mutationFn: () => create({ data: { communityId: community!.id, title, body } }),
    onSuccess: (row: ThreadRow) => {
      setShowForm(false);
      setTitle("");
      setBody("");
      qc.invalidateQueries({ queryKey: ["threads", community!.id] });
      navigate({ to: "/community/$slug/$threadId", params: { slug, threadId: row.id } });
    },
  });

  if (isLoading || !community) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link to="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> All communities
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">{community.name}</h1>
          {community.description && (
            <p className="text-sm text-muted-foreground mt-1">{community.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" /> {community.member_count} members
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5" /> {community.thread_count} threads
            </span>
          </div>
        </div>
        {isMember ? (
          <Button variant="outline" onClick={() => leaveMut.mutate()} disabled={leaveMut.isPending}>
            Leave
          </Button>
        ) : (
          <Button onClick={() => joinMut.mutate()} disabled={joinMut.isPending}>
            Join community
          </Button>
        )}
      </header>

      {isMember && (
        <div className="border border-border rounded-lg p-4 bg-surface space-y-3">
          {!showForm ? (
            <Button variant="outline" onClick={() => setShowForm(true)}>
              Start a new thread
            </Button>
          ) : (
            <>
              <Input placeholder="Thread title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea
                placeholder="Share your question or idea…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createMut.mutate()}
                  disabled={title.trim().length < 3 || body.trim().length < 1 || createMut.isPending}
                >
                  Post thread
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <ul className="border border-border rounded-lg divide-y divide-border bg-surface overflow-hidden">
        {threads.map((t) => (
          <li key={t.id}>
            <Link
              to="/community/$slug/$threadId"
              params={{ slug, threadId: t.id }}
              className="block p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                {t.pinned && <Pin className="size-3.5 text-primary" />}
                {t.locked && <Lock className="size-3.5 text-muted-foreground" />}
                <h3 className="font-medium text-ink">{t.title}</h3>
                {t.lesson_id && (
                  <Badge variant="outline" className="text-[10px]">Lesson</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.body}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{t.author?.full_name ?? "Member"}</span>
                <span>·</span>
                <span>{t.reply_count} replies</span>
                <span>·</span>
                <span>{new Date(t.last_reply_at ?? t.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          </li>
        ))}
        {threads.length === 0 && (
          <li className="p-8 text-center text-sm text-muted-foreground">
            No threads yet. {isMember ? "Start the conversation." : "Join to start the conversation."}
          </li>
        )}
      </ul>
    </div>
  );
}
