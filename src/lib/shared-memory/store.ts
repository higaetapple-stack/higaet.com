import type { MemoryNode } from "./types";

export const memory: MemoryNode[] = [];

export function writeMemory(node: MemoryNode) {
  if (node.confidence < 0 || node.confidence > 1) return;
  memory.push(node);
}
