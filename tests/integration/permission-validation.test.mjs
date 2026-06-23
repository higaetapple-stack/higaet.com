// Permission validation: every role referenced in ROUTE_PERMISSIONS must
// exist in the AppRole union; no orphan permissions; no empty role sets.

import { readFileSync } from "node:fs";

function parseAppRoles() {
  const src = readFileSync("src/lib/auth.functions.ts", "utf8");
  const m = src.match(/export type AppRole\s*=\s*([^;]+);/);
  if (!m) throw new Error("AppRole union not found");
  return new Set(Array.from(m[1].matchAll(/"([a-z_]+)"/g)).map((x) => x[1]));
}

function parseRoutes() {
  const src = readFileSync("src/lib/route-authorization.ts", "utf8");
  const m = src.match(/ROUTE_PERMISSIONS[^=]*=\s*\{([\s\S]*?)\};/);
  if (!m) throw new Error("ROUTE_PERMISSIONS not found");
  const out = {};
  for (const line of m[1].split("\n")) {
    const lm = line.match(/"([^"]+)"\s*:\s*\[([^\]]+)\]/);
    if (!lm) continue;
    out[lm[1]] = Array.from(lm[2].matchAll(/"([a-z_]+)"/g)).map((x) => x[1]);
  }
  return out;
}

const roles = parseAppRoles();
const routes = parseRoutes();
const errors = [];
for (const [path, rs] of Object.entries(routes)) {
  if (!rs.length) errors.push(`${path}: empty role list`);
  for (const r of rs) if (!roles.has(r)) errors.push(`${path}: unknown role "${r}"`);
}
if (errors.length) {
  process.stderr.write("[permission-validation] FAIL\n" + errors.join("\n") + "\n");
  process.exit(1);
}
process.stdout.write(
  `[permission-validation] OK — ${Object.keys(routes).length} routes, ${roles.size} roles\n`,
);
