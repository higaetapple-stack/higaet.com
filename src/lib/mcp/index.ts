import { auth, defineMcp } from "@lovable.dev/mcp-js";
import aboutHigaet from "./tools/about-higaet";
import listAcademyCourses from "./tools/list-academy-courses";
import listServices from "./tools/list-services";
import getSystemHealthOverview from "./tools/get-system-health-overview";
import getSreSnapshot from "./tools/get-sre-snapshot";
import { getOAuthConfig } from "./oauth-config";

// OAuth 2.1 (Supabase Auth as authorization server) — MCP callers must present
// a valid access token issued by the direct supabase.co issuer. The proxy
// (.lovable.cloud) form fails RFC 8414 issuer discovery and is rejected by
// mcp-js.
//
// Issuer + audience are validated by `getOAuthConfig()` — see
// ./oauth-config.ts. Misconfiguration emits a server-log warning and
// resolves to a sentinel issuer that CANNOT verify a real token (so /mcp
// cleanly rejects instead of accepting anything). Do NOT throw at module
// scope: this file is evaluated during manifest extraction where env vars
// are not present.
const { issuer, acceptedAudiences } = getOAuthConfig();

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
    issuer,
    acceptedAudiences,
  }),
  tools: [
    aboutHigaet,
    listAcademyCourses,
    listServices,
    getSystemHealthOverview,
    getSreSnapshot,
  ],
});
