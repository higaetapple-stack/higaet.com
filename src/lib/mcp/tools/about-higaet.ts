import { defineTool } from "@lovable.dev/mcp-js";

const ABOUT = `HIGAET — Helen Institute of Gen AI Engineering & Technology.

Three divisions:
- HIGAET Academy: industry-aligned Gen AI, engineering, and technology programs.
- HIGAET Global Education Hub: study-abroad guidance, university partnerships, admissions & counseling.
- HIGAET Technologies: enterprise software, AI, cloud, and product engineering services.

Website: https://higaet.lovable.app`;

export default defineTool({
  name: "about_higaet",
  title: "About HIGAET",
  description:
    "Return a short overview of HIGAET, its three divisions (Academy, Global Education Hub, Technologies), and the primary website URL.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: ABOUT }],
    structuredContent: {
      name: "HIGAET",
      full_name: "Helen Institute of Gen AI Engineering & Technology",
      divisions: ["Academy", "Global Education Hub", "Technologies"],
      website: "https://higaet.lovable.app",
    },
  }),
});
