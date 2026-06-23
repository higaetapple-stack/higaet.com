// Logical model registry. Consumers reference logical IDs; the router maps
// them to a primary + ordered fallback chain of physical models.
// Server-only.

export type LogicalChatId =
  | "chat.fast"
  | "chat.reason"
  | "chat.cheap"
  | "chat.vision"
  | "chat.tools";

export type LogicalEmbedId = "embed.small" | "embed.large";

export interface ChatModelEntry {
  primary: string;
  fallback: string[];
}

export interface EmbedModelEntry {
  primary: string;
  fallback: string[];
  /** Vector dimensions; router refuses to substitute a model with different dims. */
  dims: number;
}

// Primary = OpenAI/Gemini (production). Groq/OpenRouter/HF/NVIDIA = fallback tier.
export const CHAT_REGISTRY: Record<LogicalChatId, ChatModelEntry> = {
  "chat.fast": {
    primary: "openai/gpt-5-mini",
    fallback: [
      "google/gemini-3-flash-preview",
      "groq/llama-3.3-70b-versatile",
      "openrouter/openai/gpt-5-mini",
    ],
  },
  "chat.reason": {
    primary: "openai/gpt-5",
    fallback: [
      "google/gemini-2.5-pro",
      "openrouter/openai/gpt-5",
      "nvidia/meta/llama-3.3-70b-instruct",
    ],
  },
  "chat.cheap": {
    primary: "google/gemini-3.1-flash-lite",
    fallback: [
      "openai/gpt-5-nano",
      "groq/llama-3.1-8b-instant",
      "huggingface/meta-llama/Llama-3.1-8B-Instruct",
    ],
  },
  "chat.vision": {
    primary: "google/gemini-2.5-pro",
    fallback: ["openai/gpt-5"],
  },
  "chat.tools": {
    primary: "openai/gpt-5-mini",
    fallback: ["google/gemini-3-flash-preview"],
  },
};

export const EMBED_REGISTRY: Record<LogicalEmbedId, EmbedModelEntry> = {
  "embed.small": {
    primary: "openai/text-embedding-3-small",
    fallback: ["huggingface/BAAI/bge-small-en-v1.5"],
    dims: 1536,
  },
  "embed.large": {
    primary: "openai/text-embedding-3-large",
    fallback: ["google/gemini-embedding-001"],
    dims: 3072,
  },
};

export function resolveChatChain(id: LogicalChatId): string[] {
  const entry = CHAT_REGISTRY[id];
  return [entry.primary, ...entry.fallback];
}

export function resolveEmbedChain(id: LogicalEmbedId): {
  chain: string[];
  dims: number;
} {
  const entry = EMBED_REGISTRY[id];
  return { chain: [entry.primary, ...entry.fallback], dims: entry.dims };
}
