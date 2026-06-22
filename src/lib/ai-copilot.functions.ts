import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED_ROLES = [
  "super_admin",
  "admin",
  "counselor",
  "placement_officer",
  "faculty",
  "technology_consultant",
] as const;

// Server-side allow-list. Collections are derived from caller role + requested mode/entity.
// Client-supplied collection slugs are IGNORED (logged as scope violation).
const ALL_COLLECTIONS = ["academy", "global-education", "career", "crm", "technologies"] as const;

const ROLE_COLLECTIONS: Record<string, readonly string[]> = {
  super_admin: ALL_COLLECTIONS,
  admin: ALL_COLLECTIONS,
  counselor: ["global-education", "crm", "academy"],
  placement_officer: ["career", "crm", "academy"],
  faculty: ["academy"],
  technology_consultant: ["technologies", "crm"],
};

const MODE_COLLECTIONS: Partial<Record<string, readonly string[]>> = {
  student_summary: ["academy", "career"],
  application_summary: ["global-education"],
  visa_summary: ["global-education"],
  lead_summary: ["crm"],
  project_summary: ["technologies"],
  draft_placement_feedback: ["career"],
  draft_project_update: ["technologies"],
};

function resolveAllowedCollections(userRoles: string[], mode: string): string[] {
  const roleAllowed = new Set<string>();
  for (const r of userRoles) {
    for (const s of ROLE_COLLECTIONS[r] ?? []) roleAllowed.add(s);
  }
  const modeScope = MODE_COLLECTIONS[mode];
  if (!modeScope) return Array.from(roleAllowed);
  return modeScope.filter((s) => roleAllowed.has(s));
}

const COPILOT_SYSTEM = `You are the HIGAET Copilot — an internal AI assistant for staff (admins, counselors, placement officers, faculty, technology consultants).
- Produce concise, decision-ready summaries and drafts based ONLY on the structured records and knowledge context provided.
- Cite HIGAET knowledge context inline as [1], [2], …
- Be structured: use short headings, bullets, risk indicators (🟢 🟡 🔴), and clear "Recommended Next Actions".
- For drafts (emails, follow-ups, notes, updates), produce a single ready-to-review draft. NEVER claim the draft was sent.
- Never invent facts not present in the data/context. If a field is missing, say "not on file".
- Never expose internal IDs, tokens, or system fields in the final output.`;

const MODE_HINTS: Record<string, string> = {
  overview:
    "Mode: Overview. Provide a broad cross-collection answer using retrieved knowledge. Highlight relevant programs, services, or HIGAET capabilities.",
  student_summary:
    "Mode: Student Summary. Structure: Profile · Academic Progress · Assignments · Certificates · Career Readiness · Study Abroad Activity · Risk Indicators · Recommended Next Actions.",
  lead_summary:
    "Mode: Lead Summary. Structure: Lead Intent · Stage · Interaction History · Follow-ups · Conversion Probability (Low/Med/High with reasoning) · Suggested Next Action.",
  application_summary:
    "Mode: Application Summary. Structure: Application Timeline · Documents (received/missing) · Offers · Scholarships · Visa Readiness · Risks · Next Steps.",
  visa_summary:
    "Mode: Visa Case Summary. Structure: Current Stage · Pending Documents · Interview Status · Upcoming Deadlines · Counselor Notes Summary · Risk Flags · Recommended Next Actions.",
  project_summary:
    "Mode: Technology Project Summary. Structure: Milestone Status · Open Tasks · Client Requests · Support Tickets · Invoices · Payment Status · Project Risks · Recommended Next Actions.",
  draft_email:
    "Mode: Email Draft. Produce subject + body. Tone: professional, warm, concise.",
  draft_followup:
    "Mode: CRM Follow-up Draft. Produce: title, due date suggestion, message body (3-6 lines), channel (email/call/whatsapp).",
  draft_note:
    "Mode: Counselor Note Draft. Produce a structured internal note: Context · Observations · Recommendations.",
  draft_placement_feedback:
    "Mode: Placement Feedback Draft. Structure: Strengths · Gaps · Recommended Prep · Suggested Roles.",
  draft_project_update:
    "Mode: Project Update Draft. Structure: Progress · Milestones Completed · Upcoming · Blockers · Asks.",
};

type Mode = keyof typeof MODE_HINTS;

