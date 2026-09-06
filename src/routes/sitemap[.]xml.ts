import { createFileRoute } from "@tanstack/react-router";
import {
  buildSitemapIndexXml,
  getSitemapSegments,
  xmlResponse,
} from "@/lib/sitemap";

/**
 * Canonical sitemap index — the single submission point for
 * Google Search Console and Bing Webmaster Tools.
 * https://www.higaet.com/sitemap.xml
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const segs = await getSitemapSegments();
        return xmlResponse(buildSitemapIndexXml(segs.map((s) => s.file)));
      },
    },
  },
});
