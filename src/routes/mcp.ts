import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/mcp")({
  loader: async () => ({}),
  component: () => null,
});
