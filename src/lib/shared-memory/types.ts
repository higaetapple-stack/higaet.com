export type MemoryScope =
  | "planner"
  | "researcher"
  | "navigator"
  | "validator"
  | "global";

export type MemoryNode = {
  id: string;
  scope: MemoryScope;
  key: string;
  value: string;
  confidence: number;
  timestamp: number;
};