async function fetchRecord(sb: any, kind: string, id: string) {
  // Best-effort fetch — return null if table/record not visible under RLS.
  const tableMap: Record<string, { table: string; select: string }> = {
    student: {
      table: "profiles",
      select: "id, full_name, email, phone, country, city, current_role, headline, bio, portfolio_visibility",
    },
    enrollment: { table: "enrollments", select: "*" },
    application: { table: "applications", select: "*" },
    sa_application: { table: "applications", select: "*" },
    academy_lead: { table: "study_abroad_leads", select: "*" }, // fallback if no academy_leads table
    sa_lead: { table: "study_abroad_leads", select: "*" },
    tech_lead: { table: "technologies_leads", select: "*" },
    visa_case: { table: "visa_cases", select: "*" },
    project: { table: "tech_projects", select: "*" },
  };
  const cfg = tableMap[kind];
  if (!cfg) return null;
  const { data } = await sb.from(cfg.table).select(cfg.select).eq("id", id).maybeSingle();
  return data ?? null;
}

async function fetchStudentBundle(sb: any, studentId: string) {
  const [enrollments, submissions, certificates, applications, placements] = await Promise.all([
    sb.from("enrollments").select("id, program_id, status, enrolled_at").eq("student_id", studentId),
    sb.from("submissions").select("id, assignment_id, status, score, submitted_at").eq("student_id", studentId).limit(50),
    sb.from("certificates").select("id, program_id, certificate_number, issued_at, revoked").eq("student_id", studentId),
    sb.from("applications").select("id, university_program_id, status, submitted_at").eq("student_id", studentId),
    sb.from("placements").select("id, employer_id, role, status, offer_date").eq("student_id", studentId),
  ]);
  return {
    enrollments: enrollments.data ?? [],
    submissions: submissions.data ?? [],
    certificates: certificates.data ?? [],
    applications: applications.data ?? [],
    placements: placements.data ?? [],
  };
}

async function fetchLeadBundle(sb: any, leadKind: string, leadId: string) {
  const [tasks, notes, followups, activity] = await Promise.all([
    sb.from("crm_tasks").select("id, title, status, due_at, created_at").eq("entity_type", leadKind).eq("entity_id", leadId).limit(20),
    sb.from("crm_notes").select("id, body, created_at").eq("entity_type", leadKind).eq("entity_id", leadId).limit(20),
    sb.from("crm_follow_ups").select("id, channel, status, scheduled_for, message").eq("entity_type", leadKind).eq("entity_id", leadId).limit(20),
    sb.from("crm_activity_log").select("id, action, payload, created_at").eq("entity_type", leadKind).eq("entity_id", leadId).limit(30),
  ]);
  return {
    tasks: tasks.data ?? [],
    notes: notes.data ?? [],
    followups: followups.data ?? [],
    activity: activity.data ?? [],
  };
}

async function fetchVisaBundle(sb: any, visaId: string) {
  const [docs, history] = await Promise.all([
    sb.from("visa_documents").select("id, doc_type, status, uploaded_at").eq("visa_case_id", visaId),
    sb.from("visa_status_history").select("id, from_status, to_status, note, created_at").eq("visa_case_id", visaId).order("created_at", { ascending: false }).limit(20),
  ]);
  return { documents: docs.data ?? [], history: history.data ?? [] };
}

async function fetchProjectBundle(sb: any, projectId: string) {
  const [milestones, requests, tickets, invoices, payments, members] = await Promise.all([
    sb.from("tech_project_milestones").select("id, title, status, due_date, completed_at").eq("project_id", projectId),
    sb.from("tech_client_requests").select("id, title, priority, status, created_at").eq("project_id", projectId).limit(30),
    sb.from("tech_support_tickets").select("id, subject, priority, status, created_at").eq("project_id", projectId).limit(30),
    sb.from("tech_invoices").select("id, invoice_number, status, total, due_date, issued_at").eq("project_id", projectId),
    sb.from("tech_payments").select("id, amount, status, paid_at").eq("project_id", projectId),
    sb.from("tech_project_members").select("user_id, role").eq("project_id", projectId),
  ]);
  return {
    milestones: milestones.data ?? [],
    requests: requests.data ?? [],
    tickets: tickets.data ?? [],
    invoices: invoices.data ?? [],
    payments: payments.data ?? [],
    members: members.data ?? [],
  };
}

