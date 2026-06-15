/**
 * B.16 — Persistent Memory Graph · Types & Store
 * ---------------------------------------------------------------
 * Anonymized, aggregated intent → route patterns. No PII, no user
 * identity, no session id. Initial backing is in-memory; the shape
 * is portable to Redis / Postgres / Neo4j later.
 *
 * Guardrails (B.16 spec):
 *   ❌ never stores user identity / session id / IP / UA
 *   ❌ never decides routing
 *   ✔ aggregated counters only
 */

export interface MemoryNode {
  /** Stable key: `${intent}:${route}` */
  id: string;
  intent: string;
  route: string;
  /** Bounded ring buffer of distinct query patterns. */
  queryPatterns: string[];
  frequency: number;
  lastSeen: number;
}

export interface MemoryGraph {
  nodes: Map<string, MemoryNode>;
  /** intent → set of related intents (co-occurrence). */
  edges: Map<string, Set<string>>;
}

export const MAX_NODES = 5000;
export const MAX_PATTERNS_PER_NODE = 25;

export const memoryGraph: MemoryGraph = {
  nodes: new Map(),
  edges: new Map(),
};

export function __resetMemoryGraphForTests() {
  memoryGraph.nodes.clear();
  memoryGraph.edges.clear();
}
