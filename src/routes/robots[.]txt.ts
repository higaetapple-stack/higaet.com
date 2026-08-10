import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getRobots = createServerFn({ method: "GET" })
  .handler(async () => {
    return new Response("User-agent: *\nAllow: /", {
      headers: { "Content-Type": "text/plain" },
    });
  });

export const Route = createFileRoute("/robots.txt")({
  loader: async () => {
    return await getRobots();
  },
  component: () => null,
});
