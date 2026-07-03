import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getAcademyCourses, academyCourseUrl } from "@/content/providers";

export default defineTool({
  name: "list_academy_courses",
  title: "List HIGAET Academy courses",
  description:
    "List HIGAET Academy courses with title, slug, category, and canonical URL. Optionally filter by a case-insensitive query against title, slug, or category.",
  inputSchema: {
    query: z
      .string()
      .trim()
      .optional()
      .describe("Optional case-insensitive substring to filter courses."),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Optional maximum number of courses to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const q = query?.toLowerCase();
    const all = await getAcademyCourses();
    const filtered = q
      ? all.filter((c) =>
          [c.title, c.slug, (c as { categoryId?: string }).categoryId ?? ""].some((v) =>
            String(v).toLowerCase().includes(q),
          ),
        )
      : all;
    const sliced = typeof limit === "number" ? filtered.slice(0, limit) : filtered;
    const rows = sliced.map((c) => ({
      title: c.title,
      slug: c.slug,
      category: (c as { categoryId?: string }).categoryId ?? null,
      url: academyCourseUrl(c),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { total: filtered.length, returned: rows.length, courses: rows },
    };
  },
});
