import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { evaluateConstitution } from "@/lib/constitution/evaluator";
import { generateAmendments } from "@/lib/constitution/generator";
import { scoreAmendments } from "@/lib/constitution/scorer";
import { detectConstitutionDrift } from "@/lib/constitution/drift";
import type { ConstitutionContext } from "@/lib/constitution/types";
import type { AmendmentStatus } from "@/lib/constitution/amendments";

export const Route = createFileRoute("/constitution-amendments")({
  head: () => ({
    meta: [
      { title: "Constitution Amendments — Evolution Layer" },
      { name: "description", content: "B.54 self-amending constitution proposals (advisory only)." },
    ],
  }),
  component: AmendmentsPage,
});

function AmendmentsPage() {
  const [ctx, setCtx] = useState<ConstitutionContext>({
    risk: 0.8,
    confidence: 0.5,
    friction: 0.6,
    simulationScore: 0.5,
    urgency: 0.7,
  });
  const [decisions, setDecisions] = useState<Record<string, AmendmentStatus>>({});

  const { amendments, drift } = useMemo(() => {
    const evalResult = evaluateConstitution(ctx);
    const ranked = scoreAmendments(generateAmendments(evalResult.violations));
    const d = detectConstitutionDrift({
      violations: evalResult.severity,
      totalExecutions: 10,
      overBlockedRules: evalResult.violations
        .filter((v) => v.action === "block")
        .map((v) => v.id),
    });
    return { amendments: ranked, drift: d };
  }, [ctx]);

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Constitution Amendments</h1>
        <p className="text-sm text-muted-foreground">
          B.54 proposes constitutional changes based on violations. Suggestions only —
          never auto-applied, never bypasses B.53 enforcement.
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
        <h2 className="text-lg font-semibold">Drift analysis</h2>
        <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Instability index</div>
            <div className="font-mono text-lg">{drift.instabilityIndex.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Over-strict rules</div>
            <div className="font-mono">{drift.overStrictRules.join(", ") || "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Under-enforced rules</div>
            <div className="font-mono">{drift.underEnforcedRules.join(", ") || "—"}</div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Proposed amendments</h2>
        {amendments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No amendments proposed.</p>
        ) : (
          <ul className="mt-2 space-y-3 text-sm">
            {amendments.map((a) => {
              const status = decisions[a.id] ?? a.status;
              return (
                <li key={a.id} className="rounded border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold uppercase">{a.type}</span>
                      {a.targetRuleId && (
                        <span className="ml-2 text-muted-foreground">
                          target: <code>{a.targetRuleId}</code>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      priority {(a.priorityScore ?? 0).toFixed(2)} · impact {a.impactScore} ·
                      conf {a.confidence}
                    </div>
                  </div>
                  <div className="mt-1">{a.reason}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs uppercase text-muted-foreground">
                      status: {status}
                    </span>
                    <button
                      className="rounded border px-2 py-0.5 text-xs"
                      onClick={() =>
                        setDecisions((d) => ({ ...d, [a.id]: "approved" }))
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="rounded border px-2 py-0.5 text-xs"
                      onClick={() =>
                        setDecisions((d) => ({ ...d, [a.id]: "rejected" }))
                      }
                    >
                      Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="text-xs text-muted-foreground">
        Approvals here are advisory state only. Applying amendments to B.53 requires an
        explicit, audited update pipeline.
      </footer>
    </div>
  );
}
