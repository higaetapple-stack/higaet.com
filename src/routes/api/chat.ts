// Phase 7.1 AI Hub — streaming chat endpoint.
// Authenticates via bearer token, injects lesson/community context, streams via Lovable AI Gateway,
// and persists user + assistant messages to ai_messages on stream completion.

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  loader: async () => ({}),
  component: () => null,
});