export const askCopilot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        prompt: z.string().min(1).max(8000),
        mode: z
          .enum([
            "overview",
            "student_summary",
            "lead_summary",
            "application_summary",
            "visa_summary",
            "project_summary",
            "draft_email",
            "draft_followup",
            "draft_note",
            "draft_placement_feedback",
            "draft_project_update",
          ])
          .default("overview"),
        entity: z
          .object({
            kind: z.enum([
              "student",
              "enrollment",
              "application",
              "sa_application",
              "academy_lead",
              "sa_lead",
              "tech_lead",
              "visa_case",
              "project",
            ]),
            id: z.string().uuid(),
          })
          .optional(),
        collections: z.array(z.string()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const t0 = Date.now();
    const sb = context.supabase;

    // Role gate
    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", context.userId);
    const userRoles = (roles ?? []).map((r: any) => r.role);
    const allowed = userRoles.some((r: string) => (ALLOWED_ROLES as readonly string[]).includes(r));
    if (!allowed) throw new Error("Forbidden: Copilot requires staff role");

    // Resolve collections
    const slugs = data.collections && data.collections.length > 0 ? data.collections : COLLECTION_SLUGS;
    const { data: colls } = await sb.from("ai_collections").select("id, slug").in("slug", slugs);
    const collectionIds = (colls ?? []).map((c: any) => c.id);

    // Fetch structured entity context (RLS-scoped)
    let entityRecord: any = null;
    let entityBundle: any = null;
    if (data.entity) {
      entityRecord = await fetchRecord(sb, data.entity.kind, data.entity.id);
      if (data.entity.kind === "student") {
        entityBundle = await fetchStudentBundle(sb, data.entity.id);
      } else if (["academy_lead", "sa_lead", "tech_lead"].includes(data.entity.kind)) {
        entityBundle = await fetchLeadBundle(sb, data.entity.kind, data.entity.id);
      } else if (data.entity.kind === "visa_case") {
        entityBundle = await fetchVisaBundle(sb, data.entity.id);
      } else if (data.entity.kind === "project") {
        entityBundle = await fetchProjectBundle(sb, data.entity.id);
      }
    }

    // Embed query
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const enrichedQuery = [
      data.prompt,
      data.entity ? `Entity: ${data.entity.kind}` : "",
      entityRecord ? JSON.stringify(entityRecord).slice(0, 1500) : "",
    ]
      .filter(Boolean)
      .join("\n");

    const embRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: enrichedQuery }),
    });
    if (!embRes.ok) {
      const t = await embRes.text();
      throw new Error(`Embedding failed: ${embRes.status} ${t.slice(0, 200)}`);
    }
    const embJson = (await embRes.json()) as { data: { embedding: number[] }[] };
    const vec = embJson.data[0].embedding;

    const { data: chunks } = await sb.rpc("match_ai_chunks", {
      query_embedding: vec as unknown as string,
      match_count: 10,
      collection_ids: collectionIds.length > 0 ? collectionIds : undefined,
    });

    const contextText = (chunks ?? [])
      .map((c: any, i: number) => `[${i + 1}] ${c.chunk_text}`)
      .join("\n\n---\n\n");

    const structuredBlock = entityRecord
      ? `\n--- STRUCTURED RECORD (${data.entity?.kind}) ---\n${JSON.stringify(entityRecord, null, 2)}${
          entityBundle ? `\n\n--- RELATED DATA ---\n${JSON.stringify(entityBundle, null, 2)}` : ""
        }`
      : "";

    const chatRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.3,
        messages: [
          { role: "system", content: COPILOT_SYSTEM },
          { role: "system", content: MODE_HINTS[data.mode as Mode] ?? MODE_HINTS.overview },
          {
            role: "system",
            content: `Knowledge context (cross-collection):\n\n${contextText || "(no HIGAET knowledge retrieved — rely on structured record only)"}`,
          },
          {
            role: "user",
            content: `${structuredBlock}\n\n--- REQUEST ---\n${data.prompt}`.trim(),
          },
        ],
      }),
    });
    if (!chatRes.ok) {
      const t = await chatRes.text();
      throw new Error(`Copilot failed: ${chatRes.status} ${t.slice(0, 200)}`);
    }
    const chat = (await chatRes.json()) as any;
    const response = chat.choices?.[0]?.message?.content ?? "";
    const latency = Date.now() - t0;

    try {
      await sb.from("ai_conversation_logs").insert({
        user_id: context.userId,
        prompt: data.prompt,
        response,
        retrieved_chunk_ids: (chunks ?? []).map((c: any) => c.id),
        model: "google/gemini-3-flash-preview",
        prompt_tokens: chat.usage?.prompt_tokens ?? null,
        completion_tokens: chat.usage?.completion_tokens ?? null,
        latency_ms: latency,
      });
    } catch {
      // ignore log failure
    }

    return {
      response,
      mode: data.mode,
      entity_loaded: !!entityRecord,
      sources: (chunks ?? []).map((c: any, i: number) => ({
        index: i + 1,
        id: c.id,
        similarity: Number(c.similarity),
        snippet: String(c.chunk_text).slice(0, 280),
        metadata: c.metadata ?? {},
      })),
      latency_ms: latency,
    };
  });
