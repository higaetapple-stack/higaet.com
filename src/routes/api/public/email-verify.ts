import { createFileRoute } from "@tanstack/react-router";
import { pingBrevo } from "@/lib/email/brevo";
import { sendEmail } from "@/lib/email/send-email.server";

// End-to-end Brevo verification endpoint.
// Auth: Bearer LAUNCH_READINESS_INGEST_SECRET
// Usage: POST /api/public/email-verify  { "to": "addr@example.com" }
// Response contract: boolean status only. No secrets, no env metadata, no key fragments.
export const Route = createFileRoute("/api/public/email-verify")({
  loader: async () => ({}),
  component: () => null,
});
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
          return Response.json({ success: false }, { status: 400 });
        }
        if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
          return Response.json({ success: false }, { status: 400 });
        }

        if (!process.env.BREVO_API_KEY) {
          return Response.json({ success: false }, { status: 500 });
        }

        const ping = await pingBrevo();
        if (!ping.ok) {
          return Response.json({ success: false }, { status: 502 });
        }

        const send = await sendEmail({
          to,
          subject: "HIGAET Brevo Verification",
          body: "<p>End-to-end verification email from HIGAET via Brevo HTTP API.</p>",
          tags: ["verification"],
        });

        if (!send.ok) {
          return Response.json({ success: false }, { status: 502 });
        }

        return Response.json({ success: true });
      },
    },
  },
});
