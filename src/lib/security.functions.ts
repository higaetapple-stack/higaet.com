// Server functions for identity & security: recovery codes, security event
// feed, MFA disable (admin unenroll), identity-provider admin.
// Browser performs TOTP enroll/verify/challenge directly via supabase.auth.mfa.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

// -------- Types --------
export interface SecurityEventRow {
  id: string;
  user_id: string | null;
  event_type: string;
  severity: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RecoveryCodeStatus {
  total: number;
  unused: number;
  generated_at: string | null;
}

export interface IdentityProviderRow {
  id: string;
  slug: string;
  display_name: string;
  protocol: string;
  enabled: boolean;
  metadata: Record<string, unknown>;
  metadata_url: string | null;
  created_at: string;
  updated_at: string;
  domains: string[];
}

// -------- Helpers --------
function getClientIp(): string | null {
  const xff = getRequestHeader("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return getRequestHeader("x-real-ip") ?? null;
}
function getUa(): string | null {
  return getRequestHeader("user-agent") ?? null;
}

async function assertAdmin(supabase: ReturnType<typeof Object>, userId: string) {
  // @ts-expect-error supabase typed loosely here
  const { data } = await supabase.rpc("has_any_role", {
    _user_id: userId,
    _roles: ["admin", "super_admin"],
  });
  if (!data) throw new Error("Forbidden");
}

// -------- Recovery codes --------
export const getRecoveryCodeStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RecoveryCodeStatus> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_mfa_recovery_codes")
      .select("used_at, created_at")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return {
      total: rows.length,
      unused: rows.filter((r) => !r.used_at).length,
      generated_at: rows[0]?.created_at ?? null,
    };
  });

export const regenerateRecoveryCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ codes: string[] }> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordSecurityEvent } = await import("@/lib/security/events.server");

    // Generate 10 codes of format XXXX-XXXX (alpha-num upper)
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
    const rand = (n: number) =>
      Array.from(crypto.getRandomValues(new Uint8Array(n)))
        .map((b) => alphabet[b % alphabet.length])
        .join("");
    const codes = Array.from({ length: 10 }, () => `${rand(4)}-${rand(4)}`);

    // Hash with SHA-256 (one-way; codes are single-use)
    const enc = new TextEncoder();
    const hashes = await Promise.all(
      codes.map(async (c) => {
        const buf = await crypto.subtle.digest("SHA-256", enc.encode(c));
        return Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }),
    );

    // Wipe old codes, insert new
    await supabaseAdmin.from("user_mfa_recovery_codes").delete().eq("user_id", userId);
    const { error } = await supabaseAdmin
      .from("user_mfa_recovery_codes")
      .insert(hashes.map((h) => ({ user_id: userId, code_hash: h })));
    if (error) throw new Error(error.message);

    await recordSecurityEvent({
      userId,
      eventType: "recovery_codes.regenerated",
      severity: "warning",
      ip: getClientIp(),
      userAgent: getUa(),
      notify: {
        title: "Recovery codes regenerated",
        body: "New MFA recovery codes were generated. Store them somewhere safe.",
      },
    });

    return { codes };
  });

// -------- Security events feed --------
export const listMySecurityEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).partial().parse(d ?? {}))
  .handler(async ({ data, context }): Promise<SecurityEventRow[]> => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("security_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (error) throw new Error(error.message);
    return (rows ?? []) as SecurityEventRow[];
  });

// -------- MFA lifecycle events (called by client after successful enroll/disable) --------
const mfaEventInput = z.object({
  kind: z.enum(["enrolled", "disabled", "challenged"]),
  factor_id: z.string().optional(),
});
export const recordMfaEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => mfaEventInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { recordSecurityEvent } = await import("@/lib/security/events.server");
    const map = {
      enrolled: {
        type: "mfa.enrolled" as const,
        sev: "warning" as const,
        title: "Two-factor authentication enabled",
        body: "TOTP authenticator was added to your account.",
      },
      disabled: {
        type: "mfa.disabled" as const,
        sev: "critical" as const,
        title: "Two-factor authentication disabled",
        body: "MFA was removed from your account. If this wasn't you, secure your account immediately.",
      },
      challenged: {
        type: "mfa.challenged" as const,
        sev: "info" as const,
        title: "MFA challenge",
        body: "An MFA challenge was completed.",
      },
    }[data.kind];
    await recordSecurityEvent({
      userId,
      eventType: map.type,
      severity: map.sev,
      ip: getClientIp(),
      userAgent: getUa(),
      metadata: { factor_id: data.factor_id },
      notify: data.kind === "challenged" ? undefined : { title: map.title, body: map.body },
    });
    return { ok: true };
  });

// -------- Sessions: client-side signOut({ scope:'others' }) handles revoke;
// here we just log the event after the client performs it --------
export const recordSessionRevoked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { recordSecurityEvent } = await import("@/lib/security/events.server");
    await recordSecurityEvent({
      userId,
      eventType: "session.revoked",
      severity: "warning",
      ip: getClientIp(),
      userAgent: getUa(),
      notify: {
        title: "Other sessions signed out",
        body: "All other active sessions on your account were revoked.",
      },
    });
    return { ok: true };
  });

// -------- Identity providers (admin) --------
export const listIdentityProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IdentityProviderRow[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("identity_providers")
      .select("*, sso_domains(domain)")
      .order("created_at");
    if (error) throw new Error(error.message);
    return (data ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      display_name: p.display_name,
      protocol: p.protocol,
      enabled: p.enabled,
      metadata: (p.metadata ?? {}) as Record<string, unknown>,
      metadata_url: p.metadata_url,
      created_at: p.created_at,
      updated_at: p.updated_at,
      domains: (p.sso_domains ?? []).map((d: { domain: string }) => d.domain),
    }));
  });

const upsertInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  display_name: z.string().min(2).max(120),
  protocol: z.enum(["saml", "oidc"]).default("saml"),
  enabled: z.boolean().default(false),
  metadata_url: z.string().url().optional().nullable(),
  domains: z.array(z.string().min(3).max(253)).default([]),
});

export const upsertIdentityProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => upsertInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload = {
      slug: data.slug,
      display_name: data.display_name,
      protocol: data.protocol,
      enabled: data.enabled,
      metadata_url: data.metadata_url ?? null,
    };

    let providerId = data.id;
    if (providerId) {
      const { error } = await supabaseAdmin.from("identity_providers").update(payload).eq("id", providerId);
      if (error) throw new Error(error.message);
    } else {
      const { data: ins, error } = await supabaseAdmin
        .from("identity_providers")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      providerId = ins.id;
    }

    // Replace domain mappings
    await supabaseAdmin.from("sso_domains").delete().eq("provider_id", providerId);
    if (data.domains.length > 0) {
      const { error } = await supabaseAdmin
        .from("sso_domains")
        .insert(data.domains.map((d) => ({ provider_id: providerId!, domain: d.toLowerCase().trim() })));
      if (error) throw new Error(error.message);
    }
    return { id: providerId };
  });

export const deleteIdentityProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("identity_providers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
