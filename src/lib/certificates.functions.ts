import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function isAdmin(ctx: { supabase: any; userId: string }): Promise<boolean> {
  const { data } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  return !!data;
}

async function audit(
  admin: any,
  actorId: string | null,
  action: string,
  resourceId: string,
  metadata: Record<string, unknown>,
) {
  await admin.from("audit_logs").insert({
    actor_id: actorId,
    action,
    resource_type: "certificate",
    resource_id: resourceId,
    metadata,
  });
}

/**
 * Generate (or regenerate) the QR + PDF artifacts for a certificate,
 * upload to private storage, and persist paths on the certificate row.
 * Returns the storage path of the PDF.
 */
async function buildArtifacts(certId: string, actorId: string | null): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { renderCertificatePdf } = await import("./certificates/pdf.server");
  const { buildVerifyUrl } = await import("./certificates/qr.server");

  const { data: cert, error } = await supabaseAdmin
    .from("certificates")
    .select("id, certificate_number, verification_token, issued_at, student_id, program_id, programs(title, category), profiles!certificates_student_id_fkey(full_name, email)")
    .eq("id", certId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!cert) throw new Error("Certificate not found");

  const c: any = cert;
  if (!c.verification_token) throw new Error("Missing verification token");

  const pdfBytes = await renderCertificatePdf({
    studentName: c.profiles?.full_name || c.profiles?.email || "Student",
    programTitle: c.programs?.title || "Program",
    programCategory: c.programs?.category ?? null,
    certificateNumber: c.certificate_number,
    verificationToken: c.verification_token,
    issuedAt: c.issued_at,
  });

  const pdfPath = `${c.id}/${c.verification_token}.pdf`;
  const up = await supabaseAdmin.storage
    .from("certificates")
    .upload(pdfPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (up.error) throw new Error(up.error.message);

  const qrUrl = buildVerifyUrl(c.verification_token);

  const { error: updErr } = await supabaseAdmin
    .from("certificates")
    .update({ issued_pdf_path: pdfPath, qr_code_url: qrUrl })
    .eq("id", c.id);
  if (updErr) throw new Error(updErr.message);

  await audit(supabaseAdmin, actorId, "certificate_pdf_generated", c.id, {
    certificate_number: c.certificate_number,
    verification_token: c.verification_token,
    pdf_path: pdfPath,
  });

  return pdfPath;
}

/** Admin: regenerate the PDF/QR artifacts for an existing certificate. */
export const adminRegenerateCertificatePdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context))) throw new Error("Forbidden");
    const path = await buildArtifacts(data.id, context.userId);
    return { ok: true as const, path };
  });

/** Internal helper exported for the issuance flow. */
export async function generateCertificateArtifactsServer(
  certId: string,
  actorId: string | null,
): Promise<string> {
  return buildArtifacts(certId, actorId);
}

/**
 * Owner or admin: get a short-lived signed download URL for the certificate PDF.
 * Auto-generates the artifact on first request if missing.
 */
export const getCertificateDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: cert, error } = await context.supabase
      .from("certificates")
      .select("id, student_id, issued_pdf_path")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cert) throw new Error("Certificate not found");
    const owner = cert.student_id === context.userId;
    const admin = await isAdmin(context);
    if (!owner && !admin) throw new Error("Forbidden");

    let path = cert.issued_pdf_path as string | null;
    if (!path) {
      path = await buildArtifacts(cert.id, context.userId);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sig = await supabaseAdmin.storage
      .from("certificates")
      .createSignedUrl(path, 300); // 5 min
    if (sig.error || !sig.data) throw new Error(sig.error?.message || "Could not sign URL");
    return { url: sig.data.signedUrl, path };
  });

/** Public: verify a certificate by its verification_token (used by QR scans). */
export const verifyCertificateByToken = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) =>
    z.object({ token: z.string().trim().min(8).max(128) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("verify_certificate_by_token", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    const r = (rows ?? [])[0];
    if (!r) return { valid: false as const };
    return { valid: true as const, ...r };
  });
