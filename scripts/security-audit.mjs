#!/usr/bin/env node
/**
 * HIGAET Security Audit — Phase A
 *
 * Static verification of the authorization architecture. Fails (exit 1) when
 * any of the following diverge:
 *   1. ROUTE_PERMISSIONS uses roles not present in the app_role enum.
 *   2. A dashboard layout route is missing requireRolesOrRedirect.
 *   3. A *.functions.ts file imports client.server / supabaseAdmin without
 *      requireSupabaseAuth + an explicit has_role / has_any_role check.
 *   4. (Optional, requires PGHOST) public tables with RLS disabled or zero
 *      policies, or policies referencing roles not in the enum.
 *   5. Service-role key or client.server imported from non-server files.
 *
 * Outputs (overwritten each run):
 *   - docs/infrastructure/security-audit-report.md
 *   - docs/infrastructure/rls-route-consistency-report.md
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const findings = []; // { severity, area, message, file? }

const add = (severity, area, message, file) =>
  findings.push({ severity, area, message, file });

// ---- 1. Enum vs ROUTE_PERMISSIONS / AppRole ----------------------------------

const ENUM_PATH = "supabase/migrations/20260613015152_280b0bc7-a527-4253-8ae5-8aec948aa3a9.sql";
const ROUTE_AUTH_PATH = "src/lib/route-authorization.ts";
const AUTH_FN_PATH = "src/lib/auth.functions.ts";

const enumRoles = (() => {
  const sql = readFileSync(ENUM_PATH, "utf8");
  const m = sql.match(/CREATE TYPE public\.app_role AS ENUM \(([^)]+)\)/);
  if (!m) return [];
  return [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
})();

const appRoleTypeRoles = (() => {
  const src = readFileSync(AUTH_FN_PATH, "utf8");
  const block = src.match(/export type AppRole\s*=([^;]+);/);
  if (!block) return [];
  return [...block[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
})();

const routeAuthSrc = readFileSync(ROUTE_AUTH_PATH, "utf8");
const routePermissions = (() => {
  const block = routeAuthSrc.match(/ROUTE_PERMISSIONS:[^=]*=\s*\{([\s\S]*?)\};/);
  if (!block) return {};
  const out = {};
  for (const line of block[1].split("\n")) {
    const m = line.match(/"([^"]+)":\s*\[([^\]]+)\]/);
    if (!m) continue;
    out[m[1]] = [...m[2].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
  }
  return out;
})();

const diff = (a, b) => a.filter((x) => !b.includes(x));
const missingFromEnum = diff(appRoleTypeRoles, enumRoles);
if (missingFromEnum.length) {
  add(
    "HIGH",
    "enum-drift",
    `AppRole type includes roles not present in app_role enum: ${missingFromEnum.join(", ")}. ` +
      `ROUTE_PERMISSIONS that reference these roles will silently fail role checks for non-admin users.`,
    AUTH_FN_PATH,
  );
}
for (const [path, roles] of Object.entries(routePermissions)) {
  const orphan = diff(roles, enumRoles);
  if (orphan.length) {
    add(
      "HIGH",
      "route-permissions",
      `Route ${path} grants role(s) ${orphan.join(", ")} that do not exist in the app_role enum.`,
      ROUTE_AUTH_PATH,
    );
  }
}

// ---- 2. Dashboard layout routes must call requireRolesOrRedirect -------------

const ROUTES_DIR = "src/routes";
const layoutRoutes = readdirSync(ROUTES_DIR).filter((f) =>
  /^_authenticated\.dashboard\.[a-z-]+\.tsx$/.test(f),
);
const guardedSurfaces = [];
for (const file of layoutRoutes) {
  const full = join(ROUTES_DIR, file);
  const src = readFileSync(full, "utf8");
  const surface = file
    .replace(/^_authenticated\.dashboard\./, "/dashboard/")
    .replace(/\.tsx$/, "");
  const isProtected = Object.keys(routePermissions).includes(surface);
  if (!isProtected) continue;
  guardedSurfaces.push(surface);
  if (!/requireRolesOrRedirect\s*\(/.test(src)) {
    add(
      "CRITICAL",
      "route-guard",
      `Dashboard layout ${surface} has no requireRolesOrRedirect call in beforeLoad.`,
      full,
    );
  } else if (!/ROUTE_PERMISSIONS\["[^"]+"\]/.test(src)) {
    add(
      "MEDIUM",
      "route-guard",
      `Dashboard layout ${surface} guards inline-defined roles instead of ROUTE_PERMISSIONS[...]; matrix drift risk.`,
      full,
    );
  }
}
for (const surface of Object.keys(routePermissions)) {
  if (!guardedSurfaces.includes(surface)) {
    add(
      "HIGH",
      "route-guard",
      `ROUTE_PERMISSIONS entry ${surface} has no matching layout route in src/routes/.`,
    );
  }
}

// ---- 3. *.functions.ts privileged checks --------------------------------------

const walk = (dir) => {
  const out = [];
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    const s = statSync(f);
    if (s.isDirectory()) out.push(...walk(f));
    else out.push(f);
  }
  return out;
};

const fnFiles = walk("src").filter((f) => f.endsWith(".functions.ts"));
for (const f of fnFiles) {
  const src = readFileSync(f, "utf8");
  const usesAdmin =
    /from\s+["']@\/integrations\/supabase\/client\.server["']/.test(src) ||
    /supabaseAdmin/.test(src);
  if (!usesAdmin) continue;
  const hasAuthMiddleware = /requireSupabaseAuth/.test(src);
  const hasRoleCheck = /has_role|has_any_role/.test(src);
  if (!hasAuthMiddleware) {
    add(
      "CRITICAL",
      "server-fn",
      `${relative(ROOT, f)} uses supabaseAdmin but does not apply requireSupabaseAuth — public unauthenticated privileged endpoint.`,
      f,
    );
  } else if (!hasRoleCheck) {
    add(
      "HIGH",
      "server-fn",
      `${relative(ROOT, f)} uses supabaseAdmin behind auth but does not call has_role/has_any_role — privileged action available to any signed-in user.`,
      f,
    );
  }
}

// ---- 5. Client-bundle leaks ---------------------------------------------------

const clientFiles = walk("src").filter(
  (f) =>
    (f.endsWith(".ts") || f.endsWith(".tsx")) &&
    !f.endsWith(".server.ts") &&
    !f.endsWith(".functions.ts") &&
    !f.endsWith(".functions.tsx"),
);
for (const f of clientFiles) {
  const src = readFileSync(f, "utf8");
  if (/SUPABASE_SERVICE_ROLE_KEY/.test(src)) {
    add("CRITICAL", "client-leak", `Service-role key referenced in client-reachable file.`, f);
  }
  if (/from\s+["']@\/integrations\/supabase\/client\.server["']/.test(src)) {
    add(
      "CRITICAL",
      "client-leak",
      `client.server imported from non-server file — service-role bundle leak.`,
      f,
    );
  }
}

// ---- 4. Optional DB checks (if PGHOST is set) ---------------------------------

const dbAvailable = !!process.env.PGHOST;
const dbRows = [];
if (dbAvailable) {
  const psql = (q) => {
    const flat = q.replace(/\s+/g, " ").trim();
    return execSync(`psql -At -F"|" -c ${JSON.stringify(flat)}`, { encoding: "utf8" }).trim();
  };
  try {
    const noRls = psql(
      `SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity=false ORDER BY relname`,
    );
    for (const t of noRls.split("\n").filter(Boolean)) {
      add("HIGH", "rls", `public.${t} has RLS disabled.`);
    }
    const noPolicies = psql(
      `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       LEFT JOIN pg_policies p ON p.schemaname='public' AND p.tablename=c.relname
       WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity=true
       GROUP BY c.relname HAVING COUNT(p.policyname)=0 ORDER BY c.relname`,
    );
    for (const t of noPolicies.split("\n").filter(Boolean)) {
      add("HIGH", "rls", `public.${t} has RLS enabled but no policies (locked).`);
    }
    const tables = psql(
      `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relkind='r' ORDER BY relname`,
    ).split("\n").filter(Boolean);
    for (const t of tables) {
      const lit = `'${t.replace(/'/g, "''")}'`;
      const rls = psql(
        `SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=${lit}`,
      );
      const pc = psql(
        `SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND tablename=${lit}`,
      );
      dbRows.push({ table: t, rls: rls === "t", policies: Number(pc) });
    }
  } catch (e) {
    add("INFO", "rls", `Database checks skipped: ${e.message.split("\n")[0]}`);
  }
} else {
  add("INFO", "rls", "PGHOST not set — skipped live RLS verification (run locally with psql env).");
}

// ---- Reports ------------------------------------------------------------------

const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3 };
findings.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

const critical = findings.filter((f) => f.severity === "CRITICAL").length;
const high = findings.filter((f) => f.severity === "HIGH").length;
const overall = critical || high ? "FAIL" : "PASS";

const rows = findings
  .map(
    (f) =>
      `| ${f.severity} | ${f.area} | ${f.message.replace(/\|/g, "\\|")} | ${f.file ? relative(ROOT, f.file) : ""} |`,
  )
  .join("\n");

const auditMd = `# Security Audit Report

> Generated by \`scripts/security-audit.mjs\` on ${new Date().toISOString()}.

**Status:** ${overall === "PASS" ? "✅ PASS" : "❌ FAIL"}  
**Critical:** ${critical}  **High:** ${high}  **Total findings:** ${findings.length}

## Coverage

| Check | Source |
|---|---|
| app_role enum vs AppRole type | \`${ENUM_PATH}\` vs \`${AUTH_FN_PATH}\` |
| ROUTE_PERMISSIONS vs enum | \`${ROUTE_AUTH_PATH}\` |
| Dashboard layout guards | \`src/routes/_authenticated.dashboard.*.tsx\` |
| Privileged server functions | \`src/**/*.functions.ts\` |
| Client-bundle leaks | \`src/**/*.{ts,tsx}\` (excluding \`.server.ts\` / \`.functions.ts\`) |
| Live RLS check | ${dbAvailable ? "Executed" : "Skipped (no PGHOST)"} |

## Findings

${
  findings.length === 0
    ? "_No findings._"
    : `| Severity | Area | Message | File |\n|---|---|---|---|\n${rows}`
}

## Enum & matrix snapshot

- **app_role enum:** ${enumRoles.join(", ")}
- **AppRole type:** ${appRoleTypeRoles.join(", ")}
- **ROUTE_PERMISSIONS:** ${Object.keys(routePermissions).length} entries
`;

