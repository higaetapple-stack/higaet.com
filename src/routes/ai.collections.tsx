import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCollectionsHealth } from "@/lib/ai-hub.functions";
import { Database, AlertCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/ai/collections")({
  component: CollectionsLayout,
});

function CollectionsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/ai/collections" && pathname !== "/ai/collections/") return <Outlet />;
  return <CollectionsIndex />;
}

function CollectionsIndex() {
  const fetch = useServerFn(getCollectionsHealth);
  const { data: collections = [], isLoading, error } = useQuery({
    queryKey: ["ai-collections-health"],
    queryFn: () => fetch(),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-ink">Knowledge collections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The curated bodies of HIGAET knowledge that ground the AI Assistant.
        </p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {error && <div className="text-sm text-destructive">{(error as Error).message}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {collections.map((c) => {
          const healthy = c.failed_embeddings === 0 && c.pending_embeddings < 50;
          return (
            <Link
              key={c.id}
              to="/ai/collections/$slug"
              params={{ slug: c.slug }}
              className="p-5 rounded-xl border border-border bg-surface hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center">
                    <Database className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-medium text-ink">{c.name}</h3>
                    <div className="text-xs text-muted-foreground">/{c.slug}</div>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${
                    healthy ? "bg-academy/10 text-academy" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {healthy ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                  {healthy ? "Healthy" : "Attention"}
                </span>
              </div>
              {c.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              )}
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Documents</dt>
                  <dd className="text-ink font-medium">{c.documents.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Chunks</dt>
                  <dd className="text-ink font-medium">{c.chunks.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Pending</dt>
                  <dd className="text-ink font-medium">{c.pending_embeddings.toLocaleString()}</dd>
                </div>
              </dl>
              <div className="mt-3 text-xs text-muted-foreground">
                Last indexed:{" "}
                {c.last_indexed_at ? new Date(c.last_indexed_at).toLocaleString() : "—"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
