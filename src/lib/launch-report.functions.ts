import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  computeEnvReadiness,
  type EnvReadinessReport,
} from "@/lib/env-readiness.functions";
import { assertAdmin as guardAssertAdmin, assertSameOrigin, throttle, writeAudit } from "@/lib/admin-guard";

/**
 * Production launch report helpers.
 *
 * - probeSreHealth: server-side GET of /api/public/sre/e2e-health for staging + prod.
 * - getMonitoringVerification: presence-only check of Sentry/Datadog config; never values.
 * - listChecklistItems / upsertChecklistItem: operator checklist CRUD (admin).
 * - buildLaunchReport: aggregates env readiness, health probes, monitoring, checklist,
 *   and run URLs into a single JSON bundle the dashboard downloads.
 */

export interface HealthProbeResult {
  target: string;
  url: string;
  ok: boolean;
  status: number | null;
  latencyMs: number | null;
  body: {
    healthy?: boolean;
    version?: string | null;
    checks?: any;
    raw?: string;
  } | null;
  error?: string;
  probedAt: string;
}

export interface MonitoringSignal {
  key: string;
  label: string;
  configured: boolean;
  detail: string;
  links: { label: string; href: string }[];
}

export interface MonitoringVerificationReport {
  generatedAt: string;
  signals: MonitoringSignal[];
  overall: "ok" | "partial" | "missing";
}

export interface ChecklistItem {
  id: string;
  item_key: string;
  category: string;
  title: string;
  description: string | null;
  is_required: boolean;
  status: "pending" | "in_progress" | "done" | "blocked" | "skipped";
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  evidence_url: string | null;
  sort_order: number;
  updated_at: string;
}

export interface LaunchReportBundle {
  kind: "higaet.production-launch-report";
  version: 1;
  generatedAt: string;
  deploymentTargets: {
    production: string;
    staging: string;
  };
  envReadiness: EnvReadinessReport;
  monitoring: MonitoringVerificationReport;
  healthProbes: HealthProbeResult[];
  checklist: {
    items: ChecklistItem[];
    summary: {
      total: number;
      done: number;
      pending: number;
      blocked: number;
      requiredOutstanding: number;
      overall: "ready" | "blocked";
    };
  };
  attachments: {
    runUrls: { label: string; href: string }[];
    docs: { label: string; href: string }[];
  };
  overallDecision: "READY" | "BLOCKED";
  decisionReasons: string[];
}

const PROD_URL = "https://higaet.com";
const STAGING_URL = "https://staging.higaet.com";
const HEALTH_PATH = "/api/public/sre/e2e-health";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  await guardAssertAdmin(ctx);
}

async function probeOne(target: string, base: string): Promise<HealthProbeResult> {
  const url = `${base}${HEALTH_PATH}`;
  const started = Date.now();
  const probedAt = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - started;
    const text = await res.text();
    let body: HealthProbeResult["body"] = null;
    try {
      const parsed = JSON.parse(text);
      body = {
        healthy: parsed?.healthy,
        version: parsed?.version ?? null,
        checks: parsed?.checks,
      };
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    return {
      target,
      url,
      ok: res.ok,
      status: res.status,
      latencyMs,
      body,
      probedAt,
    };
  } catch (err: any) {
    return {
      target,
      url,
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      body: null,
      error: err?.message ?? "network error",
      probedAt,
    };
  }
}

export const probeSreHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HealthProbeResult[]> => {
    assertSameOrigin();
    await assertAdmin(context);
    throttle("sre.health.probe", context.userId, 10_000);
    const [staging, prod] = await Promise.all([
      probeOne("staging", STAGING_URL),
      probeOne("production", PROD_URL),
    ]);
    await writeAudit(context.supabase, context.userId, "sre.health.probe", "sre_health", null, {
      staging: { ok: staging.ok, status: staging.status, healthy: staging.body?.healthy },
      production: { ok: prod.ok, status: prod.status, healthy: prod.body?.healthy },
    });
    return [staging, prod];
  });

/**
 * Re-run both health probes AND update the two operator checklist items
 * (staging.health, prod.health) based on the results.
 */
