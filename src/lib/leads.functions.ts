import { createServerFn } from "@tanstack/react-start";
import { LeadSchema, type LeadPayload } from "@/lib/schemas";

/**
 * Lead submission router.
 * - division "global"  → public.study_abroad_leads
 * - division "tech"    → public.technologies_leads
 * - others             → logged only (Phase 2 generic leads table)
 */
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: LeadPayload) => LeadSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      if (data.division === "global" || data.division === "tech") {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (data.division === "global") {
          await supabaseAdmin.from("study_abroad_leads").insert({
            full_name: data.name,
            email: data.email,
            phone: data.phone || null,
            message: data.message || null,
            source: data.source,
          });
        } else {
          await supabaseAdmin.from("technologies_leads").insert({
            full_name: data.name,
            email: data.email,
            phone: data.phone || null,
            message: data.message || null,
            service_interest: data.source,
          });
        }
      } else {
        console.log("[lead] new", { division: data.division, source: data.source });
      }
    } catch (e) {
      console.error("[lead] persist failed", e);
    }
    return { ok: true as const };
  });
