import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { buildSystemSnapshot } from "@/lib/observability/snapshot";
import { aggregateHealth } from "@/lib/observability/aggregator";
import type { AgentHealth } from "@/lib/observability/types";

export const Route = createFileRoute("/system-dashboard")({
  head: () => ({
    meta: [
      { title: "System Health Dashboard — HIGAET" },
      { name: "description", content: "Read-only observability for the HIGAET AI orchestration stack (B.47)." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SystemDashboard,
});

function Bar({ value, warn }: { value: number; warn?: boolean }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-40 overflow-hidden rounded bg-muted">
        <div
          className={`h-full ${warn ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums">{pct}%</span>
    </div>
  );
}

function AgentRow({ a }: { a: AgentHealth }) {
  const warn = a.successRate < 0.75;
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="w-28 font-medium capitalize">{a.role}</span>
      <Bar value={a.successRate} warn={warn} />
      <span className="font-mono text-xs text-muted-foreground">
        rej {Math.round(a.rejectionRate * 100)}% · {a.avgLatency}ms
      </span>
      {warn && <span className="text-amber-600">⚠</span>}
    </div>
  );
}

function SystemDashboard() {
  const { snapshot, aggregate } = useMemo(() => {
    const s = buildSystemSnapshot();
    return { snapshot: s, aggregate: aggregateHealth(s) };
  }, []);

  const stabilityPct = Math.round(aggregate.systemStability * 100);
  const maxFriction = Math.max(1, ...Object.values(snapshot.friction));
  const totalStrategy = Math.max(
    1,
    Object.values(snapshot.strategyDistribution).reduce((a, b) => a + b, 0),
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">System Health Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          B.47 — Read-only observability. Does not influence execution.
        </p>
      </header>

      <section className="mb-8 rounded-lg border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            System Stability
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            dominant: {aggregate.dominantStrategy ?? "—"}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="text-5xl font-semibold tabular-nums">{stabilityPct}%</div>
          <Bar value={aggregate.systemStability} warn={stabilityPct < 70} />
        </div>
      </section>

      <section className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Agent Performance
        </h2>
        <div className="divide-y">
          {snapshot.agentHealth.map((a) => (
            <AgentRow key={a.role} a={a} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Friction Heatmap
          </h2>
          <div className="space-y-2">
            {aggregate.bottlenecks.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm">{key}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${(value / maxFriction) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-xs tabular-nums">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Strategy Distribution
          </h2>
          <div className="space-y-2">
            {Object.entries(snapshot.strategyDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{key}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full bg-sky-500"
                        style={{ width: `${(value / totalStrategy) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-xs tabular-nums">{value}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Memory Load
        </h2>
        <Bar value={snapshot.memoryLoad} warn={snapshot.memoryLoad > 0.8} />
      </section>

      <footer className="mt-8 text-xs text-muted-foreground">
        Snapshot at {new Date(snapshot.timestamp).toLocaleString()} · B.10 governed · read-only
      </footer>
    </div>
  );
}
