// AI orchestration layer: logical-ID router with retry, circuit breaker,
// fallback chain, budget guard, and telemetry.
//
// Public surface (additive — existing consumers keep using ai-gateway.server.ts):
//   - chatWithLogical(logicalId, body, opts)  → Response
//   - embedWithLogical(logicalId, body, opts) → Response
//
// Server-only.

import {
  aiChatCompletion,
  aiEmbeddings,
  splitModelId,
  type ChatCompletionBody,
  type EmbeddingsBody,
} from "@/lib/ai-gateway.server";
import {
  resolveChatChain,
  resolveEmbedChain,
  type LogicalChatId,
  type LogicalEmbedId,
} from "@/lib/ai/registry";
import { canRequest, recordFailure, recordSuccess } from "@/lib/ai/breaker";
import { isBudgetExceeded, killSwitchEnabled } from "@/lib/ai/budget";
import { logUsage, newRequestId, type UsageRow } from "@/lib/ai/telemetry";

export interface RouteOpts {
  consumer: string;
  requestId?: string;
  signal?: AbortSignal;
  /** Max attempts per provider before failing over. Default 2. */
  perProviderRetries?: number;
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const BASE_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(delay: number): number {
  return delay + Math.floor(Math.random() * (delay / 2));
}

async function attemptCall(
  model: string,
  call: (model: string) => Promise<Response>,
  retries: number,
  signal?: AbortSignal,
): Promise<{ ok: boolean; response: Response; attempts: number; lastError?: string }> {
  let attempt = 0;
  let lastResponse: Response | undefined;
  let lastError: string | undefined;

  while (attempt <= retries) {
    attempt += 1;
    try {
      const res = await call(model);
      if (res.ok) return { ok: true, response: res, attempts: attempt };
      lastResponse = res;
      lastError = `http_${res.status}`;
      if (!RETRYABLE_STATUS.has(res.status)) break;
      // Honour Retry-After if present and small enough.
      const ra = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(ra) && ra > 0 && ra < 3 ? ra * 1000 : jitter(BASE_DELAY_MS * 2 ** (attempt - 1));
      await sleep(wait);
    } catch (err) {
      lastError = err instanceof Error ? err.message : "network_error";
      if (signal?.aborted) throw err;
      await sleep(jitter(BASE_DELAY_MS * 2 ** (attempt - 1)));
    }
  }

  return {
    ok: false,
    response: lastResponse ?? new Response(lastError ?? "exhausted", { status: 599 }),
    attempts: attempt,
    lastError,
  };
}

async function dispatch(
  chain: string[],
  call: (model: string) => Promise<Response>,
  opts: RouteOpts,
  logical: string,
): Promise<Response> {
  const requestId = opts.requestId ?? newRequestId();
  const retries = opts.perProviderRetries ?? 2;

  if (killSwitchEnabled()) {
    void logUsage(makeRow({ requestId, consumer: opts.consumer, logical, model: chain[0], attempt: 0, outcome: "killed" }));
    return new Response("AI disabled (kill switch)", { status: 503 });
  }

  if (await isBudgetExceeded(opts.consumer)) {
    void logUsage(makeRow({ requestId, consumer: opts.consumer, logical, model: chain[0], attempt: 0, outcome: "budget_block" }));
    return new Response("Daily AI budget exceeded", { status: 429, headers: { "X-Budget-Exceeded": "1" } });
  }

  for (let i = 0; i < chain.length; i += 1) {
    const modelId = chain[i];
    const { provider } = splitModelId(modelId);
    if (!canRequest(provider)) {
      void logUsage(makeRow({ requestId, consumer: opts.consumer, logical, provider, model: modelId, attempt: 0, outcome: "error", error: "circuit_open" }));
      continue;
    }
    const t0 = Date.now();
    const { ok, response, attempts, lastError } = await attemptCall(modelId, call, retries, opts.signal);
    const latency = Date.now() - t0;

    if (ok) {
      recordSuccess(provider);
      void logUsage(makeRow({ requestId, consumer: opts.consumer, logical, provider, model: modelId, attempt: attempts, outcome: i === 0 ? "success" : "fallback", latencyMs: latency }));
      return response;
    }
    recordFailure(provider);
    void logUsage(makeRow({ requestId, consumer: opts.consumer, logical, provider, model: modelId, attempt: attempts, outcome: "error", latencyMs: latency, error: lastError }));
  }

  return new Response("All AI providers exhausted", { status: 502, headers: { "X-Request-Id": requestId } });
}

function makeRow(p: {
  requestId: string;
  consumer: string;
  logical: string;
  provider?: string;
  model: string;
  attempt: number;
  outcome: UsageRow["outcome"];
  latencyMs?: number;
  error?: string;
}): UsageRow {
  return {
    request_id: p.requestId,
    consumer: p.consumer,
    logical_id: p.logical,
    provider: p.provider ?? splitModelId(p.model).provider,
    model: p.model,
    attempt: p.attempt,
    outcome: p.outcome,
    latency_ms: p.latencyMs,
    error_code: p.error,
  };
}

// ============================================================================
// Public helpers
// ============================================================================

export async function chatWithLogical(
  logical: LogicalChatId,
  body: Omit<ChatCompletionBody, "model">,
  opts: RouteOpts,
): Promise<Response> {
  const chain = resolveChatChain(logical);
  return dispatch(
    chain,
    (model) => aiChatCompletion({ ...body, model }, { signal: opts.signal }),
    opts,
    logical,
  );
}

export async function embedWithLogical(
  logical: LogicalEmbedId,
  body: Omit<EmbeddingsBody, "model">,
  opts: RouteOpts,
): Promise<Response> {
  const { chain, dims } = resolveEmbedChain(logical);
  const res = await dispatch(
    chain,
    (model) => aiEmbeddings({ ...body, model }, { signal: opts.signal }),
    opts,
    logical,
  );
  if (res.ok) res.headers.set("X-Embed-Dims", String(dims));
  return res;
}
