import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only environment readiness check.
 *
 * Reports presence-only (never the value) of every runtime secret required
 * for production. Snapshots are cached in `env_readiness_snapshots` and
 * refreshed by a 15-minute cron; the dashboard reads the latest cached row.
 */

export type SecretStatus = "present" | "missing" | "malformed";

export interface SecretCheck {
  name: string;
  status: SecretStatus;
  blocking: boolean;
  hint?: string;
  detail?: string;
}

export interface SecretGroup {
  category: string;
  description: string;
  required: boolean;
  checks: SecretCheck[];
}

export interface EnvReadinessReport {
  generatedAt: string;
  environment: string;
  overall: "ready" | "degraded" | "blocked";
  totals: {
    checked: number;
    present: number;
    missing: number;
    malformed: number;
    blockingMissing: number;
  };
  groups: SecretGroup[];
  cachedAt?: string | null;
  source?: string;
}

export interface EnvReadinessActivityEvent {
  id: string;
  created_at: string;
  user_id: string | null;
  event_type: "viewed" | "state_changed" | "recheck_forced";
  previous_overall: string | null;
  next_overall: string | null;
  detail: Record<string, unknown>;
}

interface Spec {
  name: string;
  blocking: boolean;
  hint?: string;
  validate?: (v: string) => string | null;
}

// Exported so the public recheck hook can compute the same report server-side.
export const ENV_READINESS_SPEC: Array<{
  category: string;
  description: string;
  required: boolean;
  specs: Spec[];
}> = [
  {
    category: "Supabase / Backend",
    description: "Database, auth, and privileged server access.",
    required: true,
    specs: [
      { name: "SUPABASE_URL", blocking: true, validate: (v) => (/^https:\/\//.test(v) ? null : "must be https URL") },
      { name: "SUPABASE_PUBLISHABLE_KEY", blocking: true },
      { name: "SUPABASE_SERVICE_ROLE_KEY", blocking: true, hint: "Server-only; never exposed to browser." },
    ],
  },
  {
    category: "SRE Pipeline",
    description: "GitHub Actions SRE E2E trigger + PR automation.",
    required: true,
    specs: [
      { name: "SRE_E2E_TRIGGER_SECRET", blocking: true, hint: "Must equal the SRE_E2E_BEARER GitHub secret." },
      { name: "GITHUB_TOKEN", blocking: true, hint: "Least-privilege PAT: contents, PRs, checks, actions." },
      {
        name: "GITHUB_REPO",
        blocking: true,
        hint: "Format owner/repo.",
        validate: (v) => (/^[^\/\s]+\/[^\/\s]+$/.test(v) ? null : "expected owner/repo"),
      },
    ],
  },
  {
    category: "Error Monitoring — Sentry",
    description: "Server-side Sentry client (issues/releases).",
    required: true,
    specs: [
      { name: "SENTRY_AUTH_TOKEN", blocking: true },
      { name: "SENTRY_ORG_SLUG", blocking: false, hint: "Defaults to higaet-5y." },
      { name: "SENTRY_PROJECT_SLUG", blocking: false, hint: "Defaults to higaet-core-engine." },
    ],
  },
  {
    category: "Payments — Stripe",
    description: "Only required if Stripe checkout is live.",
    required: false,
    specs: [
      {
        name: "STRIPE_SECRET_KEY",
        blocking: false,
        validate: (v) => (/^sk_(live|test)_/.test(v) ? null : "expected sk_live_ or sk_test_ prefix"),
      },
      {
        name: "STRIPE_WEBHOOK_SECRET",
        blocking: false,
        validate: (v) => (/^whsec_/.test(v) ? null : "expected whsec_ prefix"),
      },
    ],
  },
  {
    category: "AI Gateway",
    description: "Lovable AI Gateway credential for AI features.",
    required: true,
    specs: [{ name: "LOVABLE_API_KEY", blocking: true }],
  },
  {
    category: "Session",
    description: "Server-side signing/encryption secret.",
    required: true,
    specs: [
      {
        name: "SESSION_SECRET",
        blocking: true,
        validate: (v) => (v.length >= 32 ? null : "must be at least 32 chars"),
      },
    ],
  },
];

function checkOne(spec: Spec): SecretCheck {
  const raw = process.env[spec.name];
  if (!raw || raw.trim() === "") {
    return { name: spec.name, status: "missing", blocking: spec.blocking, hint: spec.hint };
  }
  if (spec.validate) {
    const err = spec.validate(raw);
    if (err) {
      return {
        name: spec.name,
        status: "malformed",
        blocking: spec.blocking,
        hint: spec.hint,
        detail: err,
      };
    }
  }
  return { name: spec.name, status: "present", blocking: spec.blocking };
}

/**
 * Compute a fresh env readiness report from process.env. Server-only.
 * Exported for the /api/public/hooks/env-readiness-recheck route.
 */
export function computeEnvReadiness(): EnvReadinessReport {
  const groups: SecretGroup[] = ENV_READINESS_SPEC.map((g) => ({
    category: g.category,
    description: g.description,
    required: g.required,
    checks: g.specs.map(checkOne),
  }));

  let present = 0,
    missing = 0,
    malformed = 0,
    blockingMissing = 0;
  for (const g of groups) {
    for (const c of g.checks) {
      if (c.status === "present") present++;
      else if (c.status === "missing") {
        missing++;
        if (c.blocking) blockingMissing++;
      } else {
        malformed++;
        if (c.blocking) blockingMissing++;
      }
    }
  }
  const checked = present + missing + malformed;
  const overall: EnvReadinessReport["overall"] =
    blockingMissing > 0 ? "blocked" : missing + malformed > 0 ? "degraded" : "ready";

  return {
    generatedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "unknown",
    overall,
    totals: { checked, present, missing, malformed, blockingMissing },
    groups,
  };
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: allowed, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  if (error) throw new Error(error.message);
  if (!allowed) throw new Error("Forbidden");
}

function reportFromSnapshotRow(row: any): EnvReadinessReport {
  return {
    generatedAt: row.created_at,
    environment: row.environment,
    overall: row.overall,
    totals: row.totals,
    groups: row.groups,
    cachedAt: row.created_at,
    source: row.source,
  };
}

/**
 * Dashboard read path. Returns the latest cached snapshot; falls back to a
 * fresh compute (and inserts a snapshot) if the table is empty.
 * Logs a 'viewed' activity event.
 */
export const getEnvReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EnvReadinessReport> => {
    await assertAdmin(context);

    const { data: latest, error: readErr } = await context.supabase
      .from("env_readiness_snapshots")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);

    let report: EnvReadinessReport;
    if (latest) {
      report = reportFromSnapshotRow(latest);
    } else {
      // First-run fallback — recompute and persist via admin client.
      report = computeEnvReadiness();
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("env_readiness_snapshots").insert({
        environment: report.environment,
        overall: report.overall,
        present_count: report.totals.present,
        missing_count: report.totals.missing,
        malformed_count: report.totals.malformed,
        blocking_missing_count: report.totals.blockingMissing,
        totals: report.totals,
        groups: report.groups,
        source: "on_demand",
      });
      report.cachedAt = report.generatedAt;
      report.source = "on_demand";
    }

    // Fire-and-forget activity log — never fail the read on log errors.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("env_readiness_activity").insert({
        user_id: context.userId,
        event_type: "viewed",
        next_overall: report.overall,
        detail: { totals: report.totals },
      });
    } catch {
      /* swallow */
    }

    return report;
  });

