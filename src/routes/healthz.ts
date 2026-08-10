import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getLiveness = createServerFn({ method: "GET" })
  .handler(async () => {
    return { status: "ok", timestamp: new Date().toISOString(), env: "production" };
  });

export const Route = createFileRoute("/healthz")({
  loader: async () => {
    return await getLiveness();
  },
  component: () => null,
});
