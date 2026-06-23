import { createServerFn } from "@tanstack/react-start";
import { LeadSchema, type LeadPayload } from "@/lib/schemas";
import { getServerPublicClient } from "@/integrations/supabase/server-public";

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
    return { ok: true as const };
  });
