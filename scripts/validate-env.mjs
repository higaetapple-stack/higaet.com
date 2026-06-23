#!/usr/bin/env node
// Validates the runtime environment variables required by HIGAET production.
// Usage: node scripts/validate-env.mjs [--strict]
//   --strict : exit non-zero on any missing CRITICAL var (default).
//   Without --strict, missing vars are reported but exit code stays 0.

const REQUIRED = {
  critical: [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SESSION_SECRET",
  ],
  ai: [
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
  ],
  aiOptional: [
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
    "HUGGINGFACE_API_KEY",
    "HF_TOKEN",
    "NVIDIA_API_KEY",
  ],
  payments: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  cloudflare: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
  storage: ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT"],
};

const strict = process.argv.includes("--strict") || !process.argv.includes("--soft");
const missing = { critical: [], ai: [], payments: [], cloudflare: [], storage: [], aiOptional: [] };

for (const [bucket, names] of Object.entries(REQUIRED)) {
  for (const n of names) {
    if (!process.env[n]) missing[bucket].push(n);
  }
}

const hasAnyHfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
missing.aiOptional = missing.aiOptional.filter((n) => !(hasAnyHfToken && (n === "HUGGINGFACE_API_KEY" || n === "HF_TOKEN")));

const report = {
  critical_missing: missing.critical,
  ai_primary_missing: missing.ai,
  ai_fallback_missing: missing.aiOptional,
  payments_missing: missing.payments,
  cloudflare_missing: missing.cloudflare,
  storage_missing: missing.storage,
};
console.log(JSON.stringify(report, null, 2));

if (strict && (missing.critical.length || missing.ai.length || missing.payments.length)) {
  console.error("\n[validate-env] strict mode: critical or production-required vars missing");
  process.exit(1);
}
