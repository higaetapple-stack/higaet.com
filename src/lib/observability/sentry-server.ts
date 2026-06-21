/**
 * Lightweight Sentry reporter for Cloudflare Worker runtime.
 *
 * No SDK dependency: posts to the Sentry Store endpoint directly using fetch,
 * which works inside Workers/edge runtimes. No-op when SENTRY_DSN is missing.
 *
 * Use `captureServerError(err, { tags, extra })` from server routes / fns.
 * Use `withTrace(name, kind, fn)` to wrap AI/governance workflows so failures
 * are tagged and re-thrown for the caller.
 */

type Tags = Record<string, string | number | boolean>;
type Extra = Record<string, unknown>;

interface ParsedDsn {
  host: string;
  projectId: string;
  publicKey: string;
  protocol: string;
}

let cached: ParsedDsn | null | undefined;

function parseDsn(): ParsedDsn | null {
  if (cached !== undefined) return cached;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return (cached = null);
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\/+/, "");
    if (!u.username || !projectId) return (cached = null);
    cached = {
      host: u.host,
      projectId,
      publicKey: u.username,
      protocol: u.protocol.replace(":", ""),
    };
    return cached;
  } catch {
    return (cached = null);
  }
}

function environment(): string {
  return process.env.SENTRY_ENV ?? process.env.NODE_ENV ?? "production";
}

function release(): string | undefined {
  return process.env.SENTRY_RELEASE;
}

export function newTraceId(): string {
  // 32 hex chars, like Sentry/W3C trace-id.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function captureServerError(
  err: unknown,
  opts: { tags?: Tags; extra?: Extra; traceId?: string } = {},
): Promise<void> {
  const dsn = parseDsn();
  if (!dsn) return;
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  const payload = {
    event_id: newTraceId(),
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: "error",
    environment: environment(),
    release: release(),
    server_name: "tanstack-worker",
    tags: { runtime: "cloudflare-worker", ...(opts.tags ?? {}) },
    extra: opts.extra,
    contexts: opts.traceId
      ? { trace: { trace_id: opts.traceId, span_id: opts.traceId.slice(0, 16) } }
      : undefined,
    exception: {
      values: [
        {
          type: err instanceof Error ? err.name : "Error",
          value: message,
          stacktrace: stack ? { frames: [{ filename: "worker", function: stack.split("\n")[0] }] } : undefined,
        },
      ],
    },
  };

  const url = `${dsn.protocol}://${dsn.host}/api/${dsn.projectId}/store/`;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sentry-auth": `Sentry sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=lovable-worker/1.0`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // never let telemetry break the request
  }
}

/**
 * Wrap an AI/governance workflow with tracing + error capture.
 * Re-throws so callers can still convert to a 4xx/5xx response.
 */
export async function withTrace<T>(
  name: string,
  kind: "ai" | "governance" | "api",
  fn: (ctx: { traceId: string }) => Promise<T>,
  tags: Tags = {},
): Promise<T> {
  const traceId = newTraceId();
  try {
    return await fn({ traceId });
  } catch (err) {
    await captureServerError(err, {
      tags: { workflow: name, kind, ...tags },
      traceId,
    });
    throw err;
  }
}

/**
 * Run `fn` with a timeout. Rejects with a tagged Error after `ms`.
 */
export async function withTimeout<T>(ms: number, fn: () => Promise<T>, label = "operation"): Promise<T> {
  return await Promise.race<T>([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout: ${label} exceeded ${ms}ms`)), ms),
    ),
  ]);
}

/**
 * Standard structured error envelope for public API responses.
 */
export function errorEnvelope(opts: {
  code: string;
  message: string;
  status: number;
  traceId?: string;
  details?: Record<string, unknown>;
}): Response {
  return Response.json(
    {
      error: {
        code: opts.code,
        message: opts.message,
        traceId: opts.traceId,
        details: opts.details,
      },
    },
    { status: opts.status, headers: opts.traceId ? { "x-trace-id": opts.traceId } : undefined },
  );
}
