import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { ALL_SERVICES, SERVICE_CATEGORIES } from "@/content/services.index";

export default defineTool({
  name: "list_services",
  title: "List HIGAET Technologies services",
  description:
    "List HIGAET Technologies services (custom software, AI, cloud, etc.) with slug, title, and category. Optionally filter by a category id from list_service_categories.",
  inputSchema: {
    category: z
      .string()
      .trim()
      .optional()
      .describe("Optional category id (e.g. 'build', 'ai'). See list_service_categories."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ category }) => {
    const allowSlugs = category
      ? new Set(SERVICE_CATEGORIES.find((c) => c.id === category)?.slugs ?? [])
      : null;
    const rows = Object.entries(ALL_SERVICES)
      .filter(([slug]) => !allowSlugs || allowSlugs.has(slug))
      .map(([slug, svc]) => ({
        slug,
        title: (svc as { title?: string; hero?: { title?: string } }).title ??
          (svc as { hero?: { title?: string } }).hero?.title ?? slug,
        url: `https://higaet.lovable.app/services/${slug}`,
      }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { count: rows.length, services: rows },
    };
  },
});
