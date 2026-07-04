import { defineMcp } from "@lovable.dev/mcp-js";
import aboutHigaet from "./tools/about-higaet";
import listAcademyCourses from "./tools/list-academy-courses";
import listServices from "./tools/list-services";
import getSystemHealthOverview from "./tools/get-system-health-overview";
import getSreSnapshot from "./tools/get-sre-snapshot";

// Only PUBLIC + INSIGHTS scope tools are registered here.
// Internal tools (AI SRE loop, risk evaluation, Sentry processing) are declared
// in ./internal-tool-registry.ts and are intentionally NOT routed via /mcp.
export default defineMcp({
  name: "higaet-mcp",
  title: "HIGAET",
  version: "0.2.0",
  instructions:
    "Public HIGAET information + read-only system insights for AI assistants. PUBLIC tools: `about_higaet`, `list_academy_courses`, `list_services`. INSIGHTS tools (aggregated, no PII): `get_system_health_overview`, `get_sre_snapshot`. All tools are read-only. Internal AI SRE, risk-engine, and Sentry-processing capabilities are NOT exposed through this endpoint.",
  tools: [
    aboutHigaet,
    listAcademyCourses,
    listServices,
    getSystemHealthOverview,
    getSreSnapshot,
  ],
});