export const probeAndUpdateChecklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{
    probes: HealthProbeResult[];
    updated: { item_key: string; status: ChecklistItem["status"] }[];
  }> => {
    assertSameOrigin();
    await assertAdmin(context);
    throttle("sre.health.probe_and_update", context.userId, 10_000);
    const [staging, prod] = await Promise.all([
      probeOne("staging", STAGING_URL),
      probeOne("production", PROD_URL),
    ]);
    const nowIso = new Date().toISOString();
    const rows = [
      {
        item_key: "staging.health",
        status: (staging.ok && staging.body?.healthy === true ? "done" : "blocked") as ChecklistItem["status"],
        note: `Auto-probe ${nowIso} · HTTP ${staging.status ?? "n/a"} · healthy=${String(staging.body?.healthy)}${staging.error ? ` · ${staging.error}` : ""}`,
      },
      {
        item_key: "prod.health",
        status: (prod.ok && prod.body?.healthy === true ? "done" : "blocked") as ChecklistItem["status"],
        note: `Auto-probe ${nowIso} · HTTP ${prod.status ?? "n/a"} · healthy=${String(prod.body?.healthy)}${prod.error ? ` · ${prod.error}` : ""}`,
      },
    ];
    const updated: { item_key: string; status: ChecklistItem["status"] }[] = [];
    for (const r of rows) {
      const patch = {
        status: r.status,
        notes: r.note,
        completed_at: r.status === "done" ? nowIso : null,
        completed_by: r.status === "done" ? context.userId : null,
      };
      const { error } = await context.supabase
        .from("operator_checklist_items")
        .update(patch)
        .eq("item_key", r.item_key);
      if (!error) updated.push({ item_key: r.item_key, status: r.status });
    }
    await writeAudit(context.supabase, context.userId, "sre.health.probe_and_update", "operator_checklist", null, {
      staging: { ok: staging.ok, status: staging.status, healthy: staging.body?.healthy },
      production: { ok: prod.ok, status: prod.status, healthy: prod.body?.healthy },
      updated,
    });
    return { probes: [staging, prod], updated };
  });

function checkPresent(name: string): boolean {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

export const getMonitoringVerification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MonitoringVerificationReport> => {
    await assertAdmin(context);

    const sentryDsnClient = checkPresent("VITE_SENTRY_DSN") || checkPresent("SENTRY_DSN");
    const sentryAuth = checkPresent("SENTRY_AUTH_TOKEN");
    const sentryOrg = process.env.SENTRY_ORG_SLUG ?? "higaet-5y";
    const sentryProject = process.env.SENTRY_PROJECT_SLUG ?? "higaet-core-engine";
    const ddApi = checkPresent("DATADOG_API_KEY");
    const ddApp = checkPresent("DATADOG_APP_KEY");
    const uptime = checkPresent("UPTIME_MONITOR_API_KEY") || checkPresent("UPTIMEROBOT_API_KEY");

    const signals: MonitoringSignal[] = [
      {
        key: "sentry.dsn",
        label: "Sentry DSN connectivity",
        configured: sentryDsnClient && sentryAuth,
        detail: sentryDsnClient
          ? sentryAuth
            ? "DSN present and auth token configured."
            : "DSN present but SENTRY_AUTH_TOKEN missing — release + sourcemap uploads will fail."
          : "SENTRY_DSN (or VITE_SENTRY_DSN) not configured.",
        links: [
          {
            label: "Sentry project",
            href: `https://sentry.io/organizations/${sentryOrg}/projects/${sentryProject}/`,
          },
          {
            label: "Sentry alerts",
            href: `https://sentry.io/organizations/${sentryOrg}/alerts/rules/`,
          },
        ],
      },
      {
        key: "datadog.synthetics",
        label: "Datadog synthetic availability",
        configured: ddApi && ddApp,
        detail:
          ddApi && ddApp
            ? "Datadog API + APP keys configured — synthetic monitors will run."
            : "DATADOG_API_KEY and/or DATADOG_APP_KEY missing — synthetics disabled (uptime provider used as fallback).",
        links: [
          { label: "Datadog synthetics", href: "https://app.datadoghq.com/synthetics/tests" },
          { label: "Datadog monitors", href: "https://app.datadoghq.com/monitors/manage" },
        ],
      },
      {
        key: "uptime.alerts",
        label: "Uptime + SSL alerting",
        configured: uptime,
        detail: uptime
          ? "External uptime provider credential present."
          : "No uptime provider credential detected. Configure a monitor for / and /api/public/sre/e2e-health with SSL expiry alerts.",
        links: [
          { label: "Runbook: incident response", href: "/dashboard/admin/observability" },
        ],
      },
    ];

    const configured = signals.filter((s) => s.configured).length;
    const overall: MonitoringVerificationReport["overall"] =
      configured === signals.length ? "ok" : configured === 0 ? "missing" : "partial";

    return { generatedAt: new Date().toISOString(), signals, overall };
  });

export const listChecklistItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChecklistItem[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("operator_checklist_items")
      .select(
        "id,item_key,category,title,description,is_required,status,completed_at,completed_by,notes,evidence_url,sort_order,updated_at",
      )
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ChecklistItem[];
  });

