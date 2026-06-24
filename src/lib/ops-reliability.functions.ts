import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "@/lib/auth.functions";

const OPS_ROLES: AppRole[] = ["ops", "admin", "super_admin"];

async function assertOps(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: { role: string }) => r.role as AppRole);
  if (!roles.some((r) => OPS_ROLES.includes(r))) {
    throw new Error("Forbidden: requires ops, admin, or super_admin role");
  }
}

// ---------- GitHub helpers ----------
function ghEnv() {
  const token = process.env.GITHUB_OPS_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  return { token, owner, repo, configured: !!(token && owner && repo) };
}

async function gh<T = unknown>(path: string): Promise<T | null> {
  const { token, configured } = ghEnv();
  if (!configured) return null;
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    console.error("GitHub API error", res.status, path);
    return null;
  }
  return (await res.json()) as T;
}

// ---------- Types ----------
export type ControllerState = {
  configured: boolean;
  runId: number | null;
  runUrl: string | null;
  runStatus: string | null;
  runConclusion: string | null;
  createdAt: string | null;
  headSha: string | null;
  headBranch: string | null;
  actor: string | null;
};

export type IncidentRow = {
  number: number;
  title: string;
  url: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  count: number;
  diagnosis: string;
  updatedAt: string;
};

export type AuditRow = {
  id: string;
  ts: string;
  sha: string;
  branch: string;
  actor: string | null;
  run_url: string | null;
  decision: string;
  decision_source: string | null;
  decision_reason: string | null;
  executed: boolean;
  execute_reason: string | null;
  system_health_score: number | null;
  risk_level: string | null;
  platform_state: string | null;
  system_mode: string | null;
  autonomous_mode: string | null;
  diagnosis: string | null;
};

const RangeSchema = z.object({
  range: z.enum(["24h", "7d", "30d"]).default("7d"),
});

function rangeStart(range: "24h" | "7d" | "30d"): Date {
  const ms =
    range === "24h" ? 24 * 3600_000 : range === "7d" ? 7 * 86400_000 : 30 * 86400_000;
  return new Date(Date.now() - ms);
}

// ---------- Server functions ----------

export const getLiveControllerState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ControllerState> => {
    await assertOps(context.supabase, context.userId);
    const { configured, owner, repo } = ghEnv();
    if (!configured) {
      return {
        configured: false,
        runId: null,
        runUrl: null,
        runStatus: null,
        runConclusion: null,
        createdAt: null,
        headSha: null,
        headBranch: null,
        actor: null,
      };
    }
    const data = await gh<{
      workflow_runs: Array<{
        id: number;
        html_url: string;
        status: string;
        conclusion: string | null;
        created_at: string;
        head_sha: string;
        head_branch: string;
        actor: { login: string } | null;
        name: string;
      }>;
    }>(`/repos/${owner}/${repo}/actions/runs?per_page=20`);
    const run = data?.workflow_runs.find((r) =>
      r.name?.startsWith("HIGAET Brevo CI/CD"),
    );
    if (!run) {
      return {
        configured: true,
        runId: null,
        runUrl: null,
        runStatus: null,
        runConclusion: null,
        createdAt: null,
        headSha: null,
        headBranch: null,
        actor: null,
      };
    }
    return {
      configured: true,
      runId: run.id,
      runUrl: run.html_url,
      runStatus: run.status,
      runConclusion: run.conclusion,
      createdAt: run.created_at,
      headSha: run.head_sha,
      headBranch: run.head_branch,
      actor: run.actor?.login ?? null,
    };
  });

function severityFor(body: string, title: string): IncidentRow["severity"] {
  const m = body.match(/<!-- severity:(\w+) -->/);
  const s = m?.[1]?.toUpperCase();
  if (s === "CRITICAL" || s === "HIGH" || s === "MEDIUM" || s === "LOW") return s;
  if (/CRITICAL|BREVO_SECRET_LEAK|BREVO_AUTH/.test(title)) return "CRITICAL";
  return "LOW";
}

