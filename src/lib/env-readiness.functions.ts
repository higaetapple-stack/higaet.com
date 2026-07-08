import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only environment readiness check.
 *
 * Reports presence-only (never the value) of every runtime secret required
 * for production. Category-level `blocking` marks whether a missing item
 * prevents production deployment.
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
}

interface Spec {
  name: string;
  blocking: boolean;
  hint?: string;
  validate?: (v: string) => string | null;
}

function check(spec: Spec): SecretCheck {
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

const GROUPS: Array<{ category: string; description: string; required: boolean; specs: Spec[] }> = [
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

export const getEnvReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EnvReadinessReport> => {
    const { data: allowed, error } = await context.supabase.rpc("has_any_role", {
      _user_id: context.userId,
      _roles: ["admin", "super_admin"],
    });
    if (error) throw new Error(error.message);
    if (!allowed) throw new Error("Forbidden");

    const groups: SecretGroup[] = GROUPS.map((g) => ({
      category: g.category,
      description: g.description,
      required: g.required,
      checks: g.specs.map(check),
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
  });
