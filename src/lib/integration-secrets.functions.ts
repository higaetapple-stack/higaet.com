import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, assertSameOrigin, throttle, writeAudit } from "@/lib/admin-guard";

/**
 * Admin-managed integration credentials for Sentry, Datadog, and the
 * uptime monitor. Values are stored in admin_integration_secrets (RLS
 * admin-only). Reads to the client are always masked; the raw value never
 * leaves the server after being written. Every state change is audited.
 */

export type IntegrationKey =
  | "SENTRY_DSN"
  | "SENTRY_AUTH_TOKEN"
  | "SENTRY_ORG_SLUG"
  | "SENTRY_PROJECT_SLUG"
  | "DATADOG_API_KEY"
  | "DATADOG_APP_KEY"
  | "DATADOG_SITE"
  | "UPTIME_MONITOR_API_KEY";

export const INTEGRATION_KEYS: {
  key: IntegrationKey;
  label: string;
  group: "Sentry" | "Datadog" | "Uptime";
  placeholder: string;
  proofHref: string;
}[] = [
  { key: "SENTRY_DSN", label: "Sentry DSN", group: "Sentry", placeholder: "https://<key>@o0.ingest.sentry.io/<project>", proofHref: "https://sentry.io" },
  { key: "SENTRY_AUTH_TOKEN", label: "Sentry Auth Token", group: "Sentry", placeholder: "sntrys_...", proofHref: "https://sentry.io/settings/account/api/auth-tokens/" },
  { key: "SENTRY_ORG_SLUG", label: "Sentry Org Slug", group: "Sentry", placeholder: "higaet-5y", proofHref: "https://sentry.io" },
  { key: "SENTRY_PROJECT_SLUG", label: "Sentry Project Slug", group: "Sentry", placeholder: "higaet-core-engine", proofHref: "https://sentry.io" },
  { key: "DATADOG_API_KEY", label: "Datadog API Key", group: "Datadog", placeholder: "dd_api_...", proofHref: "https://app.datadoghq.com/organization-settings/api-keys" },
  { key: "DATADOG_APP_KEY", label: "Datadog Application Key", group: "Datadog", placeholder: "dd_app_...", proofHref: "https://app.datadoghq.com/organization-settings/application-keys" },
  { key: "DATADOG_SITE", label: "Datadog Site", group: "Datadog", placeholder: "datadoghq.com", proofHref: "https://docs.datadoghq.com/getting_started/site/" },
  { key: "UPTIME_MONITOR_API_KEY", label: "Uptime Monitor API Key", group: "Uptime", placeholder: "ur_...", proofHref: "https://uptimerobot.com/dashboard" },
];

export interface IntegrationSecretRow {
  key: IntegrationKey;
  masked: string;
  present: boolean;
  last_verified_at: string | null;
  last_verified_ok: boolean | null;
  last_verified_detail: string | null;
  updated_at: string | null;
}

function mask(value: string): string {
  // Never leak any raw characters of the secret to the client. The admin
  // UI only needs to know a value is configured; a length bucket gives
  // enough context to spot obviously-wrong pastes without exposing bytes.
  if (!value) return "";
  const len = value.length;
  const bucket = len < 16 ? "short" : len < 40 ? "medium" : "long";
  return `configured (${bucket})`;
}

export const listIntegrationSecrets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IntegrationSecretRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_integration_secrets")
      .select("key,value,last_verified_at,last_verified_ok,last_verified_detail,updated_at");
    if (error) throw new Error(error.message);
    const byKey = new Map<string, any>((data ?? []).map((r: any) => [r.key, r]));
    return INTEGRATION_KEYS.map(({ key }) => {
      const row = byKey.get(key);
      const value = row?.value ?? "";
      return {
        key,
        masked: value ? mask(value) : "",
        present: !!value,
        last_verified_at: row?.last_verified_at ?? null,
        last_verified_ok: row?.last_verified_ok ?? null,
        last_verified_detail: row?.last_verified_detail ?? null,
        updated_at: row?.updated_at ?? null,
      };
    });
  });

