import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, gatewayJson, logApiUsage, verifyApiKey } from "@/lib/api-gateway.server";

export const Route = createFileRoute("/api/v1/certificates/verify/$id")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async ({ request, params }) => {
        const startedAt = Date.now();
        const endpoint = "/api/v1/certificates/verify";
        const v = await verifyApiKey(request, "read:certificates");
        if ("error" in v && v.error) {
          await logApiUsage({ apiKeyId: null, requestId: v.requestId, request, endpoint, status: v.error.status, startedAt, error: "auth" });
          return v.error;
        }
        const { ctx } = v as any;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("certificates")
          .select("id, certificate_number, issued_at, status, recipient_name, course_title, program_title")
          .or(`id.eq.${params.id},certificate_number.eq.${params.id}`)
          .maybeSingle();

        if (error) {
          await logApiUsage({ apiKeyId: ctx.apiKeyId, requestId: ctx.requestId, request, endpoint, status: 500, startedAt, error: error.message });
          return gatewayJson(500, { error: "internal_error" }, ctx.requestId);
        }
        if (!data) {
          await logApiUsage({ apiKeyId: ctx.apiKeyId, requestId: ctx.requestId, request, endpoint, status: 404, startedAt });
          return gatewayJson(404, { error: "not_found" }, ctx.requestId);
        }
        const body = { data: { ...data, verified: data.status === "issued" }, request_id: ctx.requestId };
        const res = gatewayJson(200, body, ctx.requestId);
        await logApiUsage({ apiKeyId: ctx.apiKeyId, requestId: ctx.requestId, request, endpoint, status: 200, startedAt, bytesOut: JSON.stringify(body).length });
        return res;
      },
    },
  },
});
