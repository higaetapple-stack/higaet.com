import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual, createHash } from "crypto";
import { z } from "zod";

const FailureSchema = z.object({
  workflow_name: z.string().nullable().optional(),
  job_name: z.string().nullable().optional(),
  environment: z.string().nullable().optional(),
  ingest_url: z.string().nullable().optional(),
  status_code: z.number().int().nullable().optional(),
  response_body: z.string().nullable().optional(),
  correlation_id: z.string().nullable().optional(),
  request_id: z.string().nullable().optional(),
  retry_count: z.number().int().min(0).default(0),
  failure_reason: z.string().nullable().optional(),
  payload_hash: z.string().nullable().optional(),
});

export const Route = createFileRoute("/api/public/ci-ingest-failures/log")({
  loader: async () => ({}),
  component: () => null,
});
      POST: async ({ request }) => {
        const secret = process.env.CI_AUDIT_INGEST_SECRET;
        if (!secret) {
          return new Response("Ingest secret not configured", { status: 503 });
        }

        const signature = request.headers.get("x-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sig = Buffer.from(signature);
        const exp = Buffer.from(expected);
        if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let json: unknown;
        try {
          json = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const parsed = FailureSchema.safeParse(json);
        if (!parsed.success) {
          return Response.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 },
          );
        }
        const d = parsed.data;
        const payloadHash =
          d.payload_hash ?? createHash("sha256").update(body).digest("hex").slice(0, 16);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("ci_ingest_failures").insert({
          workflow_name: d.workflow_name ?? null,
          job_name: d.job_name ?? null,
          environment: d.environment ?? null,
          ingest_url: d.ingest_url ?? null,
          status_code: d.status_code ?? null,
          response_body: d.response_body ?? null,
          correlation_id: d.correlation_id ?? null,
          request_id: d.request_id ?? null,
          retry_count: d.retry_count,
          failure_reason: d.failure_reason ?? null,
          payload_hash: payloadHash,
          raw: JSON.parse(JSON.stringify(d)),
        });

        if (error) {
          console.error("ci-ingest-failures insert failed:", error);
          return new Response("Insert failed", { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
