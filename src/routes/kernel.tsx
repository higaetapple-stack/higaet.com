import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { runKernel } from "@/lib/kernel/engine";

export const Route = createFileRoute("/kernel")({
  head: () => ({
    meta: [
      { title: "System Kernel — HIGAET" },
      { name: "description", content: "B.50 consolidation kernel — unified AI decision view." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: KernelPage,
});

function Bar({ value, color = "bg-sky-500" }: { value: number; color?: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-40 overflow-hidden rounded bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right font-mono text-xs tabular-nums">{pct}%</span>
    </div>
  );
}

function KernelPage() {
  const [strategy, setStrategy] = useState(0.8);
  const [simulation, setSimulation] = useState(0.75);
  const [history, setHistory] = useState(0.82);
  const [risk, setRisk] = useState(0.3);
  const [friction, setFriction] = useState(0.2);

  const decision = useMemo(
    () =>
      runKernel({
        strategyScore: strategy,
        simulationScore: simulation,
        historicalSuccessRate: history,
        risk,
        frictionIndex: friction,
      }),
    [strategy, simulation, history, risk, friction],
  );

  const actionColor =
    decision.action === "execute"
      ? "bg-emerald-500"
      : decision.action === "simulate-more"
        ? "bg-amber-500"
        : "bg-rose-500";

  const Slider = ({
    label, value, set,
  }: { label: string; value: number; set: (n: number) => void }) => (
    <label className="block text-sm">
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono text-xs">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.05}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-1 w-full"
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">System Kernel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          B.50 — Aggregates signals from B.45/B.47/B.48/B.49. Decision-layer only.
        </p>
      </header>

      <section className="mb-6 rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Decision
          </h2>
          <span className={`rounded px-3 py-1 text-sm font-semibold text-white ${actionColor}`}>
            {decision.action.toUpperCase()}
          </span>
        </div>
        <p className="mt-3 text-sm">{decision.reason}</p>
        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Confidence</span>
            <Bar value={decision.signals.confidence} color="bg-emerald-500" />
          </div>
          <div className="flex items-center justify-between">
            <span>Risk</span>
            <Bar value={decision.signals.risk} color="bg-rose-500" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Signal Inputs
          </h2>
          <div className="space-y-3">
            <Slider label="Strategy score (B.45)" value={strategy} set={setStrategy} />
            <Slider label="Simulation score (B.49)" value={simulation} set={setSimulation} />
            <Slider label="Historical success (B.48)" value={history} set={setHistory} />
            <Slider label="Risk" value={risk} set={setRisk} />
            <Slider label="Friction (B.47)" value={friction} set={setFriction} />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Signal Breakdown
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Strategy</span><Bar value={strategy} />
            </div>
            <div className="flex items-center justify-between">
              <span>Simulation</span><Bar value={simulation} />
            </div>
            <div className="flex items-center justify-between">
              <span>History</span><Bar value={history} />
            </div>
            <div className="flex items-center justify-between">
              <span>Friction</span><Bar value={friction} color="bg-amber-500" />
            </div>
          </div>
          <pre className="mt-4 overflow-x-auto rounded bg-muted p-3 text-xs">
{JSON.stringify(decision.signals, null, 2)}
          </pre>
        </section>
      </div>

      <footer className="mt-8 text-xs text-muted-foreground">
        B.10 governed · decision-only · execution still requires B.40/B.41 approval
      </footer>
    </div>
  );
}
