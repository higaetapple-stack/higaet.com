/**
 * B.16 — Persistent Memory Graph · Ingestion + Bias
 * ---------------------------------------------------------------
 * Async, fire-and-forget ingestion hook called from B.15. Never
 * blocks the request path. Never influences routing directly —
 * `getMemoryBias()` is read-only and capped.
 */

import {
  memoryGraph,
  MAX_NODES,
  MAX_PATTERNS_PER_NODE,
  type MemoryNode,
} from "./types";

export interface IngestInput {
  query: string;
  intent?: string | null;
  route?: string | null;
}

function evictIfNeeded() {
  if (memoryGraph.nodes.size <= MAX_NODES) return;
  // Drop least-recently-seen 5% to amortize eviction cost.
  const drop = Math.ceil(MAX_NODES * 0.05);
  const sorted = [...memoryGraph.nodes.entries()].sort(
    (a, b) => a[1].lastSeen - b[1].lastSeen,
  );
  for (const [k] of sorted.slice(0, drop)) memoryGraph.nodes.delete(k);
}

function recordEdge(prevIntent: string | undefined, currentIntent: string) {
  if (!prevIntent || prevIntent === currentIntent) return;
  const set = memoryGraph.edges.get(prevIntent) ?? new Set<string>();
  set.add(currentIntent);
  memoryGraph.edges.set(prevIntent, set);
}

let lastIntent: string | undefined;

/**
 * Synchronous version — exported for tests / introspection.
 * Prefer `ingestMemoryAsync()` from request paths.
 */
export function ingestMemory(input: IngestInput): MemoryNode | null {
  const intent = (input.intent ?? "").trim();
  const route = (input.route ?? "").trim();
  if (!intent || !route) return null;

  const key = `${intent}:${route}`;
  const existing = memoryGraph.nodes.get(key);
  const now = Date.now();
  const trimmedQuery = input.query.trim().slice(0, 200);

  let node: MemoryNode;
  if (existing) {
    existing.frequency += 1;
    existing.lastSeen = now;
    if (trimmedQuery && !existing.queryPatterns.includes(trimmedQuery)) {
      existing.queryPatterns.push(trimmedQuery);
      if (existing.queryPatterns.length > MAX_PATTERNS_PER_NODE) {
        existing.queryPatterns.shift();
      }
    }
    node = existing;
  } else {
    node = {
      id: key,
      intent,
      route,
      queryPatterns: trimmedQuery ? [trimmedQuery] : [],
      frequency: 1,
      lastSeen: now,
    };
    memoryGraph.nodes.set(key, node);
    evictIfNeeded();
  }

  recordEdge(lastIntent, intent);
  lastIntent = intent;
  return node;
}

/**
 * Non-blocking ingestion — safe to call without `await` from
 * request handlers. Errors are swallowed (memory is non-critical).
 */
export function ingestMemoryAsync(input: IngestInput): void {
  queueMicrotask(() => {
    try {
      ingestMemory(input);
    } catch {
      /* memory graph is best-effort */
    }
  });
}

/**
 * Read-only bias score for an intent. Capped at 0.2 so it can
 * never outweigh B.11/B.13 signals.
 */
export function getMemoryBias(intent: string, route?: string): number {
  if (!intent) return 0;
  let total = 0;
  for (const node of memoryGraph.nodes.values()) {
    if (node.intent !== intent) continue;
    if (route && node.route !== route) continue;
    total += node.frequency;
  }
  return Math.min(total * 0.01, 0.2);
}

export function snapshotMemoryGraph(limit = 100) {
  const nodes = [...memoryGraph.nodes.values()]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, Math.max(1, Math.min(limit, 500)))
    .map((n) => ({
      intent: n.intent,
      route: n.route,
      frequency: n.frequency,
      lastSeen: n.lastSeen,
      patternCount: n.queryPatterns.length,
    }));
  const edges = [...memoryGraph.edges.entries()].map(([from, to]) => ({
    from,
    to: [...to],
  }));
  return {
    totalNodes: memoryGraph.nodes.size,
    totalEdges: edges.length,
    nodes,
    edges,
  };
}