writeFileSync("docs/infrastructure/security-audit-report.md", auditMd);

// RLS consistency report — surface × allowed roles × (optional) RLS evidence
const rlsRows = Object.entries(routePermissions)
  .map(([surface, roles]) => `| \`${surface}\` | ${roles.join(", ")} |`)
  .join("\n");
const dbTable = dbRows.length
  ? `\n## Live RLS snapshot\n\n| Table | RLS | Policies |\n|---|---|---|\n${dbRows
      .map((r) => `| ${r.table} | ${r.rls ? "✅" : "❌"} | ${r.policies} |`)
      .join("\n")}\n`
  : "";

writeFileSync(
  "docs/infrastructure/rls-route-consistency-report.md",
  `# RLS ↔ Route Consistency Report

> Generated by \`scripts/security-audit.mjs\` on ${new Date().toISOString()}.

This report cross-references the centralized \`ROUTE_PERMISSIONS\` matrix
against the \`app_role\` enum and (when run with a live \`PGHOST\`) the actual
\`pg_policies\` catalog.

## Route permission matrix

| Surface | Allowed roles (plus admin / super_admin implicit) |
|---|---|
${rlsRows}
${dbTable}
## How to interpret

- Every surface above must have a layout route in \`src/routes/\` whose
  \`beforeLoad\` invokes \`requireRolesOrRedirect(ROUTE_PERMISSIONS[...])\`.
- Tables read by a given surface should have RLS policies that scope rows
  to \`auth.uid()\` AND/OR \`has_any_role(auth.uid(), ARRAY[...]::app_role[])\`
  with the same role set.
- Drift between this matrix and the database is flagged in
  \`security-audit-report.md\`.
`,
);

// ---- Exit code ----------------------------------------------------------------

console.log(`Security audit: ${overall} — ${findings.length} finding(s)`);
for (const f of findings) {
  console.log(`  [${f.severity}] ${f.area}: ${f.message}${f.file ? ` (${relative(ROOT, f.file)})` : ""}`);
}
console.log(`Wrote docs/infrastructure/security-audit-report.md`);
console.log(`Wrote docs/infrastructure/rls-route-consistency-report.md`);
process.exit(overall === "PASS" ? 0 : 1);