export const upsertIntegrationSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: IntegrationKey; value: string }) => {
    if (!input?.key || !INTEGRATION_KEYS.some((k) => k.key === input.key))
      throw new Error("invalid key");
    if (typeof input.value !== "string" || input.value.length === 0 || input.value.length > 4000)
      throw new Error("invalid value");
    return input;
  })
  .handler(async ({ context, data }) => {
    assertSameOrigin();
    await assertAdmin(context);
    throttle("integration-secret.upsert", context.userId, 2_000);
    const { error } = await context.supabase
      .from("admin_integration_secrets")
      .upsert(
        {
          key: data.key,
          value: data.value,
          updated_by: context.userId,
          last_verified_at: null,
          last_verified_ok: null,
          last_verified_detail: null,
        },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    await writeAudit(context.supabase, context.userId, "integration_secret.save", "integration_secret", null, {
      key: data.key,
      value_len: data.value.length,
    });
    return { ok: true };
  });

async function readValue(supabase: any, key: IntegrationKey): Promise<string | null> {
  const { data } = await supabase
    .from("admin_integration_secrets")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

async function persistVerify(
  supabase: any,
  key: IntegrationKey,
  ok: boolean,
  detail: string,
) {
  await supabase
    .from("admin_integration_secrets")
    .update({
      last_verified_at: new Date().toISOString(),
      last_verified_ok: ok,
      last_verified_detail: detail,
    })
    .eq("key", key);
}

async function verifySentry(supabase: any): Promise<{ ok: boolean; detail: string; proof: string | null }> {
  const token = await readValue(supabase, "SENTRY_AUTH_TOKEN");
  const org = (await readValue(supabase, "SENTRY_ORG_SLUG")) ?? "higaet-5y";
  if (!token) return { ok: false, detail: "SENTRY_AUTH_TOKEN not saved.", proof: null };
  try {
    const res = await fetch(`https://sentry.io/api/0/organizations/${encodeURIComponent(org)}/`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    });
    if (res.ok) {
      const proof = `https://sentry.io/organizations/${org}/`;
      return { ok: true, detail: `Sentry org "${org}" reachable (HTTP ${res.status}).`, proof };
    }
    return { ok: false, detail: `Sentry API returned HTTP ${res.status}.`, proof: null };
  } catch (e: any) {
    return { ok: false, detail: `Sentry request failed: ${e?.message ?? "network error"}`, proof: null };
  }
}

async function verifyDatadog(supabase: any): Promise<{ ok: boolean; detail: string; proof: string | null }> {
  const api = await readValue(supabase, "DATADOG_API_KEY");
  const app = await readValue(supabase, "DATADOG_APP_KEY");
  const site = (await readValue(supabase, "DATADOG_SITE")) ?? "datadoghq.com";
  if (!api || !app) return { ok: false, detail: "DATADOG_API_KEY / DATADOG_APP_KEY not both saved.", proof: null };
  try {
    const res = await fetch(`https://api.${site}/api/v1/validate`, {
      headers: {
        "dd-api-key": api,
        "dd-application-key": app,
        accept: "application/json",
      },
    });
    if (res.ok) {
      return { ok: true, detail: `Datadog keys valid (HTTP ${res.status}).`, proof: `https://app.${site}/synthetics/tests` };
    }
    return { ok: false, detail: `Datadog validate returned HTTP ${res.status}.`, proof: null };
  } catch (e: any) {
    return { ok: false, detail: `Datadog request failed: ${e?.message ?? "network error"}`, proof: null };
  }
}

async function verifyUptime(supabase: any): Promise<{ ok: boolean; detail: string; proof: string | null }> {
  const key = await readValue(supabase, "UPTIME_MONITOR_API_KEY");
  if (!key) return { ok: false, detail: "UPTIME_MONITOR_API_KEY not saved.", proof: null };
  try {
    const res = await fetch("https://api.uptimerobot.com/v2/getAccountDetails", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({ api_key: key, format: "json" }).toString(),
    });
    const j: any = await res.json().catch(() => ({}));
    if (res.ok && j?.stat === "ok") {
      return { ok: true, detail: `UptimeRobot account "${j?.account?.email ?? "verified"}" reachable.`, proof: "https://uptimerobot.com/dashboard" };
    }
    return { ok: false, detail: `Uptime API responded: ${j?.error?.message ?? `HTTP ${res.status}`}`, proof: null };
  } catch (e: any) {
    return { ok: false, detail: `Uptime request failed: ${e?.message ?? "network error"}`, proof: null };
  }
}

export interface IntegrationVerification {
  provider: "sentry" | "datadog" | "uptime";
  ok: boolean;
  detail: string;
  proof: string | null;
  verifiedAt: string;
}

export const verifyIntegrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IntegrationVerification[]> => {
    assertSameOrigin();
    await assertAdmin(context);
    throttle("integration-secret.verify", context.userId, 5_000);
    const supabase = context.supabase;
    const [sentry, dd, up] = await Promise.all([
      verifySentry(supabase),
      verifyDatadog(supabase),
      verifyUptime(supabase),
    ]);
    const now = new Date().toISOString();
    await Promise.all([
      persistVerify(supabase, "SENTRY_AUTH_TOKEN", sentry.ok, sentry.detail),
      persistVerify(supabase, "DATADOG_API_KEY", dd.ok, dd.detail),
      persistVerify(supabase, "UPTIME_MONITOR_API_KEY", up.ok, up.detail),
    ]);
    await writeAudit(supabase, context.userId, "integration_secret.verify", "integration_secret", null, {
      results: { sentry: sentry.ok, datadog: dd.ok, uptime: up.ok },
    });
    return [
      { provider: "sentry", ok: sentry.ok, detail: sentry.detail, proof: sentry.proof, verifiedAt: now },
      { provider: "datadog", ok: dd.ok, detail: dd.detail, proof: dd.proof, verifiedAt: now },
      { provider: "uptime", ok: up.ok, detail: up.detail, proof: up.proof, verifiedAt: now },
    ];
  });
