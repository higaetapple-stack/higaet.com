import { memory } from "./store";
import type { MemoryScope } from "./types";

export function readMemory(scope: MemoryScope | string) {
  return memory.filter((m) => m.scope === scope || m.scope === "global");
}
