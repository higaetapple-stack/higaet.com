// Direct-provider AI gateway (OpenAI + Google Gemini).
// Server-only — never import from browser code.
//
// Phase 1 migration: replaces the Lovable AI Gateway with direct calls to
// OpenAI and Google AI Studio. Public surface stays compatible with prior
// AI SDK consumers via `createLovableAiGatewayProvider` (now an alias).
//
// Model id convention (unchanged from Lovable Gateway):
//   - "openai/<model>"  → OpenAI API
//   - "google/<model>"  → Google AI Studio (OpenAI-compatible endpoint)
//
// REST helpers (`aiChatCompletion`, `aiEmbeddings`) are OpenAI-compatible:
// POST bodies are accepted exactly as the Lovable Gateway accepted them
// (full prefixed model id), then routed by prefix.

import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const OPENAI_BASE = "https://api.openai.com/v1";
// Google AI Studio OpenAI-compat endpoint
const GOOGLE_BASE = "https://generativelanguage.googleapis.com/v1beta/openai";

function splitModelId(modelId: string): { provider: "openai" | "google"; model: string } {
  if (modelId.startsWith("openai/")) return { provider: "openai", model: modelId.slice("openai/".length) };
  if (modelId.startsWith("google/")) return { provider: "google", model: modelId.slice("google/".length) };
  // Default unprefixed to OpenAI for safety
  return { provider: "openai", model: modelId };
}

function requireKey(provider: "openai" | "google"): string {
  const key = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY;
  if (!key) throw new Error(`${provider === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY"} missing`);
  return key;
}

/**
 * AI-SDK provider factory (drop-in for the previous Lovable Gateway helper).
 * Returns a callable that accepts a prefixed model id and dispatches to the
 * correct provider. The first arg (legacy `lovableApiKey`) is ignored.
 */
export function createLovableAiGatewayProvider(_legacyKey?: string, _initialRunId?: string) {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

  const provider = (modelId: string) => {
    const { provider: p, model } = splitModelId(modelId);
    return p === "openai" ? openai(model) : google(model);
  };

  return Object.assign(provider, {
    getRunId: () => undefined as string | undefined,
    waitForRunId: () => Promise.resolve(undefined as string | undefined),
  });
}

/** Back-compat shim — no-op, kept so existing imports compile. */
export function getLovableAiGatewayRunId(_request: Request): string | undefined {
  return undefined;
}

// ============================================================================
// REST helpers (OpenAI-compatible) for hand-rolled fetch callers.
// ============================================================================

export interface ChatCompletionBody {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: unknown }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: unknown;
  tools?: unknown;
  tool_choice?: unknown;
  stream?: boolean;
  [k: string]: unknown;
}

/**
 * Drop-in replacement for `fetch("https://ai.gateway.lovable.dev/v1/chat/completions", ...)`.
 * Routes by `body.model` prefix; returns the raw Response so callers can keep their
 * existing JSON / SSE handling.
 */
export async function aiChatCompletion(body: ChatCompletionBody, init?: { signal?: AbortSignal }): Promise<Response> {
  const { provider, model } = splitModelId(body.model);
  const key = requireKey(provider);
  const base = provider === "openai" ? OPENAI_BASE : GOOGLE_BASE;
  const upstreamBody = { ...body, model };
  return fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(upstreamBody),
    signal: init?.signal,
  });
}

export interface EmbeddingsBody {
  model: string;
  input: string | string[];
  [k: string]: unknown;
}

/**
 * Drop-in replacement for `fetch("https://ai.gateway.lovable.dev/v1/embeddings", ...)`.
 * Routes by `body.model` prefix.
 */
export async function aiEmbeddings(body: EmbeddingsBody, init?: { signal?: AbortSignal }): Promise<Response> {
  const { provider, model } = splitModelId(body.model);
  const key = requireKey(provider);
  const base = provider === "openai" ? OPENAI_BASE : GOOGLE_BASE;
  const upstreamBody = { ...body, model };
  return fetch(`${base}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(upstreamBody),
    signal: init?.signal,
  });
}
