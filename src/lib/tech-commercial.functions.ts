import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_ROLES = ["admin", "super_admin"] as const;
const PROPOSAL_STATUSES = [
  "draft", "sent", "viewed", "negotiation", "accepted", "rejected", "expired",
] as const;
const CONTRACT_STATUSES = [
  "draft", "sent", "signed", "active", "completed", "terminated",
] as const;

async function isAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ADMIN_ROLES as unknown as string[],
  });
  return !!data;
}
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  if (!(await isAdmin(ctx))) throw new Error("Forbidden");
}

// ─── Proposals ──────────────────────────────────────────────────────────────
export const listProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      status: z.enum(PROPOSAL_STATUSES).optional(),
      client_id: z.string().uuid().optional(),
    }).optional().default({}).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("tech_proposals")
      .select("*, client:client_id(id,company)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status);
    if (data.client_id) q = q.eq("client_id", data.client_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const proposalDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [{ data: proposal, error }, versions, contracts] = await Promise.all([
      sb.from("tech_proposals").select("*, client:client_id(id,company,contact_person,email)").eq("id", data.id).maybeSingle(),
      sb.from("tech_proposal_versions").select("*").eq("proposal_id", data.id).order("version", { ascending: false }),
      sb.from("tech_contracts").select("id,title,status").eq("proposal_id", data.id),
    ]);
    if (error) throw new Error(error.message);
    if (!proposal) throw new Error("Not found");
    return { proposal, versions: versions.data ?? [], contracts: contracts.data ?? [] };
  });

export const upsertProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      client_id: z.string().uuid(),
      title: z.string().trim().min(1).max(200),
      summary: z.string().trim().max(2000).nullable().optional(),
      total_amount: z.number().nullable().optional(),
      currency: z.string().trim().max(8).optional(),
      valid_until: z.string().nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { id, ...patch } = data;
    if (id) {
      const cleaned: any = {};
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) cleaned[k] = v;
      const { error } = await sb.from("tech_proposals").update(cleaned).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await sb.from("tech_proposals").insert({
      client_id: patch.client_id, title: patch.title, summary: patch.summary ?? null,
      total_amount: patch.total_amount ?? null, currency: patch.currency ?? "USD",
      valid_until: patch.valid_until ?? null, created_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    // seed v1
    await sb.from("tech_proposal_versions").insert({ proposal_id: row.id, version: 1, created_by: context.userId });
    return { id: row.id };
  });

export const updateProposalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(PROPOSAL_STATUSES),
      client_response_notes: z.string().trim().max(2000).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const patch: any = { status: data.status };
    if (data.status === "sent") patch.sent_at = new Date().toISOString();
    if (data.status === "viewed") patch.viewed_at = new Date().toISOString();
    if (["accepted", "rejected", "negotiation"].includes(data.status)) {
      patch.responded_at = new Date().toISOString();
      if (data.client_response_notes) patch.client_response_notes = data.client_response_notes;
    }
    const { error } = await sb.from("tech_proposals").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Versions
export const upsertProposalVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      proposal_id: z.string().uuid(),
      executive_summary: z.string().trim().max(8000).nullable().optional(),
      scope_of_work: z.string().trim().max(8000).nullable().optional(),
      deliverables: z.string().trim().max(8000).nullable().optional(),
      timeline: z.string().trim().max(4000).nullable().optional(),
      pricing: z.string().trim().max(4000).nullable().optional(),
      terms: z.string().trim().max(8000).nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { id, proposal_id, ...patch } = data;
    if (id) {
      const cleaned: any = {};
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) cleaned[k] = v;
      const { error } = await sb.from("tech_proposal_versions").update(cleaned).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: prop } = await sb.from("tech_proposals").select("current_version").eq("id", proposal_id).single();
    const nextVersion = ((prop?.current_version as number) ?? 0) + 1;
    const { data: row, error } = await sb.from("tech_proposal_versions").insert({
      proposal_id, version: nextVersion, ...patch, created_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await sb.from("tech_proposals").update({ current_version: nextVersion }).eq("id", proposal_id);
    return { id: row.id, version: nextVersion };
  });

