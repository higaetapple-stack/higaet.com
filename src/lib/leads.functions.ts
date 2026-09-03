import { createServerFn } from "@tanstack/react-start";
import { LeadSchema, type LeadPayload } from "@/lib/schemas";
import { getServerPublicClient } from "@/integrations/supabase/server-public";
import { LEAD_RECIPIENTS } from "@/lib/contact";
import { sendBrevoEmail } from "@/lib/email/brevo";

/**
 * Public lead capture endpoint.
 *
 * Uses the server publishable (anon) client — NOT supabaseAdmin. The
 * `study_abroad_leads` and `technologies_leads` tables both expose narrow
 * `TO anon` INSERT policies (sa_leads_public_insert / tech_leads_public_insert)
 * that constrain what callers may write. RLS is the source of truth; this
 * endpoint never bypasses it.
 *
 * Other divisions are logged only until a generic leads table exists.
 */

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export interface LeadNotification {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

/**
 * Pure builder for the division notification email.
 * The recipient comes ONLY from the server-side LEAD_RECIPIENTS allowlist,
 * keyed by the schema-validated division. Client input can never select
 * an arbitrary recipient.
 */
export function buildLeadNotification(data: LeadPayload): LeadNotification {
  const to = LEAD_RECIPIENTS[data.division] ?? LEAD_RECIPIENTS.main;
  const subject = `[HIGAET lead: ${data.division}/${data.source}] ${data.name}`;
  const lines = [
    `Division: ${data.division}`,
    `Source: ${data.source}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || "-"}`,
    `Message: ${data.message || "-"}`,
  ];
  const htmlContent = [
    "<h2>New HIGAET enquiry</h2>",
    "<ul>",
    ...lines.map((l) => `<li>${esc(l)}</li>`),
    "</ul>",
  ].join("");
  return { to, subject, htmlContent, textContent: ["New HIGAET enquiry", ...lines].join("\n") };
}

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: LeadPayload) => LeadSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      if (data.division === "global" || data.division === "tech") {
        const supabase = getServerPublicClient();
        if (data.division === "global") {
          const { error } = await supabase.from("study_abroad_leads").insert({
            full_name: data.name,
            email: data.email,
            phone: data.phone || null,
            message: data.message || null,
            source: data.source,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.from("technologies_leads").insert({
            full_name: data.name,
            email: data.email,
            phone: data.phone || null,
            message: data.message || null,
            service_interest: data.source,
          });
          if (error) throw error;
        }
      } else {
        console.log("[lead] new", { division: data.division, source: data.source });
      }
    } catch (e) {
      console.error("[lead] persist failed", e);
    }
    try {
      const note = buildLeadNotification(data);
      const res = await sendBrevoEmail({
        to: [{ email: note.to }],
        subject: note.subject,
        htmlContent: note.htmlContent,
        textContent: note.textContent,
        replyTo: { email: data.email, name: data.name },
        tags: ["lead", `lead:${data.division}`],
      });
      if (!res.ok) {
        console.error("[lead] notify failed", {
          division: data.division,
          source: data.source,
          error: res.error,
        });
      }
    } catch (e) {
      console.error("[lead] notify error", e);
    }
    return { ok: true as const };
  });
