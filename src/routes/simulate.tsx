import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { runSimulation } from "@/lib/simulation/engine";
import { simulateAgents } from "@/lib/simulation/agents";
import { aggregateSimulation } from "@/lib/simulation/aggregator";

export const Route = createFileRoute("/simulate")({
  head: () => ({
    meta: [
      { title: "Simulation Sandbox — HIGAET" },
      { name: "description", content: "B.49 what-if execution sandbox. No real execution." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SimulatePage,
});

function SimulatePage() {
  const [goal, setGoal] = useState("");
  const [complexity, setComplexity] = useState(0.5);
  const [risk, setRisk] = useState(0.2);
  const [submitted, setSubmitted] = useState("");

  const data = useMemo(() => {
    if (!submitted) return null;
    const result = runSimulation({ goal: submitted, complexity, riskLevel: risk });
    const agents = simulateAgents(submitted);
    const summary = aggregateSimulation(result, agents);
    return { result, agents, summary };
  }, [submitted, complexity, risk]);

  const successPct = data ? Math.round(data.summary.overallSuccessProbability * 100) : 0;
  const riskColor =
    data?.summary.riskLevel === "low"
      ? "bg-emerald-500"
      : data?.summary.riskLevel === "medium"
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Simulation Sandbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          B.49 — Counterfactual modeling. Does not execute, mutate memory, or trigger workflows.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(goal.trim());
        }}
        className="mb-8 space-y-4 rounded-lg border bg-card p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">What if we ran…</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. deep analysis of enrollment funnel"
            className="w-full rounded border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Complexity: <span className="font-mono">{complexity.toFixed(2)}</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={complexity}
              onChange={(e) => setComplexity(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <label className="text-sm">
            Risk: <span className="font-mono">{risk.toFixed(2)}</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={risk}
              onChange={(e) => setRisk(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!goal.trim()}
          className="rounded bg-ink px-4 py-2 text-sm font-medium text-surface disabled:opacity-50"
        >
          Simulate
        </button>
      </form>

      {data && (
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Outcome Forecast
              </h2>
              <span className={`rounded px-2 py-0.5 text-xs text-white ${riskColor}`}>
                {data.summary.riskLevel} risk
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-5xl font-semibold tabular-nums">{successPct}%</div>
              <div className="text-sm text-muted-foreground">
                Strategy: <span className="font-mono">{data.result.strategyUsed}</span><br />
                Est. latency: {data.result.estimatedLatency}ms · Blocked steps: {data.result.blockedSteps}
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Agent Outcomes
            </h2>
            <div className="divide-y">
              {data.agents.map((a) => (
                <div key={a.role} className="flex items-center justify-between py-2">
                  <span className="w-28 font-medium capitalize">{a.role}</span>
                  <span className="text-sm text-muted-foreground">{a.outcome}</span>
                  <span className="font-mono text-xs">{Math.round(a.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <button
              disabled
              title="Real execution requires explicit B.40/B.41 approval — disabled in sandbox."
              className="rounded bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
            >
              Execute for real (disabled)
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              {data.summary.recommendedRun
                ? "Simulation recommends running. Approval gate still required."
                : "Simulation does NOT recommend running this configuration."}
            </p>
          </section>
        </div>
      )}

      <footer className="mt-8 text-xs text-muted-foreground">
        B.10 governed · sandbox-only · no real execution
      </footer>
    </div>
  );
}
