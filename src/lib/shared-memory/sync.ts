export function syncAgentMemory(agentRole: string, data: unknown) {
  return {
    status: "synced" as const,
    shared: { scope: agentRole, data },
  };
}
