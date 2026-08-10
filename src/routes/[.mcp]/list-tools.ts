import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/.mcp/list-tools")({
  loader: async () => ({}),
  component: () => null,
});
