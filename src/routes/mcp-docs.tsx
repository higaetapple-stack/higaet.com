import { createFileRoute } from "@tanstack/react-router";

const SITE = "https://higaet-core-engine.lovable.app";

export const Route = createFileRoute("/mcp-docs")({
  head: () => ({
    meta: [
      { title: "MCP Gateway — HIGAET" },
      {
        name: "description",
        content:
          "HIGAET's Model Context Protocol (MCP) gateway. Read-only tools for external AI agents — business info, courses, services, and aggregated system insights. Internal SRE and risk engines are not exposed.",
      },
      { property: "og:title", content: "MCP Gateway — HIGAET" },
      {
        property: "og:description",
        content:
          "Public MCP endpoint at /mcp. Read-only PUBLIC and INSIGHTS tools for external AI assistants; internal engines remain isolated.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: McpDocsPage,
});

type Row = { name: string; title: string; scope: "PUBLIC" | "INSIGHTS"; description: string };

const EXPOSED_TOOLS: Row[] = [
  {
    name: "about_higaet",
    title: "About HIGAET",
    scope: "PUBLIC",
    description: "Institute overview and its three divisions.",
  },
  {
    name: "list_academy_courses",
    title: "List Academy courses",
    scope: "PUBLIC",
    description: "HIGAET Academy programs with title, slug, category, canonical URL.",
  },
  {
    name: "list_services",
    title: "List Technologies services",
    scope: "PUBLIC",
    description: "HIGAET Technologies services with optional category filter.",
  },
  {
    name: "get_system_health_overview",
    title: "System health overview",
    scope: "INSIGHTS",
    description:
      "Aggregated risk level, health score, prediction accuracy summary, calibration state. No PII.",
  },
  {
    name: "get_sre_snapshot",
    title: "AI SRE snapshot",
    scope: "INSIGHTS",
    description:
      "Current risk thresholds, calibration mode, top learned root-cause categories. No incident detail.",
  },
];

const INTERNAL_ONLY = [
  "Pre-merge PR risk evaluation",
  "AI SRE root-cause + fix planning loop",
  "Sentry issue processing",
  "Calibration threshold application",
  "Rollback signal emission",
];

function ScopeBadge({ scope }: { scope: Row["scope"] }) {
  const cls =
    scope === "PUBLIC"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {scope}
    </span>
  );
}

function McpDocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">MCP Gateway</h1>
      <p className="mt-3 text-muted-foreground">
        External AI agents (ChatGPT, Claude, Codex, Cursor, …) can connect to HIGAET
        through the Model Context Protocol endpoint below. All exposed tools are
        <strong> read-only</strong> and return either public business data or
        aggregated system insights. No mutations, no user data, no internal control-plane access.
      </p>

      <section className="mt-8 rounded-lg border bg-card p-4">
        <div className="text-sm text-muted-foreground">Endpoint</div>
        <code className="mt-1 block break-all text-sm font-mono">{SITE}/mcp</code>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Exposed tools</h2>
        <div className="mt-4 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Tool</th>
                <th className="px-4 py-2 font-medium">Scope</th>
                <th className="px-4 py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {EXPOSED_TOOLS.map((t) => (
                <tr key={t.name} className="border-t align-top">
                  <td className="px-4 py-3 font-mono text-xs">{t.name}</td>
                  <td className="px-4 py-3"><ScopeBadge scope={t.scope} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Not exposed (internal only)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The following capabilities exist in the codebase for internal AI SRE,
          risk-engine, and CI use. They are declared in a separate internal
          registry, never routed through this endpoint, and never callable by
          external AI clients:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
          {INTERNAL_ONLY.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Safety rules</h2>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          <li>All tools are read-only. No writes, deployments, or CI triggers.</li>
          <li>No access to raw Sentry issues, PR diffs, or user records.</li>
          <li>Aggregated insights only — no PII, no per-user timelines.</li>
          <li>Internal AI SRE + risk engine remain fully isolated from this surface.</li>
        </ul>
      </section>
    </main>
  );
}