/**
 * Force an immediate recheck. Admin-only. Inserts a fresh snapshot and logs
 * `recheck_forced` (and `state_changed` when the verdict changes).
 */
export const recheckEnvReadinessNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EnvReadinessReport> => {
    await assertAdmin(context);
    const report = computeEnvReadiness();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Previous state for diff.
    const { data: prev } = await supabaseAdmin
      .from("env_readiness_snapshots")
      .select("overall")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabaseAdmin.from("env_readiness_snapshots").insert({
      environment: report.environment,
      overall: report.overall,
      present_count: report.totals.present,
      missing_count: report.totals.missing,
      malformed_count: report.totals.malformed,
      blocking_missing_count: report.totals.blockingMissing,
      totals: report.totals,
      groups: report.groups,
      source: "manual",
    });

    await supabaseAdmin.from("env_readiness_activity").insert({
      user_id: context.userId,
      event_type: "recheck_forced",
      previous_overall: prev?.overall ?? null,
      next_overall: report.overall,
      detail: { totals: report.totals },
    });

    if (prev?.overall && prev.overall !== report.overall) {
      await supabaseAdmin.from("env_readiness_activity").insert({
        user_id: context.userId,
        event_type: "state_changed",
        previous_overall: prev.overall,
        next_overall: report.overall,
        detail: { source: "manual", totals: report.totals },
      });
    }

    report.cachedAt = report.generatedAt;
    report.source = "manual";
    return report;
  });

export const getEnvReadinessActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EnvReadinessActivityEvent[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("env_readiness_activity")
      .select("id, created_at, user_id, event_type, previous_overall, next_overall, detail")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as EnvReadinessActivityEvent[];
  });

/**
 * Summary used by the Launch Readiness page to block deployment when
 * required secrets or formats fail. Admin-only.
 */
export const getEnvReadinessSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{
    overall: EnvReadinessReport["overall"];
    blockingMissing: number;
    missing: number;
    malformed: number;
    cachedAt: string | null;
  } | null> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("env_readiness_snapshots")
      .select("overall, blocking_missing_count, missing_count, malformed_count, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      overall: data.overall,
      blockingMissing: data.blocking_missing_count,
      missing: data.missing_count,
      malformed: data.malformed_count,
      cachedAt: data.created_at,
    };
  });
