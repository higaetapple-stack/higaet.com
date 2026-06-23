#!/usr/bin/env node
/**
 * Idempotent E2E test-user seeder (DEV / STAGING ONLY).
 *
 * Provisions a fixed set of users with deterministic emails, hashes a password
 * supplied via TEST_FIXTURE_PASSWORD, and assigns a single role per user from
 * the existing app_role enum. Safe to re-run.
 *
 * Refuses to run when ENVIRONMENT=production or VITE_APP_ENV=production.
 *
 * Required env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   TEST_FIXTURE_PASSWORD
 */

import { createClient } from "@supabase/supabase-js";

const env = process.env;
if (env.ENVIRONMENT === "production" || env.VITE_APP_ENV === "production") {
  console.error("Refusing to seed test users in production.");
  process.exit(2);
}
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const password = env.TEST_FIXTURE_PASSWORD;
if (!url || !key || !password) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or TEST_FIXTURE_PASSWORD.");
  process.exit(2);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

// Only roles present in app_role enum.
const FIXTURES = [
  { email: "student.test@higaet.dev", role: "student", full_name: "Test Student" },
  { email: "counselor.test@higaet.dev", role: "counselor", full_name: "Test Counselor" },
  { email: "faculty.test@higaet.dev", role: "faculty", full_name: "Test Faculty" },
  { email: "admin.test@higaet.dev", role: "admin", full_name: "Test Admin" },
];

async function ensureUser(f) {
  // Look up by email (paginated listUsers — fine at this scale).
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;
  let user = list.users.find((u) => u.email === f.email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: f.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: f.full_name, seeded: true },
    });
    if (error) throw error;
    user = data.user;
    console.log(`  created ${f.email}`);
  } else {
    // Reset password to keep tests deterministic.
    const { error } = await admin.auth.admin.updateUserById(user.id, { password });
    if (error) throw error;
    console.log(`  refreshed ${f.email}`);
  }
  // Role assignment — idempotent via unique (user_id, role).
  const { error: roleErr } = await admin
    .from("user_roles")
    .upsert({ user_id: user.id, role: f.role }, { onConflict: "user_id,role", ignoreDuplicates: true });
  if (roleErr) throw roleErr;
  return user;
}

(async () => {
  console.log(`Seeding ${FIXTURES.length} test users against ${url}…`);
  for (const f of FIXTURES) await ensureUser(f);
  console.log("Done.");
})().catch((e) => {
  console.error("Seed failed:", e.message ?? e);
  process.exit(1);
});
