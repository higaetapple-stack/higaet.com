import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getSitemap = createServerFn({ method: "GET" })
  .handler(async () => {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { "Content-Type": "application/xml" },
    });
  });

export const Route = createFileRoute("/sitemap.xml")({
  loader: async () => {
    return await getSitemap();
  },
  component: () => null,
});
