import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { replayEvents } from "@/lib/replay/engine";
import { buildTimeline } from "@/lib/replay/timeline";
import type { AgentRole } from "@/lib/replay/types";

export const Route = createFileRoute("/replay")({
  head: () => ({
    meta: [
      { title: "Agent Replay — HIGAET" },
      { name: "description", content: "B.48 read-only execution replay timeline." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ReplayPage,
});

const AGENTS: AgentRole[] = ["planner", "researcher", "navigator", "validator"];

function ReplayPage() {
  const [agent, setAgent] = useState<AgentRole | "all">("all");
  const [cursor, setCursor] = useState(0);

  const timeline = useMemo(
    () => buildTimeline(replayEvents(agent === "all" ? undefined : agent)),
    [agent],
  );

  const max = Math.max(0, timeline.length - 1);
  const safeCursor = Math.min(cursor, max);
  const visible = timeline.slice(0, safeCursor + 1);
  const current = timeline[safeCursor];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Agent Replay</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          B.48 — Deterministic replay of recorded execution events. Read-only.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">Agent:</label>
        <select
          value={agent}
          onChange={(e) => {
            setAgent(e.target.value as AgentRole | "all");
            setCursor(0);
          }}
          className="rounded border bg-background px-2 py-1 text-sm"
        >
          <option value="all">all</option>
          {AGENTS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {timeline.length} event{timeline.length === 1 ? "" : "s"}
        </span>
      </div>

      {timeline.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No events recorded for this filter.
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">step</span>
              <input
                type="range"
                min={0}
                max={max}
                value={safeCursor}
                onChange={(e) => setCursor(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-16 text-right font-mono text-sm tabular-nums">
                {safeCursor + 1} / {timeline.length}
              </span>
            </div>
            {current && (
              <div className="mt-3 text-sm">
                <span className="font-medium capitalize">{current.agent}</span>{" "}
                <span className="text-muted-foreground">→ {current.action}</span>{" "}
                <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">
                  {current.strategy}
                </span>
                {current.blocked && (
                  <span className="ml-2 rounded bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                    blocked
                  </span>
                )}
              </div>
            )}
          </div>

          <ol className="space-y-2">
            {visible.map((s) => (
              <li
                key={s.step}
                className={`rounded-md border bg-card p-3 ${
                  s.blocked ? "border-rose-400" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{s.step}
                    </span>
                    <span className="font-medium capitalize">{s.agent}</span>
                    <span className="text-sm text-muted-foreground">— {s.action}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-sky-100 px-2 py-0.5 text-xs text-sky-800">
                      {s.strategy}
                    </span>
                    {s.blocked && (
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                        blocked
                      </span>
                    )}
                  </div>
                </div>
                {s.memoryKeys.length > 0 && (
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    mem: {s.memoryKeys.join(", ")}
                  </div>
                )}
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {new Date(s.timestamp).toLocaleTimeString()}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      <footer className="mt-8 text-xs text-muted-foreground">
        B.10 governed · capture-only · does not affect live execution
      </footer>
    </div>
  );
}
