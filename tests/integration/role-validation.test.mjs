// Role validation: AppRole union in code must match the app_role enum in DB.
// Run via:  node tests/integration/role-validation.test.mjs
// Skips silently when PGHOST is unset (e.g. local without DB access).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function parseAppRoles() {
  const src = readFileSync("src/lib/auth.functions.ts", "utf8");
  const m = src.match(/export type AppRole\s*=\s*([^;]+);/);
  if (!m) throw new Error("AppRole union not found");
  return Array.from(m[1].matchAll(/"([a-z_]+)"/g)).map((x) => x[1]);
}

function readDbEnum() {
  if (!process.env.PGHOST) return null;
  const out = execFileSync(
    "psql",
    [
      "-tA",
      "-c",
      "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='app_role' ORDER BY enumsortorder;",
    ],
    { encoding: "utf8" },
  );
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}

function assertEqualSets(a, b, msg) {
  const sa = new Set(a);
  const sb = new Set(b);
  const missing = [...sa].filter((x) => !sb.has(x));
  const extra = [...sb].filter((x) => !sa.has(x));
  if (missing.length || extra.length) {
    throw new Error(`${msg} — missing in DB: [${missing}], extra in DB: [${extra}]`);
  }
}

const code = parseAppRoles();
const db = readDbEnum();
if (!db) {
  process.stdout.write("[role-validation] PGHOST unset — skipped DB check\n");
  process.exit(0);
}
assertEqualSets(code, db, "AppRole vs app_role enum drift");
process.stdout.write(`[role-validation] OK — ${code.length} roles aligned\n`);
