import { createFileRoute } from "@tanstack/react-router";
import { pingBrevo } from "@/lib/email/brevo";
import { sendEmail } from "@/lib/email/send-email.server";

// Temporary end-to-end Brevo verification endpoint.
// Auth: Bearer LAUNCH_READINESS_INGEST_SECRET
// Usage: POST /api/public/email-verify  { "to": "addr@example.com" }
export const Route = createFileRoute("/api/public/email-verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.LAUNCH_READINESS_INGEST_SECRET;
        const auth = request.headers.get("authorization") || "";
        if (!secret || auth !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }
        let to = "";
        try {
          const body = (await request.json()) as { to?: string };
          to = body?.to ?? "";
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }
        if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
          return Response.json({ error: "valid 'to' required" }, { status: 400 });
        }

        const env = {
          BREVO_API_KEY: Boolean(process.env.BREVO_API_KEY),
          EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS ?? null,
          EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME ?? null,
          EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO ?? null,
        };

        const ping = await pingBrevo();

        const send = await sendEmail({
          to,
          subject: "HIGAET Brevo Verification",
          body: "<p>This is an end-to-end verification email from HIGAET via Brevo HTTP API.</p><p>If you received this, transactional email delivery is working.</p>",
          tags: ["verification"],
        });

        return Response.json({ env, ping, send });
      },
    },
  },
});
