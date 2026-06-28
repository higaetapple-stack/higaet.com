import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

type CheckState = "idle" | "checking" | "ok" | "degraded" | "down";

interface Check {
  id: string;
  label: string;
  url: string;
  state: CheckState;
  status?: number;
  latencyMs?: number;
  correlationId?: string;
  error?: string;
  checkedAt?: string;
}

const PREVIEW_BASE = "https://id-preview--a5499f07-de61-442e-81aa-fd1dbb361ba7.lovable.app";
const PROD_BASE = "https://higaet.com";

const INITIAL: Check[] = [
  { id: "local", label: "Current origin · /api/public/health", url: "/api/public/health", state: "idle" },
  { id: "prod", label: "Production · /api/public/health", url: `${PROD_BASE}/api/public/health`, state: "idle" },
  { id: "preview", label: "Preview · /api/public/health", url: `${PREVIEW_BASE}/api/public/health`, state: "idle" },
  { id: "home-prod", label: "Production · /", url: `${PROD_BASE}/`, state: "idle" },
];

async function runCheck(check: Check): Promise<Check> {
  const correlationId = crypto.randomUUID();
  const startedAt = performance.now();
  try {
    const res = await fetch(check.url, {
      method: "GET",
      headers: { "x-correlation-id": correlationId },
      cache: "no-store",
      mode: check.url.startsWith("http") ? "cors" : "same-origin",
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    const state: CheckState = res.ok ? "ok" : res.status >= 500 ? "down" : "degraded";
    return {
      ...check,
      state,
      status: res.status,
      latencyMs,
      correlationId: res.headers.get("x-correlation-id") ?? correlationId,
      checkedAt: new Date().toISOString(),
      error: undefined,
    };
  } catch (error) {
    return {
      ...check,
      state: "down",
      latencyMs: Math.round(performance.now() - startedAt),
      correlationId,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const STATE_STYLES: Record<CheckState, string> = {
  idle: "bg-muted text-muted-foreground",
  checking: "bg-amber-100 text-amber-900",
  ok: "bg-emerald-100 text-emerald-900",
  degraded: "bg-amber-100 text-amber-900",
  down: "bg-red-100 text-red-900",
};

function StatusPage() {
  const [checks, setChecks] = useState<Check[]>(INITIAL);

  const runAll = useMemo(
    () => async () => {
      setChecks((prev) => prev.map((c) => ({ ...c, state: "checking" as CheckState })));
      const results = await Promise.all(INITIAL.map(runCheck));
      setChecks(results);
    },
    [],
  );

  useEffect(() => {
    runAll();
    const id = setInterval(runAll, 30_000);
    return () => clearInterval(id);
  }, [runAll]);

  const overall: CheckState = checks.some((c) => c.state === "down")
    ? "down"
    : checks.some((c) => c.state === "degraded")
      ? "degraded"
      : checks.every((c) => c.state === "ok")
        ? "ok"
        : "checking";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium text-ink">System status</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Live checks against the public health endpoint on this origin, production, and preview.
          Refreshes automatically every 30s.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATE_STYLES[overall]}`}>
            Overall: {overall}
          </span>
          <button
            onClick={runAll}
            className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-ink hover:bg-muted"
          >
            Re-check now
          </button>
        </div>
      </header>

      <ul className="space-y-3">
        {checks.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink">{c.label}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{c.url}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_STYLES[c.state]}`}>
                {c.state}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
              <div>
                <dt className="font-medium text-ink">Status</dt>
                <dd>{c.status ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Latency</dt>
                <dd>{c.latencyMs != null ? `${c.latencyMs} ms` : "—"}</dd>
              </div>
              <div className="col-span-2 truncate">
                <dt className="font-medium text-ink">Correlation ID</dt>
                <dd className="truncate font-mono">{c.correlationId ?? "—"}</dd>
              </div>
            </dl>
            {c.error ? (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-900">
                Connection error: {c.error}. If this affects the preview URL only, it is usually a
                transient Lovable preview-proxy issue — retry, or open the production URL.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}

export const Route = createFileRoute("/status")({
  component: StatusPage,
  head: () => ({
    meta: [
      { title: "System status — HIGAET" },
      { name: "description", content: "Live health checks for HIGAET production and preview endpoints." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "System status — HIGAET" },
      { property: "og:url", content: "https://higaet.com/status" },
    ],
    links: [{ rel: "canonical", href: "https://higaet.com/status" }],
  }),
});
