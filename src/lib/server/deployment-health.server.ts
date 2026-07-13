/**
 * Deployment health checks (server-only).
 *
 * Runs granular dependency probes so /readyz and /api/public/health can
 * pinpoint 503 causes: artifact present, required env vars, Supabase
 * connectivity (service-role query), and port binding.
 *
 * SECURITY: This module imports the service-role Supabase client. The
 * `.server.ts` extension keeps it out of client bundles.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type CheckStatus = "ok" | "fail" | "skip";

export interface HealthCheck {
  name: string;
  status: CheckStatus;
  detail?: string;
  latencyMs?: number;
}

export interface HealthReport {
  ready: boolean;
  checks: HealthCheck[];
  timestamp: string;
}

const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
] as const;

function resolveServerBundlePath(): string {
  // Server bundle sits at .output/server/index.mjs relative to the app root.
  // From inside the running bundle, __filename === .output/server/index.mjs,
  // so its own path IS the artifact path when we're actually running.
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    // walk up until we find `.output/server` or give up
    return resolve(here, "..", "server", "index.mjs");
  } catch {
    return resolve(process.cwd(), ".output/server/index.mjs");
  }
}

function checkArtifact(): HealthCheck {
  const path = resolveServerBundlePath();
  const present = existsSync(path);
  return {
    name: "artifact",
    status: present ? "ok" : "fail",
    detail: present ? `found: ${path}` : `missing: ${path}`,
  };
}

function checkEnv(): HealthCheck {
  const missing = REQUIRED_ENV.filter((v) => !process.env[v]);
  return {
    name: "env",
    status: missing.length === 0 ? "ok" : "fail",
    detail:
      missing.length === 0
        ? `all ${REQUIRED_ENV.length} required vars present`
        : `missing: ${missing.join(", ")}`,
  };
}

function checkPortBinding(): HealthCheck {
  // If this handler is executing, the SSR worker is bound to a port.
  // Report the port the runtime advertises so ops can confirm it matches
  // the Passenger contract.
  const port = process.env.PORT ?? "(unset)";
  return {
    name: "port_binding",
    status: "ok",
    detail: `serving on PORT=${port}`,
  };
}

async function checkSupabase(): Promise<HealthCheck> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return {
      name: "supabase",
      status: "fail",
      detail: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set",
    };
  }

  const started = Date.now();
  try {
    // Minimal server-only query via PostgREST HEAD /rest/v1/ — no schema
    // knowledge required, exercises credentials + RLS bypass path, and
    // fails fast if the key is wrong (returns 401/403 with a JSON hint).
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${url}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Accept-Profile": "public",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - started;

    if (res.status >= 200 && res.status < 400) {
      return {
        name: "supabase",
        status: "ok",
        detail: `PostgREST reachable (HTTP ${res.status})`,
        latencyMs,
      };
    }

    let hint = "";
    try {
      const body = (await res.json()) as { message?: string; hint?: string };
      hint = body.message
        ? ` — ${body.message}${body.hint ? ` (${body.hint})` : ""}`
        : "";
    } catch {
      /* body not JSON */
    }
    return {
      name: "supabase",
      status: "fail",
      detail: `PostgREST HTTP ${res.status}${hint}. Verify SUPABASE_SERVICE_ROLE_KEY matches SUPABASE_URL and RLS grants are in place.`,
      latencyMs,
    };
  } catch (err) {
    return {
      name: "supabase",
      status: "fail",
      detail: `network error: ${err instanceof Error ? err.message : String(err)}`,
      latencyMs: Date.now() - started,
    };
  }
}

export async function buildHealthReport(
  opts: { checkSupabaseConnectivity?: boolean } = {},
): Promise<HealthReport> {
  const checks: HealthCheck[] = [checkArtifact(), checkEnv(), checkPortBinding()];
  if (opts.checkSupabaseConnectivity !== false) {
    checks.push(await checkSupabase());
  }
  const ready = checks.every((c) => c.status !== "fail");
  return {
    ready,
    checks,
    timestamp: new Date().toISOString(),
  };
}
