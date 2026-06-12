import { createServerFn } from "@tanstack/react-start";
import { LeadSchema, type LeadPayload } from "@/lib/schemas";

/**
 * Phase 1: lead submissions are logged server-side.
 * Phase 2: this handler will insert into the `leads` table (Cloud or MySQL).
 * Frontend usage is stable across both phases.
 */
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: LeadPayload) => LeadSchema.parse(data))
  .handler(async ({ data }) => {
    // Intentional minimal logging — no PII to logs in production.
    console.log("[lead] new", {
      division: data.division,
      source: data.source,
      hasPhone: !!data.phone,
      hasMessage: !!data.message,
    });
    return { ok: true as const };
  });
