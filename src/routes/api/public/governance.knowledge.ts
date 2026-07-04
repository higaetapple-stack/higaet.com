/**
 * CI Gate: fetch knowledge package ingestion history and current statuses.
 * Same API-key auth as governance.decisions.
 *
 * Query params:
 *   status=<pending|accepted|rejected|...>   filter packages by status
 *   trust=<internal|partner|...>             filter by trust level
 *   limit=<n>                                page size (default 100, max 500)
 *   cursor=<ISO timestamp>                   packages created_at < cursor
 *   eventsCursor=<ISO timestamp>             events created_at < cursor
 *   format=json|csv
 *   csvKind=packages|events                  which table to export (default packages)
 */
import { createFileRoute } from "@tanstack/react-router";
import { authorizedGovernanceRequest, toCsv, buildKnowledgeQueries } from "@/lib/governance/api-helpers.server";

export const Route = createFileRoute("/api/public/governance/knowledge")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorizedGovernanceRequest(request)) return new Response("Unauthorized", { status: 401 });
        const url = new URL(request.url);
        const format = url.searchParams.get("format") ?? "json";
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "100"), 1), 500);
        const cursor = url.searchParams.get("cursor");
        const eventsCursor = url.searchParams.get("eventsCursor");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (format === "csv") {
          const csvKind = url.searchParams.get("csvKind") ?? "packages";
          const { pkgs, events } = buildKnowledgeQueries(supabaseAdmin, url, {
            withCount: false,
            limit: 10_000,
          });
          if (csvKind === "events") {
            const { data, error } = await events;
            if (error) return new Response(error.message, { status: 500 });
            const csv = toCsv(data ?? [], [
              "id",
              "created_at",
              "package_id",
              "source_label",
              "trust_level",
              "outcome",
              "reason",
            ]);
            return new Response(csv, {
              status: 200,
              headers: {
                "content-type": "text/csv; charset=utf-8",
                "content-disposition": `attachment; filename="knowledge-events-${Date.now()}.csv"`,
              },
            });
          }
          const { data, error } = await pkgs;
          if (error) return new Response(error.message, { status: 500 });
          const csv = toCsv(data ?? [], [
            "id",
            "created_at",
            "source_label",
            "trust_level",
            "schema_version",
            "generated_at",
            "expires_at",
            "signature_valid",
            "status",
            "reviewed_at",
          ]);
          return new Response(csv, {
            status: 200,
            headers: {
              "content-type": "text/csv; charset=utf-8",
              "content-disposition": `attachment; filename="knowledge-packages-${Date.now()}.csv"`,
            },
          });
        }

        const { pkgs, events } = buildKnowledgeQueries(supabaseAdmin, url, {
          withCount: !cursor && !eventsCursor,
          limit,
          cursor,
          eventsCursor,
        });
        const [pkgsRes, eventsRes] = await Promise.all([pkgs, events]);
        if (pkgsRes.error) return new Response(pkgsRes.error.message, { status: 500 });
        if (eventsRes.error) return new Response(eventsRes.error.message, { status: 500 });
        const pkgRows = pkgsRes.data ?? [];
        const eventRows = eventsRes.data ?? [];
        return Response.json({
          packages: pkgRows,
          events: eventRows,
          nextCursor: pkgRows.length === limit ? pkgRows[pkgRows.length - 1].created_at : null,
          nextEventsCursor: eventRows.length === limit ? eventRows[eventRows.length - 1].created_at : null,
          totals: {
            packages: pkgsRes.count ?? null,
            events: eventsRes.count ?? null,
          },
        });
      },
    },
  },
});
