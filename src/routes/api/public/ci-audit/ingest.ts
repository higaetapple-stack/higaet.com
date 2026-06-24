import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

const AuditSchema = z.object({
  timestamp: z.string(),
  sha: z.string().min(1),
  branch: z.string().min(1),
  actor: z.string().nullable().optional(),
  run_url: z.string().url().nullable().optional(),
  decision: z.enum(["DEPLOY", "CANARY", "BLOCK", "ROLLBACK"]),
  decision_source: z.string().nullable().optional(),
  decision_reason: z.string().nullable().optional(),
  executed: z.boolean().default(false),
  execute_reason: z.string().nullable().optional(),
  system_health_score: z.number().int().min(0).max(100).nullable().optional(),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).nullable().optional(),
  platform_state: z
    .enum(["HEALTHY", "STABLE", "DEGRADED", "CRITICAL"])
    .nullable()
    .optional(),
  system_mode: z.enum(["NORMAL", "FREEZE"]).nullable().optional(),
  autonomous_mode: z.enum(["ENABLED", "DISABLED"]).nullable().optional(),
  diagnosis: z.string().nullable().optional(),
});

export const Route = createFileRoute("/api/public/ci-audit/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.CI_AUDIT_INGEST_SECRET;
        if (!secret) {
          return new Response("Ingest secret not configured", { status: 503 });
        }

        const signature = request.headers.get("x-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let json: unknown;
        try {
          json = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const parsed = AuditSchema.safeParse(json);
        if (!parsed.success) {
          return Response.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 },
          );
        }
        const d = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("ci_audit_log").upsert(
          {
            ts: d.timestamp,
            sha: d.sha,
            branch: d.branch,
            actor: d.actor ?? null,
            run_url: d.run_url ?? null,
            decision: d.decision,
            decision_source: d.decision_source ?? null,
            decision_reason: d.decision_reason ?? null,
            executed: d.executed,
            execute_reason: d.execute_reason ?? null,
            system_health_score: d.system_health_score ?? null,
            risk_level: d.risk_level ?? null,
            platform_state: d.platform_state ?? null,
            system_mode: d.system_mode ?? null,
            autonomous_mode: d.autonomous_mode ?? null,
            diagnosis: d.diagnosis ?? null,
            raw: d as unknown as Record<string, unknown>,
          },
          { onConflict: "sha,ts,decision", ignoreDuplicates: true },
        );

        if (error) {
          console.error("ci-audit ingest insert failed:", error);
          return new Response("Insert failed", { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
