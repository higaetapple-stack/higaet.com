import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { applyAmendment } from "@/lib/constitution/executor";
import { getConstitution, getHistory, rollback } from "@/lib/constitution/store";
import type { ConstitutionAmendment } from "@/lib/constitution/amendments";

async function requireAdmin(request: Request): Promise<Response | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return new Response("Unauthorized", { status: 401 });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }
  return null;
}

export const Route = createFileRoute("/api/public/constitution/apply")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({ current: getConstitution(), history: getHistory() }),
      POST: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;

        try {
          return await withTrace("constitution.apply", "governance", async ({ traceId }) => {
            const body = (await request.json().catch(() => ({}))) as {
              amendment?: ConstitutionAmendment;
              rollbackTo?: number;
            };

            if (typeof body.rollbackTo === "number") {
              const v = rollback(body.rollbackTo);
              if (!v) return new Response("Version not found", { status: 404 });
              return Response.json({ status: "rolled_back", version: v, traceId });
            }

            if (!body.amendment) {
              return new Response("Missing amendment", { status: 400 });
            }

            const result = applyAmendment(body.amendment);
            const status = result.status === "applied" ? 200 : 400;
            return Response.json(
              result.status === "applied"
                ? {
                    status: "applied",
                    newVersion: result.version.version,
                    appliedAmendments: result.version.appliedAmendments,
                    traceId,
                  }
                : { status: "rejected", reason: result.reason, traceId },
              { status, headers: { "x-trace-id": traceId } },
            );
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "unknown";
          return errorEnvelope({ code: "constitution_apply_failed", message: msg, status: 500 });
        }
      },
    },
  },
});