export const getOpenIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IncidentRow[]> => {
    await assertOps(context.supabase, context.userId);
    const { configured, owner, repo } = ghEnv();
    if (!configured) return [];
    const data = await gh<
      Array<{
        number: number;
        title: string;
        html_url: string;
        body: string | null;
        updated_at: string;
      }>
    >(
      `/repos/${owner}/${repo}/issues?state=open&labels=incident,brevo&per_page=100`,
    );
    if (!data) return [];
    return data.map((i) => {
      const body = i.body ?? "";
      const cm = body.match(/<!-- count:(\d+) -->/);
      const count = cm ? parseInt(cm[1], 10) : 1;
      const diagMatch =
        body.match(/\*\*DIAGNOSIS:\*\*\s*`([^`]+)`/) ??
        i.title.match(/\b([A-Z_]+)\b/);
      return {
        number: i.number,
        title: i.title,
        url: i.html_url,
        severity: severityFor(body, i.title),
        count,
        diagnosis: diagMatch?.[1] ?? "UNKNOWN",
        updatedAt: i.updated_at,
      };
    });
  });

export const getAuditRows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RangeSchema.parse(d))
  .handler(async ({ data, context }): Promise<AuditRow[]> => {
    await assertOps(context.supabase, context.userId);
    const since = rangeStart(data.range).toISOString();
    const { data: rows, error } = await context.supabase
      .from("ci_audit_log")
      .select(
        "id, ts, sha, branch, actor, run_url, decision, decision_source, decision_reason, executed, execute_reason, system_health_score, risk_level, platform_state, system_mode, autonomous_mode, diagnosis",
      )
      .gte("ts", since)
      .order("ts", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (rows ?? []) as AuditRow[];
  });

export type TrendPoint = {
  bucket: string;
  health: number | null;
  risk: number | null;
  incidents: number;
  retries: number;
};

export const getAuditTrends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RangeSchema.parse(d))
  .handler(async ({ data, context }): Promise<TrendPoint[]> => {
    await assertOps(context.supabase, context.userId);
    const since = rangeStart(data.range).toISOString();
    const { data: rows, error } = await context.supabase
      .from("ci_audit_log")
      .select("ts, system_health_score, risk_level, diagnosis, decision")
      .gte("ts", since)
      .order("ts", { ascending: true });
    if (error) throw new Error(error.message);

    const bucketMs = data.range === "24h" ? 3600_000 : 86400_000;
    const buckets = new Map<
      string,
      { health: number[]; risk: number[]; incidents: number; retries: number }
    >();
    const riskScore: Record<string, number> = { LOW: 10, MEDIUM: 40, HIGH: 70, CRITICAL: 95 };

    for (const r of rows ?? []) {
      const t = new Date(r.ts as string).getTime();
      const key = new Date(Math.floor(t / bucketMs) * bucketMs).toISOString();
      const entry =
        buckets.get(key) ??
        { health: [], risk: [], incidents: 0, retries: 0 };
      if (r.system_health_score != null) entry.health.push(r.system_health_score);
      if (r.risk_level && riskScore[r.risk_level]) entry.risk.push(riskScore[r.risk_level]);
      if (r.decision === "BLOCK" || r.decision === "ROLLBACK") entry.incidents += 1;
      if (r.diagnosis === "BREVO_NETWORK_OR_TIMEOUT") entry.retries += 1;
      buckets.set(key, entry);
    }

    const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
    return Array.from(buckets.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([bucket, v]) => ({
        bucket,
        health: avg(v.health),
        risk: avg(v.risk),
        incidents: v.incidents,
        retries: v.retries,
      }));
  });

export type GovernanceState = {
  systemMode: "NORMAL" | "FREEZE" | "UNKNOWN";
  autonomousMode: "ENABLED" | "DISABLED" | "UNKNOWN";
  recentOverrides: AuditRow[];
};

export const getGovernanceState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GovernanceState> => {
    await assertOps(context.supabase, context.userId);
    const { configured, owner, repo } = ghEnv();
    let systemMode: GovernanceState["systemMode"] = "UNKNOWN";
    let autonomousMode: GovernanceState["autonomousMode"] = "UNKNOWN";
    if (configured) {
      const a = await gh<{ value: string }>(
        `/repos/${owner}/${repo}/actions/variables/SYSTEM_MODE`,
      );
      const b = await gh<{ value: string }>(
        `/repos/${owner}/${repo}/actions/variables/AUTONOMOUS_MODE`,
      );
      const sm = a?.value?.toUpperCase();
      const am = b?.value?.toUpperCase();
      systemMode = sm === "FREEZE" ? "FREEZE" : sm === "NORMAL" ? "NORMAL" : "NORMAL";
      autonomousMode = am === "DISABLED" ? "DISABLED" : am === "ENABLED" ? "ENABLED" : "ENABLED";
    }

    const { data: rows } = await context.supabase
      .from("ci_audit_log")
      .select(
        "id, ts, sha, branch, actor, run_url, decision, decision_source, decision_reason, executed, execute_reason, system_health_score, risk_level, platform_state, system_mode, autonomous_mode, diagnosis",
      )
      .ilike("decision_source", "OVERRIDE%")
      .order("ts", { ascending: false })
      .limit(10);

    return {
      systemMode,
      autonomousMode,
      recentOverrides: (rows ?? []) as AuditRow[],
    };
  });

export type BrevoReliability = {
  totalRuns: number;
  authSuccessRate: number;
  authFailures: number;
  timeouts: number;
  endpointSuccessRate: number;
  lastVerifiedAt: string | null;
};

export const getBrevoReliability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RangeSchema.parse(d))
  .handler(async ({ data, context }): Promise<BrevoReliability> => {
    await assertOps(context.supabase, context.userId);
    const since = rangeStart(data.range).toISOString();
    const { data: rows, error } = await context.supabase
      .from("ci_audit_log")
      .select("ts, diagnosis")
      .gte("ts", since)
      .order("ts", { ascending: false });
    if (error) throw new Error(error.message);

    const total = rows?.length ?? 0;
    let authFailures = 0;
    let timeouts = 0;
    let endpointFailures = 0;
    let lastVerifiedAt: string | null = null;

    for (const r of rows ?? []) {
      const d = r.diagnosis ?? "";
      if (/BREVO_AUTH_(FAILED|FORBIDDEN)/.test(d)) authFailures++;
      if (d === "BREVO_NETWORK_OR_TIMEOUT") timeouts++;
      if (d === "EMAIL_ENDPOINT_BROKEN" || d === "EMAIL_LOGIC_FAIL") endpointFailures++;
      if (!lastVerifiedAt && (d === "EMAIL_SYSTEM_OK" || d === "BREVO_AUTH_OK")) {
        lastVerifiedAt = r.ts as string;
      }
    }

    const authSuccessRate = total === 0 ? 100 : Math.round(((total - authFailures) / total) * 100);
    const endpointSuccessRate =
      total === 0 ? 100 : Math.round(((total - endpointFailures) / total) * 100);

    return { totalRuns: total, authSuccessRate, authFailures, timeouts, endpointSuccessRate, lastVerifiedAt };
  });
