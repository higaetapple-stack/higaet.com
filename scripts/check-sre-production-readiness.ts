#!/usr/bin/env node
/**
 * Verifies the runtime env has everything the SRE E2E pipeline needs.
 *
 * Exit codes:
 *   0 — production ready
 *   1 — one or more checks failed
 */
/* eslint-disable no-console */

interface Check {
  name: string;
  ok: boolean;
  detail?: string;
}

const checks: Check[] = [];
const add = (name: string, ok: boolean, detail?: string) =>
  checks.push({ name, ok, detail });

// 1. Required environment variables
const requireEnv = (name: string) => {
  const v = process.env[name];
  add(`env ${name}`, Boolean(v), v ? "set" : "missing");
};
requireEnv("GITHUB_TOKEN");
requireEnv("GITHUB_REPO");
requireEnv("SRE_E2E_TRIGGER_SECRET");

// 2. Repository format
const repo = process.env.GITHUB_REPO ?? "";
add(
  "GITHUB_REPO format",
  /^[^/\s]+\/[^/\s]+$/.test(repo),
  repo ? `value="${repo}"` : "empty",
);

// 3. No localhost URLs in URL-shaped env
for (const key of ["SUPABASE_URL", "GITHUB_API_URL"]) {
  const v = process.env[key];
  if (!v) continue;
  add(`${key} not localhost`, !/localhost|127\.0\.0\.1/.test(v));
}

// 4. Poll configuration bounds
const attempts = Number(process.env.SRE_CI_POLL_ATTEMPTS ?? 40);
const interval = Number(process.env.SRE_CI_POLL_INTERVAL_MS ?? 10000);
add(
  "SRE_CI_POLL_ATTEMPTS in [1,120]",
  Number.isFinite(attempts) && attempts >= 1 && attempts <= 120,
  `value=${attempts}`,
);
add(
  "SRE_CI_POLL_INTERVAL_MS in [1000,60000]",
  Number.isFinite(interval) && interval >= 1000 && interval <= 60000,
  `value=${interval}`,
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
}
if (failed.length === 0) {
  console.log("\nSRE production readiness OK");
  process.exit(0);
} else {
  console.error(`\n${failed.length} check(s) failed:`);
  for (const c of failed) console.error(`  - ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
  process.exit(1);
}
