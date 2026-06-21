import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCommunities, listMyCommunities } from "@/lib/community.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Calendar } from "lucide-react";
import type { CommunityRow } from "@/lib/community/types";

export const Route = createFileRoute("/_authenticated/community")({
  component: CommunityIndex,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

function CommunityIndex() {
  const list = useServerFn(listCommunities);
  const mine = useServerFn(listMyCommunities);
  const { data: all = [] } = useQuery<CommunityRow[]>({
    queryKey: ["communities", "all"],
    queryFn: () => list() as Promise<CommunityRow[]>,
  });
  const { data: joined = [] } = useQuery<CommunityRow[]>({
    queryKey: ["communities", "mine"],
    queryFn: () => mine() as Promise<CommunityRow[]>,
  });
  const joinedIds = new Set(joined.map((c) => c.id));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">Community</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discussions, lesson Q&amp;A, and events across the HIGAET ecosystem.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/community/events">
            <Calendar className="size-4 mr-2" /> Events
          </Link>
        </Button>
      </header>

      {joined.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">My communities</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {joined.map((c) => (
              <CommunityCard key={c.id} c={c} joined />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">All communities</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((c) => (
            <CommunityCard key={c.id} c={c} joined={joinedIds.has(c.id)} />
          ))}
          {all.length === 0 && (
            <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-8 col-span-full text-center">
              No communities yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CommunityCard({ c, joined }: { c: CommunityRow; joined: boolean }) {
  return (
    <Link
      to="/community/$slug"
      params={{ slug: c.slug }}
      className="block border border-border rounded-lg p-4 bg-surface hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">{c.name}</h3>
        {joined && <Badge variant="secondary" className="text-[10px]">Joined</Badge>}
      </div>
      {c.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.description}</p>}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" /> {c.member_count}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-3.5" /> {c.thread_count}
        </span>
      </div>
    </Link>
  );
}
