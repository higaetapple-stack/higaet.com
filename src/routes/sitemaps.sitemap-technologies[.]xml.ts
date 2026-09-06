import { createFileRoute } from "@tanstack/react-router";
import { buildUrlsetXml, getSitemapSegments, xmlResponse } from "@/lib/sitemap";

/** https://www.higaet.com/sitemaps/sitemap-technologies.xml */
export const Route = createFileRoute("/sitemaps/sitemap-technologies.xml")({
  server: {
    handlers: {
      GET: async () => {
        const segs = await getSitemapSegments();
        const seg = segs.find((s) => s.name === "technologies");
        if (!seg) return new Response("Not found", { status: 404 });
        return xmlResponse(buildUrlsetXml(seg.urls));
      },
    },
  },
});
