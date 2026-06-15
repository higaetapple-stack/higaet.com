import type { MemoryNode } from "./types";

export function fuseMemory(memories: MemoryNode[]) {
  return memories.reduce((acc, m) => {
    (acc[m.key] ||= []).push(m.value);
    return acc;
  }, {} as Record<string, string[]>);
}
