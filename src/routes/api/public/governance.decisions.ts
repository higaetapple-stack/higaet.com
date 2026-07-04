/**
 * CI Gate: fetch governance decision traces + pending approvals.
 *
 * Auth: header `x-governance-api-key` must match GOVERNANCE_CI_API_KEY.
 * Returns 401 if missing/invalid. Never exposes user PII.
 */
import { createFileRoute } from "@tanstack/react-router";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function authorized(request: Request): boolean {
  const presented = request.headers.get("x-governance-api-key") ?? "";
  const expected = process.env.GOVERNANCE_CI_API_KEY ?? "";
  return expected.length > 0 && timingSafeEqual(presented, expected);
}

export const Route = createFileRoute("/api/public/governance/decisions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const url = new URL(request.url);
        const view = url.searchParams.get("view") ?? "recent";
        const tenant = url.searchParams.get("tenant");
        const decision = url.searchParams.get("decision");
        const limit = Math.min(Number(url.searchParams.get("limit") ?? "100"), 500);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let q = supabaseAdmin
          .from("governance_audit_events")
          .select(
            "id,created_at,tenant_id,source,decision,risk_score,confidence,explanation,requires_human_approval,approval_status",
          )
          .order("created_at", { ascending: false })
          .limit(limit);

        if (view === "pending") q = q.eq("approval_status", "pending");
        if (tenant) q = q.eq("tenant_id", tenant);
        if (decision) q = q.eq("decision", decision);

        const { data, error } = await q;
        if (error) return new Response(error.message, { status: 500 });
        return Response.json({ rows: data ?? [] });
      },
    },
  },
});
