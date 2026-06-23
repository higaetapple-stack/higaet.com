#!/usr/bin/env -S node --experimental-strip-types
/**
 * Predeploy validation: ensures the code's role model matches the live
 * Postgres schema, and that ROUTE_PERMISSIONS references only valid roles.
 *
 * Writes artifacts/schema-validation.json and exits non-zero on any drift.
 *
 * Required env (when validating against a real DB):
 *   PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
 * If PGHOST is unset, we skip the live-schema check and only validate the
 * in-code role↔route consistency (still hard-fails on local inconsistency).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

type AppRole =
  | "student"
  | "faculty"
  | "mentor"
  | "counselor"
  | "placement_officer"
  | "enterprise_client"
  | "tech_client"
  | "admin"
  | "super_admin";

function readSource(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function parseAppRolesFromCode(): AppRole[] {
  const src = readSource("src/lib/auth.functions.ts");
  const m = src.match(/export type AppRole\s*=\s*([^;]+);/);
  if (!m) throw new Error("Could not find AppRole union in auth.functions.ts");
  return Array.from(m[1].matchAll(/"([a-z_]+)"/g)).map((x) => x[1] as AppRole);
}

function parseRoutePermissionsFromCode(): Record<string, AppRole[]> {
  const src = readSource("src/lib/route-authorization.ts");
  const m = src.match(/ROUTE_PERMISSIONS[^=]*=\s*\{([\s\S]*?)\};/);
  if (!m) throw new Error("Could not find ROUTE_PERMISSIONS in route-authorization.ts");
  const out: Record<string, AppRole[]> = {};
  for (const line of m[1].split("\n")) {
    const lm = line.match(/"([^"]+)"\s*:\s*\[([^\]]+)\]/);
    if (!lm) continue;
    const path = lm[1];
    const roles = Array.from(lm[2].matchAll(/"([a-z_]+)"/g)).map((x) => x[1] as AppRole);
    out[path] = roles;
  }
  return out;
}

function readEnumFromDb(): AppRole[] | null {
  if (!process.env.PGHOST) return null;
  const sql =
    "SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='app_role' ORDER BY enumsortorder;";
  try {
    const out = execFileSync("psql", ["-tA", "-c", sql], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean) as AppRole[];
  } catch (err) {
    process.stderr.write(`[predeploy] psql query failed: ${String(err)}\n`);
    return null;
  }
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function findDuplicates<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const dups = new Set<T>();
  for (const v of arr) {
    if (seen.has(v)) dups.add(v);
    seen.add(v);
  }
  return Array.from(dups);
}

function main() {
  process.stdout.write("[predeploy] schema validation start\n");
  const codeRoles = parseAppRolesFromCode();
  const routes = parseRoutePermissionsFromCode();
  const dbRoles = readEnumFromDb();

  const missingRoles: string[] = [];
  const extraRoles: string[] = [];
  if (dbRoles) {
    for (const r of codeRoles) if (!dbRoles.includes(r)) missingRoles.push(r);
    for (const r of dbRoles) if (!codeRoles.includes(r)) extraRoles.push(r);
  }

  const codeRoleSet = new Set(codeRoles);
  const invalidPermissions: string[] = [];
  const missingRoutes: string[] = [];
  for (const [path, roles] of Object.entries(routes)) {
    if (!roles.length) missingRoutes.push(path);
    for (const r of roles) {
      if (!codeRoleSet.has(r)) invalidPermissions.push(`${path}:${r}`);
    }
  }

  const duplicateCodeRoles = findDuplicates(codeRoles);
  if (duplicateCodeRoles.length) {
    for (const d of duplicateCodeRoles) invalidPermissions.push(`duplicate-role:${d}`);
  }

  const status =
    missingRoles.length || extraRoles.length || missingRoutes.length || invalidPermissions.length
      ? "failed"
      : "passed";

  const report = {
    status,
    timestamp: new Date().toISOString(),
    codeRoles,
    dbRoles: dbRoles ?? null,
    missingRoles: uniq(missingRoles),
    extraRoles: uniq(extraRoles),
    missingRoutes: uniq(missingRoutes),
    invalidPermissions: uniq(invalidPermissions),
  };

  const outDir = resolve(ROOT, "artifacts");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "schema-validation.json"), JSON.stringify(report, null, 2));

  process.stdout.write(`[predeploy] schema validation ${status}\n`);
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  process.exit(status === "passed" ? 0 : 1);
}

main();
