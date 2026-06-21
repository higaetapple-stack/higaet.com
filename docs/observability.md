# Observability (Phase 6 — Core)

Visibility layer for HIGAET production operations. Scaffolded so it runs
without external configuration; activate Sentry by adding the DSN secrets.

## Stack

| Layer            | Where                                                    |
| ---------------- | -------------------------------------------------------- |
| Browser SDK      | `@sentry/react` initialised in `src/routes/__root.tsx`   |
| Worker reporter  | `src/lib/observability/sentry-server.ts` (fetch-based)   |
| Durable log      | `system_errors` table (RLS: admin read, user-own insert) |
| Perf samples     | `system_metrics` table                                   |
| Alerting bridge  | `emit_domain_event('system.error' | 'system.degraded')`  |
| Notification fan-out | Phase 3A `dispatchNotification`                      |
| Admin dashboard  | `/dashboard/admin/observability`                         |

## Activation

Add the following secrets (no DSN = silent no-op, app keeps working):

| Variable           | Scope        | Purpose                                  |
| ------------------ | ------------ | ---------------------------------------- |
| `VITE_SENTRY_DSN`  | client build | Browser SDK init                         |
| `VITE_SENTRY_ENV`  | client build | Optional, defaults to `import.meta.env.MODE` |
| `SENTRY_DSN`       | server       | Worker reporter                          |
| `SENTRY_ENV`       | server       | Optional, defaults to `NODE_ENV`         |
| `SENTRY_RELEASE`   | server       | Optional, tags release/commit SHA        |

## Capturing errors

### Client (auto)
- React render errors → `ObservabilityErrorBoundary` (root + per-section).
- Route loader / errorComponent → existing `reportLovableError` plus boundary.
- Unhandled rejections → wire `window.addEventListener('unhandledrejection')`
  in a `useEffect` if desired.

### Server function

```ts
import { withObservability } from "@/lib/observability/events.server";

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) =>
    withObservability("profile.update", context, async () => {
      // ... business logic ...
    }),
  );
```

`withObservability` records latency in `system_metrics`, captures any thrown
error into `system_errors` + Sentry, and re-throws so the caller still 5xx's.

### Public API route

Use `withTrace` from `sentry-server.ts` and `errorEnvelope` to return a
structured response with `x-trace-id`:

```ts
import { withTrace, errorEnvelope } from "@/lib/observability/sentry-server";

POST: async ({ request }) =>
  withTrace("webhook.stripe", "api", async ({ traceId }) => {
    // ...
  }).catch((err) =>
    errorEnvelope({ code: "internal", message: err.message, status: 500 }),
  )
```

## Domain-event bridge

Severity ≥ `error` emits one of:

```
system.error       — recoverable failure
system.degraded    — fatal (worker crash, dependency down)
system.recovered   — emit manually from recovery jobs
```

These flow through Phase 3A so the existing notification platform owns the
alert delivery rather than a parallel paging system.

## Admin dashboard

`/dashboard/admin/observability` exposes four tabs:

1. **Errors** — recent `system_errors` with source/level filters.
2. **Performance** — p95 route + server-fn latency over 24h window.
3. **Security events** — last 50 from `security_events`.
4. **Notification health** — delivery success vs failed counts.

All reads go through the `observability_summary(interval)` security-definer
RPC plus the admin-only server functions in `src/lib/observability.functions.ts`.

## Deferred (out of scope for Phase 6 core)

- AI-specific telemetry (token usage, RAG retrieval, hallucination feedback)
  → AI Hub phase.
- P1/P2/P3 alert tuning + on-call routing → API Gateway phase.
- Distributed tracing across subdomains → multi-subdomain deployment.