export const upsertChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      status: ChecklistItem["status"];
      notes?: string | null;
      evidence_url?: string | null;
    }) => {
      if (!input.id) throw new Error("id required");
      const allowed: ChecklistItem["status"][] = [
        "pending",
        "in_progress",
        "done",
        "blocked",
        "skipped",
      ];
      if (!allowed.includes(input.status)) throw new Error("invalid status");
      return input;
    },
  )
  .handler(async ({ context, data }): Promise<ChecklistItem> => {
    await assertAdmin(context);
    const patch = {
      status: data.status,
      notes: data.notes ?? null,
      evidence_url: data.evidence_url ?? null,
      completed_at: data.status === "done" ? new Date().toISOString() : null,
      completed_by: data.status === "done" ? context.userId : null,
    };
    const { data: updated, error } = await context.supabase
      .from("operator_checklist_items")
      .update(patch)
      .eq("id", data.id)
      .select(
        "id,item_key,category,title,description,is_required,status,completed_at,completed_by,notes,evidence_url,sort_order,updated_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return updated as ChecklistItem;
  });

export const buildLaunchReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LaunchReportBundle> => {
    await assertAdmin(context);

    // Fresh env readiness compute (source of truth at export time)
    const envReadiness = computeEnvReadiness();

    // Monitoring signals
    const sentryDsnClient = checkPresent("VITE_SENTRY_DSN") || checkPresent("SENTRY_DSN");
    const sentryAuth = checkPresent("SENTRY_AUTH_TOKEN");
    const ddApi = checkPresent("DATADOG_API_KEY");
    const ddApp = checkPresent("DATADOG_APP_KEY");
    const uptime = checkPresent("UPTIME_MONITOR_API_KEY") || checkPresent("UPTIMEROBOT_API_KEY");
    const monSignals: MonitoringSignal[] = [
      {
        key: "sentry.dsn",
        label: "Sentry DSN connectivity",
        configured: sentryDsnClient && sentryAuth,
        detail: sentryDsnClient && sentryAuth ? "OK" : "Missing DSN or auth token",
        links: [],
      },
      {
        key: "datadog.synthetics",
        label: "Datadog synthetic availability",
        configured: ddApi && ddApp,
        detail: ddApi && ddApp ? "OK" : "DATADOG keys missing",
        links: [],
      },
      {
        key: "uptime.alerts",
        label: "Uptime + SSL alerting",
        configured: uptime,
        detail: uptime ? "OK" : "No uptime provider credential",
        links: [],
      },
    ];
    const configuredCount = monSignals.filter((s) => s.configured).length;
    const monitoring: MonitoringVerificationReport = {
      generatedAt: new Date().toISOString(),
      signals: monSignals,
      overall:
        configuredCount === monSignals.length ? "ok" : configuredCount === 0 ? "missing" : "partial",
    };

    // Health probes (fresh)
    const [staging, prod] = await Promise.all([
      probeOne("staging", STAGING_URL),
      probeOne("production", PROD_URL),
    ]);
    const healthProbes = [staging, prod];

    // Checklist snapshot
    const { data: itemsRaw, error: chkErr } = await context.supabase
      .from("operator_checklist_items")
      .select(
        "id,item_key,category,title,description,is_required,status,completed_at,completed_by,notes,evidence_url,sort_order,updated_at",
      )
      .order("sort_order", { ascending: true });
    if (chkErr) throw new Error(chkErr.message);
    const items = (itemsRaw ?? []) as ChecklistItem[];
    const done = items.filter((i) => i.status === "done").length;
    const pending = items.filter((i) => i.status === "pending" || i.status === "in_progress").length;
    const blocked = items.filter((i) => i.status === "blocked").length;
    const requiredOutstanding = items.filter(
      (i) => i.is_required && i.status !== "done" && i.status !== "skipped",
    ).length;
    const checklistOverall: "ready" | "blocked" = requiredOutstanding === 0 ? "ready" : "blocked";

    // Overall decision
    const reasons: string[] = [];
    if (envReadiness.overall === "blocked")
      reasons.push(`Env readiness = blocked (${envReadiness.totals.blockingMissing} blocking secret(s) missing/malformed)`);
    if (!staging.ok) reasons.push(`Staging health probe failed (${staging.status ?? "network"})`);
    if (!prod.ok) reasons.push(`Production health probe failed (${prod.status ?? "network"})`);
    if (staging.body?.healthy === false) reasons.push("Staging health payload healthy=false");
    if (prod.body?.healthy === false) reasons.push("Production health payload healthy=false");
    if (requiredOutstanding > 0)
      reasons.push(`${requiredOutstanding} required checklist item(s) outstanding`);

    const overallDecision: "READY" | "BLOCKED" = reasons.length === 0 ? "READY" : "BLOCKED";

    return {
      kind: "higaet.production-launch-report",
      version: 1,
      generatedAt: new Date().toISOString(),
      deploymentTargets: { production: PROD_URL, staging: STAGING_URL },
      envReadiness,
      monitoring,
      healthProbes,
      checklist: {
        items,
        summary: {
          total: items.length,
          done,
          pending,
          blocked,
          requiredOutstanding,
          overall: checklistOverall,
        },
      },
      attachments: {
        runUrls: [
          { label: "SRE E2E workflow runs", href: "https://github.com/higaetapple-stack/higaet/actions/workflows/sre-e2e.yml" },
          { label: "Launch readiness workflow", href: "https://github.com/higaetapple-stack/higaet/actions/workflows/launch-readiness.yml" },
          { label: "PR checks", href: "https://github.com/higaetapple-stack/higaet/actions/workflows/pr-checks.yml" },
        ],
        docs: [
          { label: "Secret verification", href: "/docs/production-secret-verification.md" },
          { label: "Backup + restore", href: "/docs/supabase-backup-restore-verification.md" },
          { label: "Launch report doc", href: "/docs/HIGAET-production-launch-report.md" },
        ],
      },
      overallDecision,
      decisionReasons: reasons,
    };
  });
