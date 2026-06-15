import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { evaluateConstitution } from "@/lib/constitution/evaluator";
import { CONSTITUTION } from "@/lib/constitution/rules";
import type { ConstitutionContext } from "@/lib/constitution/types";

export const Route = createFileRoute("/constitution")({
  head: () => ({
    meta: [
      { title: "Constitution — AI Policy Layer" },
      { name: "description", content: "B.53 constitution monitor and rule evaluator." },
    ],
  }),
  component: ConstitutionPage,
});

function ConstitutionPage() {
  const [ctx, setCtx] = useState<ConstitutionContext>({
    risk: 0.4,
    confidence: 0.7,
    friction: 0.3,
    simulationScore: 0.7,
    urgency: 0.4,
  });

  const evaluation = useMemo(() => evaluateConstitution(ctx), [ctx]);

  const slider = (key: keyof ConstitutionContext, label: string) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono">{Number(ctx[key] ?? 0).toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={Number(ctx[key] ?? 0)}
        onChange={(e) => setCtx((c) => ({ ...c, [key]: Number(e.target.value) }))}
      />
    </label>
  );

  const posture = !evaluation.allowed
    ? { label: "BLOCKED", tone: "text-destructive" }
    : evaluation.severity > 0
      ? { label: "DOWNGRADED", tone: "text-yellow-600" }
      : { label: "STABLE", tone: "text-green-600" };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Constitution — AI Policy Layer</h1>
        <p className="text-sm text-muted-foreground">
          B.53 evaluates rules before kernel approval. Read-only governance —
          never executes or mutates state.
        </p>
      </header>

      <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
        {slider("risk", "Risk")}
        {slider("confidence", "Confidence")}
        {slider("friction", "Friction")}
        {slider("simulationScore", "Simulation score")}
        {slider("urgency", "Urgency")}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">System posture</h2>
        <div className="mt-2 flex items-baseline gap-4">
          <span className={`text-3xl font-bold ${posture.tone}`}>{posture.label}</span>
          <span className="text-sm text-muted-foreground">
            {evaluation.severity} active constraint(s) ·{" "}
            {evaluation.allowed ? "execution allowed" : "execution blocked"}
          </span>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Triggered constraints</h2>
        {evaluation.violations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No violations.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {evaluation.violations.map((v) => (
              <li key={v.id} className="rounded border p-3">
                <div className="font-medium">{v.name}</div>
                <div className="text-muted-foreground">
                  {v.category} · priority {v.priority} ·{" "}
                  <span className="uppercase">{v.action}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Active rule set</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {CONSTITUTION.map((r) => (
            <li key={r.id} className="flex justify-between gap-4">
              <span>{r.name}</span>
              <span className="text-muted-foreground">
                {r.category} · {r.action}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-xs text-muted-foreground">
        B.53 runs before B.50 kernel approval. Rules are deterministic and explainable;
        execution still flows through B.41 governance gates.
      </footer>
    </div>
  );
}
