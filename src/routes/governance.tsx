import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { runGovernor } from "@/lib/governor/governor";
import type { GovernorSignals } from "@/lib/governor/types";

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { title: "Governance — Conflict Resolver" },
      { name: "description", content: "B.52 multi-objective conflict resolution dashboard." },
    ],
  }),
  component: GovernancePage,
});

function GovernancePage() {
  const [signals, setSignals] = useState<GovernorSignals>({
    simulationScore: 0.5,
    strategy: "fast-path",
    risk: 0.7,
    executionUrgency: 0.8,
    memoryBias: 0.4,
    freshIntent: 0.5,
    agentDisagreement: 0.3,
  });

  const decision = useMemo(() => runGovernor(signals), [signals]);

  const slider = (key: keyof GovernorSignals, label: string) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono">{Number(signals[key] ?? 0).toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={Number(signals[key] ?? 0)}
        onChange={(e) =>
          setSignals((s) => ({ ...s, [key]: Number(e.target.value) }))
        }
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Governance — Conflict Resolver</h1>
        <p className="text-sm text-muted-foreground">
          B.52 advisory layer. Detects competing objectives, arbitrates trade-offs,
          and surfaces a dominant intent. Does not execute or override the kernel.
        </p>
      </header>

      <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
        {slider("simulationScore", "Simulation score")}
        {slider("risk", "Risk")}
        {slider("executionUrgency", "Execution urgency")}
        {slider("memoryBias", "Memory bias")}
        {slider("freshIntent", "Fresh intent")}
        {slider("agentDisagreement", "Agent disagreement")}
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span>Strategy</span>
          <select
            className="rounded border bg-background p-1"
            value={signals.strategy}
            onChange={(e) => setSignals((s) => ({ ...s, strategy: e.target.value }))}
          >
            <option value="fast-path">fast-path</option>
            <option value="deep-analysis">deep-analysis</option>
            <option value="precision-mode">precision-mode</option>
            <option value="exploration">exploration</option>
          </select>
        </label>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Final objective</h2>
        <div className="mt-2 flex items-baseline gap-4">
          <span className="text-3xl font-bold uppercase">{decision.finalObjective}</span>
          <span className="text-sm text-muted-foreground">
            confidence {decision.confidence.toFixed(2)} · {decision.conflictsResolved} conflict(s)
          </span>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Resolutions</h2>
        {decision.resolutions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active conflicts.</p>
        ) : (
          <ul className="mt-2 space-y-3 text-sm">
            {decision.resolutions.map((r, i) => (
              <li key={i} className="rounded border p-3">
                <div>
                  Winner: <span className="font-semibold">{r.winner.name}</span>{" "}
                  <span className="text-muted-foreground">
                    (w {r.winner.weight} × v {r.winner.value} = {r.resolutionConfidence.toFixed(2)})
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Discarded: {r.discarded.map((d) => d.name).join(", ") || "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="text-xs text-muted-foreground">
        B.52 is advisory only. Execution still flows through B.50 kernel and B.41 governance gates.
      </footer>
    </div>
  );
}
