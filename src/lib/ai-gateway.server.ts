// Direct-provider AI gateway.
// Server-only — never import from browser code.
//
// Phase 1: multi-provider routing via OpenAI-compatible chat/completions and
// embeddings endpoints. Keeps the prefixed-model-id contract so existing
// consumers don't change.
//
// Supported prefixes:
//   openai/<model>       → OpenAI            (api.openai.com)
//   google/<model>       → Google AI Studio  (generativelanguage.googleapis.com)
//   groq/<model>         → Groq              (api.groq.com)
//   openrouter/<model>   → OpenRouter        (openrouter.ai)
//   huggingface/<model>  → HuggingFace       (router.huggingface.co)
//   nvidia/<model>       → NVIDIA NIM        (integrate.api.nvidia.com)
//
// REST helpers (`aiChatCompletion`, `aiEmbeddings`) accept a body whose
// `model` field carries the prefix, route by prefix, then forward to the
// upstream provider.

import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

type Provider =
  | "openai"
  | "google"
  | "groq"
  | "openrouter"
  | "huggingface"
  | "nvidia";

const PROVIDER_BASE: Record<Provider, string> = {
  openai: "https://api.openai.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta/openai",
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
  huggingface: "https://router.huggingface.co/v1",
  nvidia: "https://integrate.api.nvidia.com/v1",
};

const PROVIDER_KEY_ENV: Record<Provider, string> = {
  openai: "OPENAI_API_KEY",
  google: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  huggingface: "HUGGINGFACE_API_KEY",
  nvidia: "NVIDIA_API_KEY",
};

export function splitModelId(modelId: string): { provider: Provider; model: string } {
  for (const p of Object.keys(PROVIDER_BASE) as Provider[]) {
    const prefix = `${p}/`;
    if (modelId.startsWith(prefix)) return { provider: p, model: modelId.slice(prefix.length) };
  }
  // Default unprefixed to OpenAI for backwards compat.
  return { provider: "openai", model: modelId };
}

function requireKey(provider: Provider): string {
  const env = PROVIDER_KEY_ENV[provider];
  // Allow HF_TOKEN as alias for HuggingFace.
  const key =
    process.env[env] ||
    (provider === "huggingface" ? process.env.HF_TOKEN : undefined);
  if (!key) throw new Error(`${env} missing`);
  return key;
}

/**
 * AI-SDK provider factory (drop-in for the previous Lovable Gateway helper).
 * Returns a callable that accepts a prefixed model id and dispatches to the
 * correct AI-SDK provider. OpenAI-compatible providers (Groq, OpenRouter, HF,
 * NVIDIA) reuse the OpenAI SDK with a custom baseURL.
 */
export function createLovableAiGatewayProvider(_legacyKey?: string, _initialRunId?: string) {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
  const compat = (p: Provider) =>
    createOpenAI({ apiKey: requireKey(p), baseURL: PROVIDER_BASE[p] });

  const provider = (modelId: string) => {
    const { provider: p, model } = splitModelId(modelId);
    if (p === "openai") return openai(model);
    if (p === "google") return google(model);
    return compat(p)(model);
  };

  return Object.assign(provider, {
    getRunId: () => undefined as string | undefined,
    waitForRunId: () => Promise.resolve(undefined as string | undefined),
  });
}

/** Back-compat shim — no-op. */
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

export async function aiChatCompletion(
  body: ChatCompletionBody,
  init?: { signal?: AbortSignal },
): Promise<Response> {
  const { provider, model } = splitModelId(body.model);
  const key = requireKey(provider);
  const base = PROVIDER_BASE[provider];
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

export async function aiEmbeddings(
  body: EmbeddingsBody,
  init?: { signal?: AbortSignal },
): Promise<Response> {
  const { provider, model } = splitModelId(body.model);
  const key = requireKey(provider);
  const base = PROVIDER_BASE[provider];
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
