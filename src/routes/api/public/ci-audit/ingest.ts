import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual, randomUUID, createHash } from "crypto";
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
  workflow_name: z.string().nullable().optional(),
  job_name: z.string().nullable().optional(),
  environment: z.string().nullable().optional(),
});

async function logIngestFailure(args: {
  request: Request;
  body: string;
  correlationId: string;
  statusCode: number;
  failureReason: string;
  parsed?: z.infer<typeof AuditSchema>;
  responseBody: string;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const url = new URL(args.request.url);
    await supabaseAdmin.from("ci_ingest_failures").insert({
      workflow_name: args.parsed?.workflow_name ?? null,
      job_name: args.parsed?.job_name ?? null,
      environment: args.parsed?.environment ?? null,
      ingest_url: `${url.origin}${url.pathname}`,
      status_code: args.statusCode,
      response_body: args.responseBody,
      correlation_id: args.correlationId,
      request_id: args.request.headers.get("x-request-id"),
      retry_count: Number(args.request.headers.get("x-retry-count") ?? 0),
      failure_reason: args.failureReason,
      payload_hash: createHash("sha256").update(args.body).digest("hex").slice(0, 16),
      raw: { request_headers: Object.fromEntries(args.request.headers) },
    });
  } catch (e) {
    console.error("Failed to record ingest failure:", e);
  }
}

export const Route = createFileRoute("/api/public/ci-audit/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const correlationId =
          request.headers.get("x-correlation-id") ?? randomUUID();
        const headers = { "X-Correlation-Id": correlationId };

        const secret = process.env.CI_AUDIT_INGEST_SECRET;
        const body = await request.text();

        if (!secret) {
          const msg = "Ingest secret not configured";
          await logIngestFailure({
            request,
            body,
            correlationId,
            statusCode: 503,
            failureReason: "MISSING_INGEST_SECRET",
            responseBody: msg,
          });
          return new Response(msg, { status: 503, headers });
        }

        const signature = request.headers.get("x-signature") ?? "";
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          const msg = "Invalid signature";
          await logIngestFailure({
            request,
            body,
            correlationId,
            statusCode: 401,
            failureReason: "INVALID_SIGNATURE",
            responseBody: msg,
          });
          return new Response(msg, { status: 401, headers });
        }

        let json: unknown;
        try {
          json = JSON.parse(body);
        } catch {
          const msg = "Invalid JSON";
          await logIngestFailure({
            request,
            body,
            correlationId,
            statusCode: 400,
            failureReason: "INVALID_JSON",
            responseBody: msg,
          });
          return new Response(msg, { status: 400, headers });
        }

        const parsed = AuditSchema.safeParse(json);
        if (!parsed.success) {
          const responseBody = JSON.stringify({
            error: "Validation failed",
            details: parsed.error.flatten(),
          });
          await logIngestFailure({
            request,
            body,
            correlationId,
            statusCode: 400,
            failureReason: "SCHEMA_VALIDATION_FAILED",
            responseBody,
          });
          return new Response(responseBody, {
            status: 400,
            headers: { ...headers, "Content-Type": "application/json" },
          });
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
            raw: JSON.parse(JSON.stringify(d)),
          },
          { onConflict: "sha,ts,decision", ignoreDuplicates: true },
        );

        if (error) {
          console.error("ci-audit ingest insert failed:", error);
          await logIngestFailure({
            request,
            body,
            correlationId,
            statusCode: 500,
            failureReason: `INSERT_FAILED: ${error.message}`,
            parsed: d,
            responseBody: "Insert failed",
          });
          return new Response("Insert failed", { status: 500, headers });
        }
        return Response.json({ ok: true, correlation_id: correlationId }, { headers });
      },
    },
  },
});
