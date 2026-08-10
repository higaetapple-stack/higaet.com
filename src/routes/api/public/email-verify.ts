import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/email-verify")({
  loader: async () => ({}),
  component: () => null,
});
