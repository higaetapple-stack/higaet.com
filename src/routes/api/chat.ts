import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const chatHandler = createServerFn({ method: "POST" })
  .handler(async () => {
    return new Response("Chat endpoint ready", { status: 200 });
  });

export const Route = createFileRoute("/api/chat")({
  loader: async () => {
    return { message: "Use POST to chat" };
  },
  component: () => null,
});
