import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Activity, AlertTriangle, RefreshCw, PlayCircle, Database, Layers, Clock, TrendingUp } from "lucide-react";
import { getRagStats, drainEmbeddingsNow, requeueDeadLetters } from "@/lib/rag-observability.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/rag")({
  component: RagObservability,
});

function Stat({ label, value, hint, tone = "default" }: { label: string; value: string | number; hint?: string; tone?: "default" | "warn" | "danger" | "good" }) {
  const toneCls = {
    default: "text-ink",
    warn: "text-amber-600",
    danger: "text-red-600",
    good: "text-emerald-600",
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-medium ${toneCls}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function RagObservability() {
  const fetchStats = useServerFn(getRagStats);
  const drainFn = useServerFn(drainEmbeddingsNow);
  const requeueFn = useServerFn(requeueDeadLetters);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rag-stats"],
    queryFn: () => fetchStats(),
    refetchInterval: 15_000,
  });

  const drain = useMutation({ mutationFn: () => drainFn(), onSuccess: () => refetch() });
  const requeue = useMutation({ mutationFn: () => requeueFn(), onSuccess: () => refetch() });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink flex items-center gap-2">
            <Activity className="size-5 text-violet-500" /> RAG Observability
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Phase 7.2 · Embedding pipeline health, retrieval coverage, dead-letter visibility
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => drain.mutate()}
            disabled={drain.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <PlayCircle className="size-4" /> Drain now
          </button>
        </div>
      </header>

      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <section>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
              <Layers className="size-4" /> Queue
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Stat label="Pending" value={data.queue.pending} tone={data.queue.pending > 50 ? "warn" : "default"} />
              <Stat label="Processing" value={data.queue.processing} />
              <Stat label="Failed (retrying)" value={data.queue.failed} tone={data.queue.failed > 0 ? "warn" : "default"} />
              <Stat label="Dead-letter" value={data.queue.dead} tone={data.queue.dead > 0 ? "danger" : "good"} />
              <Stat label="Completed · 24h" value={data.queue.completed_24h} tone="good" />
            </div>
            {data.queue.dead > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => requeue.mutate()}
                  disabled={requeue.isPending}
                  className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                >
                  <AlertTriangle className="size-4" /> Requeue {data.queue.dead} dead-letter {data.queue.dead === 1 ? "item" : "items"}
                </button>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="size-4" /> Throughput & quality
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Embedded · last hour" value={data.throughput.last_hour} />
              <Stat label="Embedded · last 24h" value={data.throughput.last_24h} />
              <Stat
                label="Retry rate · 24h"
                value={`${Math.round(data.retry_rate_24h * 100)}%`}
                tone={data.retry_rate_24h > 0.25 ? "warn" : data.retry_rate_24h > 0.5 ? "danger" : "good"}
                hint="Failed attempts ÷ total attempts"
              />
              <Stat
                label="Avg latency · 24h"
                value={data.avg_latency_ms_24h != null ? `${(data.avg_latency_ms_24h / 1000).toFixed(1)}s` : "—"}
                hint="Created → embedded"
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
              <Database className="size-4" /> Coverage
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Stat label="Lesson documents" value={data.documents.lesson} />
              <Stat label="Thread documents" value={data.documents.thread} />
              <Stat
                label="Pending embedding"
                value={data.documents.pending_embedding}
                tone={data.documents.pending_embedding > 20 ? "warn" : "default"}
              />
              <Stat label="Chunks · total" value={data.chunks.total} />
              <Stat
                label="Avg chunks / doc"
                value={`${data.chunks.avg_per_lesson}L · ${data.chunks.avg_per_thread}T`}
                hint="lesson · thread"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                <AlertTriangle className="size-4 text-amber-500" /> Top failing documents
              </h3>
              {data.top_failing.length === 0 ? (
                <p className="text-sm text-muted-foreground">No failing items 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {data.top_failing.map((f) => (
                    <li key={f.document_id} className="text-sm border-b border-border pb-2 last:border-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-medium truncate">{f.title ?? f.document_id}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {f.entity_type} · {f.attempts} attempts
                        </span>
                      </div>
                      {f.last_error && (
                        <div className="text-xs text-red-600 mt-1 line-clamp-2">{f.last_error}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                <Clock className="size-4 text-emerald-500" /> Recently embedded
              </h3>
              {data.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No chunks embedded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recent.map((r, i) => (
                    <li key={i} className="text-sm border-b border-border pb-2 last:border-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="truncate">{r.title ?? "untitled"}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {r.entity_type} · {r.chunk_count}c
                        </span>
                      </div>
                      {r.embedded_at && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(r.embedded_at).toLocaleString()}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {drain.data && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Worker response: {drain.data.status} — {drain.data.body}
            </div>
          )}
        </>
      )}
    </div>
  );
}
