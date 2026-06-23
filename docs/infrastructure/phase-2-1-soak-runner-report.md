# Phase 2.1 — Soak Runner Architecture

**Status:** Design + scaffolding only. Live execution is deferred until staging deployment exists (per Phase 2.1 constraints).

## Soak Architecture

```
scripts/run-soak.ts (planned)
        ├── workloads/
        │     ├── chat-fast.ts        (provider: chat.fast routing chain)
        │     ├── chat-reason.ts      (provider: chat.reason routing chain)
        │     ├── chat-cheap.ts       (provider: chat.cheap routing chain)
        │     ├── chat-tools.ts       (provider: chat.tools routing chain)
        │     └── embeddings.ts       (primary + OpenRouter fallback)
        ├── drivers/
        │     ├── concurrent.ts       (N concurrent virtual users, M iterations)
        │     └── ramp.ts             (ramp from 1 → N over T seconds)
        └── sinks/
              ├── ai_usage.ts         (insert per-call telemetry into public.ai_usage)
              └── summary.json        (aggregated metrics on stdout + file)
```

Workloads call the existing typed server functions (`ai-chat.functions.ts`, embeddings via `ai-embeddings.server.ts`) so they exercise the **real** provider router, breaker, and budget logic — no shadow code path.

## Execution Plan

| Phase | Duration | Concurrency | Workload mix |
| --- | --- | --- | --- |
| Warm-up | 5 min | 2 VUs | 70% chat.fast / 30% embeddings |
| Steady | 30 min | 10 VUs | 40 / 20 / 20 / 10 / 10 across the four chat lanes + embeddings |
| Burst | 5 min | 30 VUs | chat.fast only — exercises breaker + fallback |
| Cool-down | 5 min | 2 VUs | embeddings only — exercises queue drain |

Trigger: manual from a maintainer workstation against `STAGING_BASE_URL`. Not wired into CI in Phase 2.1.

## Metrics Schema

Per-call rows are written to `public.ai_usage` (existing table) plus an aggregated `summary.json`:

```ts
type SoakSummary = {
  startedAt: string; endedAt: string; targetBaseUrl: string;
  lanes: Record<"chat.fast"|"chat.reason"|"chat.cheap"|"chat.tools"|"embeddings", {
    requests: number;
    latencyMs: { p50: number; p95: number; p99: number };
    success: number;
    failure: number;
    timeout: number;
    fallbackRate: number;                        // % of calls that hit a fallback provider
    providerDistribution: Record<string, number>; // openai/gemini/groq/openrouter share
    breaker: { opens: number; halfOpens: number; closes: number };
    quotaExhausted: number;
    throttled: number;                            // 429s observed per lane
  }>;
};
```

## Expected Outputs

| Output | Path | Purpose |
| --- | --- | --- |
| Per-call telemetry | `public.ai_usage` | Drives `/dashboard/admin/provider-health`. |
| Run summary | `test-results/soak/summary.json` | Machine-readable for CI. |
| Markdown report | `docs/infrastructure/phase-2-1-soak-runner-report.md` (this file) updated post-run with results. |

## Validation Strategy

Pass criteria for a soak run (applied **after** staging deployment):

| Lane | Pass criteria |
| --- | --- |
| chat.fast | p95 ≤ 3 s, success ≥ 99.0%, fallbackRate ≤ 25% |
| chat.reason | p95 ≤ 8 s, success ≥ 98.5% |
| chat.cheap | p95 ≤ 3 s, success ≥ 99.0% |
| chat.tools | p95 ≤ 6 s, success ≥ 98.0% |
| embeddings | p95 ≤ 4 s, success ≥ 99.0%, dimensions = 1536 on every call |
| breaker | At least one open + auto-close during burst phase — proves recovery works |

## Constraints Honored

- No live soak execution in Phase 2.1.
- No provider routing changes.
- No DB schema changes (re-uses `public.ai_usage`).
- No production traffic.
