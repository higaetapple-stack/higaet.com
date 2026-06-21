import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { runOptimizationCycle } from "@/lib/self-opt/loop";
import { memory } from "@/lib/shared-memory/store";
import type { FeedbackSignal } from "@/lib/self-opt/types";

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
  if (userErr || !userData?.user) return new Response("Unauthorized", { status: 401 });

  const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleErr || !isAdmin) return new Response("Forbidden", { status: 403 });
  return null;
}

export const Route = createFileRoute("/api/public/self-optimize")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;

        let body: any = {};
        try {
          body = await request.json();
        } catch {}
        const signals: FeedbackSignal[] = Array.isArray(body?.signals) ? body.signals : [];
        const { memory: updated, scores } = runOptimizationCycle(memory, signals);
        for (let i = 0; i < memory.length; i++) memory[i].confidence = updated[i].confidence;
        return Response.json({ status: "cycle_complete", agents: scores });
      },
    },
  },
});
