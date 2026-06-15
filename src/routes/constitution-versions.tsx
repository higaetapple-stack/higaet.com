import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { applyAmendment } from "@/lib/constitution/executor";
import { getConstitution, getHistory, rollback } from "@/lib/constitution/store";
import type { ConstitutionAmendment } from "@/lib/constitution/amendments";
import type { ConstitutionVersion } from "@/lib/constitution/versioning";

export const Route = createFileRoute("/constitution-versions")({
  head: () => ({
    meta: [
      { title: "Constitution Versions — Execution Layer" },
      { name: "description", content: "B.55 versioned constitution with rollback." },
    ],
  }),
  component: VersionsPage,
});

function diffRules(a: ConstitutionVersion, b: ConstitutionVersion): string[] {
  const out: string[] = [];
  const aIds = new Set(a.rules.map((r) => r.id));
  const bIds = new Set(b.rules.map((r) => r.id));
  for (const id of bIds) if (!aIds.has(id)) out.push(`+ ${id}`);
  for (const id of aIds) if (!bIds.has(id)) out.push(`- ${id}`);
  for (const r of b.rules) {
    const prev = a.rules.find((x) => x.id === r.id);
    if (prev && JSON.stringify(prev) !== JSON.stringify(r)) out.push(`~ ${r.id}`);
  }
  return out;
}

function VersionsPage() {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const history = getHistory();
  const current = getConstitution();

  const tryApply = (impactScore: number, confidence: number) => {
    const amendment: ConstitutionAmendment = {
      id: `demo-${Date.now()}`,
      type: "modify_rule",
      targetRuleId: "friction-awareness",
      proposedRule: { priority: 4 },
      reason: "Demo amendment from versions panel",
      impactScore,
      confidence,
      status: "approved",
    };
    const result = applyAmendment(amendment);
    if (result.status === "rejected") {
      alert(`Rejected: ${result.reason}`);
    }
    refresh();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6" data-tick={tick}>
      <header>
        <h1 className="text-2xl font-semibold">Constitution Versions</h1>
        <p className="text-sm text-muted-foreground">
          B.55 applies validated amendments and maintains rollback-safe version history.
          Never bypasses B.53 validation or auto-approves high-impact changes.
        </p>
      </header>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Current version</h2>
        <div className="mt-1 text-sm">
          v{current.version} · {current.rules.length} rules ·{" "}
          {new Date(current.timestamp).toLocaleString()}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={() => tryApply(0.5, 0.7)}
          >
            Apply safe demo amendment
          </button>
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={() => tryApply(0.95, 0.9)}
          >
            Attempt high-impact (should reject)
          </button>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Version history</h2>
        <ul className="mt-2 space-y-3 text-sm">
          {history.map((v, i) => {
            const prev = history[i - 1];
            const changes = prev ? diffRules(prev, v) : [];
            return (
              <li key={v.version} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">v{v.version}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(v.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  applied: {v.appliedAmendments.join(", ") || "—"}
                </div>
                {changes.length > 0 && (
                  <pre className="mt-2 rounded bg-muted p-2 text-xs">
                    {changes.join("\n")}
                  </pre>
                )}
                {v.version !== current.version && (
                  <button
                    className="mt-2 rounded border px-2 py-0.5 text-xs"
                    onClick={() => {
                      rollback(v.version);
                      refresh();
                    }}
                  >
                    Rollback to v{v.version}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="text-xs text-muted-foreground">
        Rollback creates a new version pointing at the prior rule set — history is never erased.
      </footer>
    </div>
  );
}
