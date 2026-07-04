/**
 * CI Gate: fetch knowledge package ingestion history and current statuses.
 * Same API-key auth as governance.decisions.
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

export const Route = createFileRoute("/api/public/governance/knowledge")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        const limit = Math.min(Number(url.searchParams.get("limit") ?? "100"), 500);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let pkgQ = supabaseAdmin
          .from("knowledge_packages")
          .select(
            "id,created_at,source_label,trust_level,schema_version,generated_at,expires_at,signature_valid,status,reviewed_at",
          )
          .order("created_at", { ascending: false })
          .limit(limit);
        if (status) pkgQ = pkgQ.eq("status", status);

        const [pkgs, events] = await Promise.all([
          pkgQ,
          supabaseAdmin
            .from("knowledge_ingestion_events")
            .select("id,created_at,package_id,source_label,trust_level,outcome,reason")
            .order("created_at", { ascending: false })
            .limit(limit),
        ]);

        if (pkgs.error) return new Response(pkgs.error.message, { status: 500 });
        if (events.error) return new Response(events.error.message, { status: 500 });
        return Response.json({ packages: pkgs.data ?? [], events: events.data ?? [] });
      },
    },
  },
});