// PDF generation (server-only)
export const generateProposalPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ version_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: version, error } = await sb
      .from("tech_proposal_versions")
      .select("*, proposal:proposal_id(id,title,summary,total_amount,currency,valid_until,client:client_id(company,contact_person,email))")
      .eq("id", data.version_id).maybeSingle();
    if (error || !version) throw new Error(error?.message ?? "Version not found");
    const { renderProposalPdf } = await import("./tech-pdf.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = await renderProposalPdf(version);
    const path = `proposals/${version.proposal_id}/v${version.version}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("tech-documents")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error(upErr.message);
    await sb.from("tech_proposal_versions").update({ pdf_url: path }).eq("id", data.version_id);
    return { path };
  });

// ─── Contracts ──────────────────────────────────────────────────────────────
export const listContracts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      status: z.enum(CONTRACT_STATUSES).optional(),
      client_id: z.string().uuid().optional(),
    }).optional().default({}).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("tech_contracts")
      .select("*, client:client_id(id,company), proposal:proposal_id(id,title), project:project_id(id,name)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) q = q.eq("status", data.status);
    if (data.client_id) q = q.eq("client_id", data.client_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const contractDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [{ data: contract, error }, documents] = await Promise.all([
      sb.from("tech_contracts").select("*, client:client_id(id,company,contact_person,email), proposal:proposal_id(id,title), project:project_id(id,name)").eq("id", data.id).maybeSingle(),
      sb.from("tech_contract_documents").select("*").eq("contract_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    if (!contract) throw new Error("Not found");
    return { contract, documents: documents.data ?? [] };
  });

export const upsertContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      proposal_id: z.string().uuid().nullable().optional(),
      client_id: z.string().uuid(),
      project_id: z.string().uuid().nullable().optional(),
      title: z.string().trim().min(1).max(200),
      effective_date: z.string().nullable().optional(),
      end_date: z.string().nullable().optional(),
      total_amount: z.number().nullable().optional(),
      currency: z.string().trim().max(8).optional(),
      parties: z.string().trim().max(4000).nullable().optional(),
      scope: z.string().trim().max(8000).nullable().optional(),
      deliverables: z.string().trim().max(8000).nullable().optional(),
      payment_terms: z.string().trim().max(4000).nullable().optional(),
      confidentiality: z.string().trim().max(4000).nullable().optional(),
      termination: z.string().trim().max(4000).nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { id, ...patch } = data;
    if (id) {
      const cleaned: any = {};
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) cleaned[k] = v;
      const { error } = await sb.from("tech_contracts").update(cleaned).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await sb.from("tech_contracts").insert({
      client_id: patch.client_id, proposal_id: patch.proposal_id ?? null, project_id: patch.project_id ?? null,
      title: patch.title, effective_date: patch.effective_date ?? null, end_date: patch.end_date ?? null,
      total_amount: patch.total_amount ?? null, currency: patch.currency ?? "USD",
      parties: patch.parties ?? null, scope: patch.scope ?? null, deliverables: patch.deliverables ?? null,
      payment_terms: patch.payment_terms ?? null, confidentiality: patch.confidentiality ?? null,
      termination: patch.termination ?? null, created_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateContractStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(CONTRACT_STATUSES) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const patch: any = { status: data.status };
    if (data.status === "sent") patch.sent_at = new Date().toISOString();
    if (data.status === "signed") patch.signed_at = new Date().toISOString();
    const { error } = await sb.from("tech_contracts").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const generateContractPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: contract, error } = await sb
      .from("tech_contracts")
      .select("*, client:client_id(company,contact_person,email)")
      .eq("id", data.id).maybeSingle();
    if (error || !contract) throw new Error(error?.message ?? "Not found");
    const { renderContractPdf } = await import("./tech-pdf.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = await renderContractPdf(contract);
    const path = `contracts/${contract.id}/contract.pdf`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("tech-documents")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error(upErr.message);
    await sb.from("tech_contracts").update({ pdf_url: path }).eq("id", contract.id);
    return { path };
  });

// Contract documents
export const addContractDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      contract_id: z.string().uuid(),
      document_type: z.string().trim().max(80).optional(),
      file_url: z.string().trim().url().max(500),
      file_name: z.string().trim().max(200).optional(),
      visible_to_client: z.boolean().default(true),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tech_contract_documents").insert({
      contract_id: data.contract_id, document_type: data.document_type ?? null,
      file_url: data.file_url, file_name: data.file_name ?? null,
      visible_to_client: data.visible_to_client, uploaded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteContractDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tech_contract_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Signed URL for storage path
export const getTechDocSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("tech-documents").createSignedUrl(data.path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

// Create project from signed contract
export const createProjectFromContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ contract_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: contract, error } = await sb.from("tech_contracts").select("*").eq("id", data.contract_id).maybeSingle();
    if (error || !contract) throw new Error(error?.message ?? "Not found");
    if (contract.status !== "signed" && contract.status !== "active") throw new Error("Contract must be signed");
    if (contract.project_id) throw new Error("Project already exists for this contract");
    const { data: project, error: pErr } = await sb.from("tech_projects").insert({
      client_id: contract.client_id, name: contract.title, description: contract.scope ?? null,
      status: "planning", start_date: contract.effective_date ?? null, end_date: contract.end_date ?? null,
      budget: contract.total_amount ?? null, currency: contract.currency ?? "USD",
      project_manager: context.userId,
    }).select("id").single();
    if (pErr) throw new Error(pErr.message);
    await sb.from("tech_contracts").update({ project_id: project.id, status: "active" }).eq("id", contract.id);
    return { project_id: project.id };
  });

// ─── Client portal ──────────────────────────────────────────────────────────
export const myProposalsAndContracts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const { data: client } = await sb.from("tech_clients").select("id").eq("portal_user", context.userId).maybeSingle();
    if (!client) return { proposals: [], contracts: [] };
    const [proposals, contracts] = await Promise.all([
      sb.from("tech_proposals").select("id,title,status,total_amount,currency,valid_until,created_at,current_version")
        .eq("client_id", client.id).neq("status", "draft").order("created_at", { ascending: false }),
      sb.from("tech_contracts").select("id,title,status,total_amount,currency,effective_date,pdf_url,created_at")
        .eq("client_id", client.id).neq("status", "draft").order("created_at", { ascending: false }),
    ]);
    return { proposals: proposals.data ?? [], contracts: contracts.data ?? [] };
  });

export const myProposalDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [{ data: proposal }, versions] = await Promise.all([
      sb.from("tech_proposals").select("*, client:client_id(company)").eq("id", data.id).maybeSingle(),
      sb.from("tech_proposal_versions").select("*").eq("proposal_id", data.id).order("version", { ascending: false }),
    ]);
    if (!proposal) throw new Error("Not found");
    // Auto-mark viewed if first time
    if (proposal.status === "sent") {
      await sb.from("tech_proposals").update({ status: "viewed", viewed_at: new Date().toISOString() }).eq("id", data.id);
      proposal.status = "viewed";
    }
    return { proposal, versions: versions.data ?? [] };
  });
