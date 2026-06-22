import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, gatewayJson, logApiUsage, verifyApiKey } from "@/lib/api-gateway.server";

export const Route = createFileRoute("/api/v1/courses")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async ({ request }) => {
        const startedAt = Date.now();
        const endpoint = "/api/v1/courses";
        const v = await verifyApiKey(request, "read:courses");
        if ("error" in v && v.error) {
          await logApiUsage({ apiKeyId: null, requestId: v.requestId, request, endpoint, status: v.error.status, startedAt, error: "auth" });
          return v.error;
        }
        const { ctx } = v as any;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("courses")
          .select("id, slug, title, summary, program_id, created_at")
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) {
          await logApiUsage({ apiKeyId: ctx.apiKeyId, requestId: ctx.requestId, request, endpoint, status: 500, startedAt, error: error.message });
          return gatewayJson(500, { error: "internal_error" }, ctx.requestId);
        }
        const body = { data: data ?? [], request_id: ctx.requestId };
        const res = gatewayJson(200, body, ctx.requestId);
        await logApiUsage({ apiKeyId: ctx.apiKeyId, requestId: ctx.requestId, request, endpoint, status: 200, startedAt, bytesOut: JSON.stringify(body).length });
        return res;
      },
    },
  },
});
