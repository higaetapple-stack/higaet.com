#!/usr/bin/env node
/**
 * RLS integration matrix — resource × role × operation.
 *
 * Verifies the security model end-to-end against the live database using
 * publishable + service-role keys:
 *   - Anonymous can only do what TO anon policies explicitly allow.
 *   - Authenticated student cannot read privileged tables.
 *   - Admin (via service role) can manage ai_usage.
 *
 * Required env:
 *   SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY,
 *   TEST_FIXTURE_PASSWORD
 *
 * Skips with exit 0 when env is missing (so local devs without secrets
 * don't trip CI on unrelated paths). The launch-readiness workflow injects
 * all four secrets.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PWD = process.env.TEST_FIXTURE_PASSWORD;

if (!URL || !ANON || !SVC || !PWD) {
  console.log("rls-matrix: skipped (missing SUPABASE_* / TEST_FIXTURE_PASSWORD)");
  process.exit(0);
}

const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const admin = createClient(URL, SVC, { auth: { persistSession: false } });

const results = [];
function record(resource, role, op, expected, actual) {
  const pass = expected === actual;
  results.push({ resource, role, op, expected, actual, pass });
  const tag = pass ? "PASS" : "FAIL";
  console.log(`[${tag}] ${resource} / ${role} / ${op}  expected=${expected} actual=${actual}`);
}

async function studentClient() {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({
    email: "student.test@higaet.dev",
    password: PWD,
  });
  if (error) throw new Error(`student sign-in failed: ${error.message}`);
  return c;
}

// ---------- leads ----------
{
  // anon may INSERT (public lead capture), must NOT SELECT.
  const ins = await anon.from("study_abroad_leads").insert({
    full_name: "rls-test",
    email: `rls-${Date.now()}@example.test`,
  });
  record("study_abroad_leads", "anon", "INSERT", "allow", ins.error ? "deny" : "allow");

  const sel = await anon.from("study_abroad_leads").select("id").limit(1);
  record("study_abroad_leads", "anon", "SELECT", "deny", sel.error || (sel.data?.length ?? 0) === 0 ? "deny" : "allow");
}

// ---------- portfolio (profiles) ----------
{
  // anon SELECT must succeed only via portfolio_visibility='public'; bare select returns 0 rows.
  const sel = await anon.from("profiles").select("id,portfolio_visibility").eq("portfolio_visibility", "public").limit(1);
  record("profiles", "anon", "SELECT(public)", "allow", sel.error ? "deny" : "allow");

  const upd = await anon.from("profiles").update({ full_name: "x" }).neq("id", "00000000-0000-0000-0000-000000000000");
  record("profiles", "anon", "UPDATE", "deny", upd.error ? "deny" : "allow");
}

// ---------- ai_usage ----------
{
  const sel = await anon.from("ai_usage").select("id").limit(1);
  record("ai_usage", "anon", "SELECT", "deny", sel.error || (sel.data?.length ?? 0) === 0 ? "deny" : "allow");

  const student = await studentClient();
  const selS = await student.from("ai_usage").select("id").limit(1);
  record("ai_usage", "student", "SELECT", "deny", selS.error || (selS.data?.length ?? 0) === 0 ? "deny" : "allow");

  // service role bypasses RLS.
  const selA = await admin.from("ai_usage").select("id").limit(1);
  record("ai_usage", "service_role", "SELECT", "allow", selA.error ? "deny" : "allow");
}

const failed = results.filter((r) => !r.pass);
console.log(`\nRLS matrix: ${results.length - failed.length}/${results.length} pass`);
process.exit(failed.length ? 1 : 0);
