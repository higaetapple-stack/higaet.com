import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCollectionDetail } from "@/lib/ai-hub.functions";
import { ArrowLeft, FileText } from "lucide-react";

export const Route = createFileRoute("/ai/collections/$slug")({
  component: CollectionDetail,
});

function CollectionDetail() {
  const { slug } = Route.useParams();
  const fetch = useServerFn(getCollectionDetail);
  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-collection", slug],
    queryFn: () => fetch({ data: { slug } }),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (error) return <div className="text-sm text-destructive">{(error as Error).message}</div>;
  if (!data) return null;

  const { collection, documents } = data;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/ai/collections" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-3.5" /> All collections
      </Link>

      <header>
        <h1 className="font-display text-2xl text-ink">{collection.name}</h1>
        {collection.description && (
          <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>
        )}
      </header>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Recent documents</h2>
        {documents.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded-lg text-sm text-muted-foreground">
            No documents indexed in this collection yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {documents.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-surface"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-ink truncate">{d.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.entity_type}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(d.updated_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
