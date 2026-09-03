import { createServerFn } from "@tanstack/react-start";
import { LeadSchema, type LeadPayload } from "@/lib/schemas";
import { getServerPublicClient } from "@/integrations/supabase/server-public";
import { LEAD_RECIPIENTS } from "@/lib/contact";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { LIMITS, rateLimitByKey } from "@/lib/rate-limit-core";

/**
 * Public lead capture endpoint.
 *
 * Uses the server publishable (anon) client — NOT supabaseAdmin. All three
 * lead tables expose narrow `TO anon` INSERT policies
 * (sa_leads_public_insert / tech_leads_public_insert / leads_public_insert)
 * that constrain what callers may write. RLS is the source of truth; this
 * endpoint never bypasses it.
 *
 * Flow: validate (inputValidator) -> rate-limit -> persist -> notify.
 * Persist-then-notify: a notification failure never deletes or fails a
 * stored lead; a persistence failure is logged and the notification still
 * fires so no enquiry is silently lost. Never logs PII.
 *
 * Rate limiting is process-local in-memory (see rate-limit.ts): effective
 * across the single Passenger Node process. Fail-open: a limiter error
 * never blocks a legitimate enquiry.
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

export type LeadStoreTable = "leads" | "study_abroad_leads" | "technologies_leads";

export interface LeadStoreTarget {
  table: LeadStoreTable;
  row: Record<string, string | null>;
}

/**
 * Pure persistence routing: which table + row a validated lead maps to.
 * main/academy -> generic `leads`; global -> study_abroad_leads;
 * tech -> technologies_leads. One lead is stored in exactly one table.
 */
export function resolveLeadStore(data: LeadPayload): LeadStoreTarget {
  const base = {
    full_name: data.name,
    email: data.email,
    phone: data.phone || null,
    message: data.message || null,
  };
  if (data.division === "global") {
    return { table: "study_abroad_leads", row: { ...base, source: data.source } };
  }
  if (data.division === "tech") {
    return { table: "technologies_leads", row: { ...base, service_interest: data.source } };
  }
  return {
    table: "leads",
    row: { ...base, division: data.division, source: data.source },
  };
}

/** Message returned to the client when rate-limited. No internals exposed. */
export const LEAD_RATE_LIMIT_MESSAGE =
  "Too many enquiries in a short time. Please wait a few minutes and try again.";

/**
 * Best-effort client IP for rate-limit keying. Reads standard proxy headers
 * (Passenger/LiteSpeed set X-Forwarded-For); never trusts arbitrary client
 * input beyond these deployment-controlled headers. Fails open to "anon".
 */
/** Injected I/O for processLeadSubmission (production wiring vs tests). */
export interface LeadDeps {
  insert: (
    table: LeadStoreTable,
    row: Record<string, string | null>,
  ) => Promise<{ error: unknown }>;
  notify: (
    note: LeadNotification,
    replyTo: { email: string; name: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  limitKey: () => string;
}

/**
 * Full submission flow minus transport: rate-limit -> persist -> notify.
 * Pure apart from injected deps, so every branch is unit-testable.
 * Never throws except on rate-limit rejection; never logs PII.
 */
export async function processLeadSubmission(
  data: LeadPayload,
  deps: LeadDeps,
): Promise<{ ok: true }> {
  let key = "lead.submit::anon";
  try {
    key = deps.limitKey();
  } catch (e) {
    console.error("[lead] limiter error (fail-open)", e);
  }
  const blocked = rateLimitByKey(key, LIMITS.leadSubmit);
  if (blocked) {
    console.warn("[lead] rate limited", { division: data.division, source: data.source });
    throw new Error(LEAD_RATE_LIMIT_MESSAGE);
  }
  try {
    const target = resolveLeadStore(data);
    const { error } = await deps.insert(target.table, target.row);
    if (error) throw error;
  } catch (e) {
    console.error("[lead] persist failed", e);
  }
  try {
    const note = buildLeadNotification(data);
    const res = await deps.notify(note, { email: data.email, name: data.name });
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
}

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: LeadPayload) => LeadSchema.parse(data))
  .handler(async ({ data }) => {
    // Header reads MUST stay inline here: TanStack import-protection denies
    // the server request-headers specifier anywhere in the client-reachable
    // module graph, but allows it inside a server-function handler body
    // (same pattern as security.functions.ts). Reads standard proxy headers
    // only; fails open to "anon".
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    let ip = "anon";
    try {
      ip =
        getRequestHeader("cf-connecting-ip") ||
        getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
        getRequestHeader("x-real-ip") ||
        "anon";
    } catch {
      ip = "anon";
    }
    const supabase = getServerPublicClient();
    // Untyped boundary: table/row shape is already constrained by
    // LeadStoreTable + resolveLeadStore; the client cast avoids
    // union-table generic inference noise at this single call site.
    const untyped = supabase as unknown as {
      from: (table: string) => {
        insert: (row: Record<string, string | null>) => Promise<{ error: unknown }>;
      };
    };
    return processLeadSubmission(data, {
      insert: async (table, row) => {
        const { error } = await untyped.from(table).insert(row);
        return { error };
      },
      notify: async (note, replyTo) => {
        const res = await sendBrevoEmail({
          to: [{ email: note.to }],
          subject: note.subject,
          htmlContent: note.htmlContent,
          textContent: note.textContent,
          replyTo,
          tags: ["lead", `lead:${data.division}`],
        });
        return { ok: res.ok, error: res.error };
      },
      limitKey: () => `lead.submit::${ip}`,
    });
  });
