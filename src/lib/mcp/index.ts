import { auth, defineMcp } from "@lovable.dev/mcp-js";
import aboutHigaet from "./tools/about-higaet";
import listAcademyCourses from "./tools/list-academy-courses";
import listServices from "./tools/list-services";
import getSystemHealthOverview from "./tools/get-system-health-overview";
import getSreSnapshot from "./tools/get-sre-snapshot";

// OAuth 2.1 (Supabase Auth as authorization server) — MCP callers must present
// a valid access token issued by the direct supabase.co issuer. The proxy
// (.lovable.cloud) form fails RFC 8414 issuer discovery and is rejected by
// mcp-js. VITE_SUPABASE_PROJECT_ID is inlined at build time by Vite.
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

// Only PUBLIC + INSIGHTS scope tools are registered here.
// Internal tools (AI SRE loop, risk evaluation, Sentry processing) are declared
// in ./internal-tool-registry.ts and are intentionally NOT routed via /mcp.
export default defineMcp({
  name: "higaet-mcp",
  title: "HIGAET",
  version: "0.3.0",
  instructions:
    "HIGAET information + read-only system insights for AI assistants. Requires OAuth sign-in as a HIGAET user. PUBLIC tools: `about_higaet`, `list_academy_courses`, `list_services`. INSIGHTS tools (aggregated, no PII): `get_system_health_overview`, `get_sre_snapshot`. All tools are read-only. Internal AI SRE, risk-engine, and Sentry-processing capabilities are NOT exposed through this endpoint.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    aboutHigaet,
    listAcademyCourses,
    listServices,
    getSystemHealthOverview,
    getSreSnapshot,
  ],
});
  tools: [
    aboutHigaet,
    listAcademyCourses,
    listServices,
    getSystemHealthOverview,
    getSreSnapshot,
  ],
});
