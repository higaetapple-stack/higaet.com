/**
 * B.12 — Vector Knowledge Graph · Dataset Builder
 * ---------------------------------------------------------------
 * Derives embeddable records (NOT hardcoded) from the same single
 * sources of truth used by B.8 / B.11:
 *   - INTENT_DATASET (B.11) — already merges PROGRAMS + CAMPUSES
 *     + the Academy static marketing surface.
 *
 * Guardrails (B.12 spec):
 *   ❌ no new routes invented
 *   ❌ no registry mutation
 *   ❌ no override of B.10 / B.11 logic
 *   ✔ every `path` is already in the validated route graph
 *
 * Output records are passed to the embedding model as a single
 * text blob (title + description + keywords) — this is the unit
 * of semantic similarity.
 */

import { INTENT_DATASET, type IntentNode } from "@/lib/intent-router/dataset";

export interface VectorRecord {
  id: string;
  path: string;
  title: string;
  text: string;
  /** Populated by the index builder, not by the dataset stage. */
  embedding?: number[];
}

function composeText(node: IntentNode): string {
  const kw = [...node.keywords, ...node.synonyms].join(", ");
  return `${node.title}. ${node.description} Keywords: ${kw}`;
}

export function buildVectorDataset(): VectorRecord[] {
  return INTENT_DATASET.map((node) => ({
    id: node.path,
    path: node.path,
    title: node.title,
    text: composeText(node),
  }));
}
