/**
 * CI Gate: fetch governance decision traces + pending approvals.
 *
 * Auth: header `x-governance-api-key` must match GOVERNANCE_CI_API_KEY.
 * Returns 401 if missing/invalid. Never exposes user PII.
 *
 * Query params:
 *   view=recent|pending     filter by approval status
 *   tenant=<id>             filter by tenant_id
 *   decision=<ALLOW|WARN|BLOCK|REVIEW_REQUIRED>
 *   limit=<n>               page size (default 100, max 500)
 *   cursor=<ISO timestamp>  cursor-based pagination (created_at < cursor)
 *   format=json|csv         response format (default json)
 */
import { createFileRoute } from "@tanstack/react-router";
import { authorizedGovernanceRequest, toCsv, buildDecisionsQuery } from "@/lib/governance/api-helpers.server";

export const Route = createFileRoute("/api/public/governance/decisions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorizedGovernanceRequest(request)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const url = new URL(request.url);
        const format = url.searchParams.get("format") ?? "json";
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "100"), 1), 500);
        const cursor = url.searchParams.get("cursor");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (format === "csv") {
          // Stream all matching rows up to a hard export cap, ignoring cursor.
          const q = buildDecisionsQuery(supabaseAdmin, url, { withCount: false, limit: 10_000 });
          const { data, error } = await q;
          if (error) return new Response(error.message, { status: 500 });
          const csv = toCsv(data ?? [], [
            "id",
            "created_at",
            "tenant_id",
            "source",
            "decision",
            "risk_score",
            "confidence",
            "requires_human_approval",
            "approval_status",
          ]);
          return new Response(csv, {
            status: 200,
            headers: {
              "content-type": "text/csv; charset=utf-8",
              "content-disposition": `attachment; filename="governance-decisions-${Date.now()}.csv"`,
            },
          });
        }

        const q = buildDecisionsQuery(supabaseAdmin, url, { withCount: !cursor, limit, cursor });
        const { data, error, count } = await q;
        if (error) return new Response(error.message, { status: 500 });
        const rows = data ?? [];
        const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null;
        return Response.json({ rows, nextCursor, total: count ?? null });
      },
    },
  },
});
