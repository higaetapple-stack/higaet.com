import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * Production security headers applied to every response.
 * CSP omitted to avoid breaking Lovable preview / inline scripts;
 * add via hosting layer (MilesWeb / Cloudflare) when ready.
 */
// Lovable previews embed the app inside an iframe on a different origin
// (id-preview--*.lovable.app). X-Frame-Options: SAMEORIGIN and a restrictive
// frame-ancestors CSP both break that embed ("refused to connect"). We keep
// the framing headers OFF in dev/preview and only enforce them in production.
const IS_PROD = process.env.NODE_ENV === "production";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  ...(IS_PROD
    ? {
        "X-Frame-Options": "SAMEORIGIN",
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      }
    : {}),
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Structured request log line — JSON so log aggregators can parse it.
 * Always carries a correlation ID (echoed back via `x-correlation-id` header)
 * so a single request can be traced across edge proxy, SSR, and client logs.
 */
function logRequest(entry: {
  correlationId: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  ip?: string | null;
  ua?: string | null;
  error?: string;
}) {
  // single-line JSON keeps it greppable and aggregator-friendly
  console.log(JSON.stringify({ level: "info", type: "request", ...entry }));
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const correlationId =
      request.headers.get("x-correlation-id") ?? crypto.randomUUID();
    const startedAt = Date.now();
    const url = new URL(request.url);
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for");
    const ua = request.headers.get("user-agent");

    let response: Response;
    let errorMessage: string | undefined;

    try {
      const handler = await getServerEntry();
      const raw = await handler.fetch(request, env, ctx);
      response = withSecurityHeaders(await normalizeCatastrophicSsrResponse(raw));
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        JSON.stringify({
          level: "error",
          type: "request_failure",
          correlationId,
          url: url.pathname + url.search,
          error: errorMessage,
        }),
      );
      response = withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }

    // Attach correlation ID to every response so the frontend can surface it
    const headers = new Headers(response.headers);
    if (!headers.has("x-correlation-id")) headers.set("x-correlation-id", correlationId);
    const finalResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

    logRequest({
      correlationId,
      method: request.method,
      url: url.pathname + url.search,
      status: finalResponse.status,
      durationMs: Date.now() - startedAt,
      ip,
      ua,
      error: errorMessage,
    });

    return finalResponse;
  },
};

