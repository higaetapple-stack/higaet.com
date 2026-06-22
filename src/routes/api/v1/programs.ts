import { createFileRoute } from "@tanstack/react-router";
import { corsPreflight, gatewayJson, logApiUsage, verifyApiKey } from "@/lib/api-gateway.server";

export const Route = createFileRoute("/api/v1/programs")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async ({ request }) => {
        const startedAt = Date.now();
        const endpoint = "/api/v1/programs";
        const v = await verifyApiKey(request, "read:programs");
        if ("error" in v && v.error) {
          await logApiUsage({
            apiKeyId: null,
            requestId: v.requestId,
            request,
            endpoint,
            status: v.error.status,
            startedAt,
            error: "auth",
          });
          return v.error;
        }
        const { ctx } = v as any;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("programs")
          .select("id, slug, title, summary, level, duration_weeks, status, created_at")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) {
          const res = gatewayJson(500, { error: "internal_error" }, ctx.requestId);
          await logApiUsage({
            apiKeyId: ctx.apiKeyId,
            requestId: ctx.requestId,
            request,
            endpoint,
            status: 500,
            startedAt,
            error: error.message,
          });
          return res;
        }

        const body = { data: data ?? [], request_id: ctx.requestId };
        const res = gatewayJson(200, body, ctx.requestId);
        await logApiUsage({
          apiKeyId: ctx.apiKeyId,
          requestId: ctx.requestId,
          request,
          endpoint,
          status: 200,
          startedAt,
          bytesOut: JSON.stringify(body).length,
        });
        return res;
      },
    },
  },
});
