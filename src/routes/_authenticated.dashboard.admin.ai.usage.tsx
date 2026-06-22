import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getAiUsageMetrics } from "@/lib/ai-hub.functions";
import { MessageSquare, Activity, AlertTriangle, Zap, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/ai/usage")({
  component: AiUsageDashboard,
});

function AiUsageDashboard() {
  const [days, setDays] = useState(14);
  const fetch = useServerFn(getAiUsageMetrics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-usage-metrics", days],
    queryFn: () => fetch({ data: { days } }),
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">AI usage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conversations, retrieval health, and top prompts across HIGAET AI.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1.5 rounded-md border border-border bg-surface text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {error && <div className="text-sm text-destructive">{(error as Error).message}</div>}

      {data && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={MessageSquare} label="Conversations" value={data.totals.conversations} />
            <Stat icon={Activity} label="Messages" value={data.totals.messages} />
            <Stat
              icon={Target}
              label="Retrieval hit rate"
              value={
                data.totals.retrieval_hits + data.totals.retrieval_misses === 0
                  ? "—"
                  : `${Math.round(
                      (data.totals.retrieval_hits /
                        (data.totals.retrieval_hits + data.totals.retrieval_misses)) *
                        100,
                    )}%`
              }
            />
            <Stat icon={Zap} label="Avg latency" value={`${data.totals.avg_latency_ms} ms`} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Stat icon={Target} label="Retrieval hits" value={data.totals.retrieval_hits} />
            <Stat icon={AlertTriangle} label="Retrieval misses" value={data.totals.retrieval_misses} tone="warn" />
            <Stat icon={AlertTriangle} label="Failed generations" value={data.totals.failed_generations} tone="danger" />
          </div>

          <section className="p-5 rounded-xl border border-border bg-surface">
            <h2 className="text-sm font-medium text-ink mb-3">Volume by day</h2>
            <div className="overflow-x-auto">
              <table className="text-sm w-full">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left py-1.5">Day</th>
                    <th className="text-right py-1.5">Conversations</th>
                    <th className="text-right py-1.5">Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {data.series.map((s) => (
                    <tr key={s.day} className="border-t border-border">
                      <td className="py-1.5">{s.day}</td>
                      <td className="py-1.5 text-right">{s.conversations}</td>
                      <td className="py-1.5 text-right">{s.messages}</td>
                    </tr>
                  ))}
                  {data.series.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-muted-foreground">No activity in window.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid lg:grid-cols-3 gap-4">
            <RankCard title="Top prompts" rows={data.topPrompts.map((p) => ({ label: p.prompt, value: p.count }))} />
            <RankCard title="Most-queried lessons" rows={data.topLessons.map((l) => ({ label: l.id, value: l.count }))} />
            <RankCard title="Most-queried communities" rows={data.topCommunities.map((c) => ({ label: c.id, value: c.count }))} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: number | string;
  tone?: "warn" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "warn"
        ? "text-academy"
        : "text-primary";
  return (
    <div className="p-4 rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <Icon className={`size-4 ${toneClass}`} />
      </div>
      <div className="mt-2 font-display text-2xl text-ink">{value}</div>
    </div>
  );
}

function RankCard({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-surface">
      <h3 className="text-sm font-medium text-ink mb-3">{title}</h3>
      {rows.length === 0 ? (
        <div className="text-xs text-muted-foreground">No data.</div>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-4">{i + 1}.</span>
              <span className="flex-1 text-ink truncate">{r.label}</span>
              <span className="text-muted-foreground">{r.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
