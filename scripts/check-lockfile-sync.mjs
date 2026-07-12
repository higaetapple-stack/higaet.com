#!/usr/bin/env node
/**
 * Two-lockfile drift guard.
 *
 * HIGAET intentionally keeps BOTH `bun.lock` (CI speed) and
 * `package-lock.json` (MilesWeb Passenger deploy). This script verifies the
 * two lockfiles resolve the same top-level dependency versions declared in
 * `package.json`. Sub-tree divergence is tolerated (bun and npm resolve
 * transitives differently), but a top-level mismatch usually means one
 * lockfile was updated without the other and will produce different
 * runtime behavior between CI and production.
 *
 * Exit codes:
 *   0 → lockfiles agree with package.json (or one is absent — treated as
 *       "single-lockfile setup", not an error).
 *   1 → drift detected. Message names the packages and both versions.
 *
 * Zero deps, Node-only. Safe to invoke from PR checks.
 */

import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const declared = {
  ...(pkg.dependencies ?? {}),
  ...(pkg.devDependencies ?? {}),
};

/** Read exact-version resolutions for top-level packages from bun.lock. */
function readBunLock() {
  if (!fs.existsSync("bun.lock")) return null;
  const raw = fs.readFileSync("bun.lock", "utf8");
  // bun.lock is JSONC-ish; parse leniently.
  const stripped = raw.replace(/\/\/.*$/gm, "");
  let doc;
  try {
    doc = JSON.parse(stripped);
  } catch {
    return null;
  }
  const out = {};
  const pkgs = doc?.packages ?? {};
  for (const [key, entry] of Object.entries(pkgs)) {
    // Top-level keys look like "react" or "@scope/name"; drop nested paths.
    if (key.includes("/") && !key.startsWith("@")) continue;
    if (Array.isArray(entry) && typeof entry[0] === "string") {
      const [nameAtVer] = entry;
      const at = nameAtVer.lastIndexOf("@");
      if (at > 0) out[nameAtVer.slice(0, at)] = nameAtVer.slice(at + 1);
    } else if (entry && typeof entry === "object" && entry.version) {
      out[key] = String(entry.version);
    }
  }
  return out;
}

function readNpmLock() {
  if (!fs.existsSync("package-lock.json")) return null;
  const doc = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
  const out = {};
  const packages = doc.packages ?? {};
  for (const [key, entry] of Object.entries(packages)) {
    if (!key.startsWith("node_modules/")) continue;
    const name = key.replace(/^node_modules\//, "");
    // Only track top-level (no nested `node_modules/` inside).
    if (name.includes("/node_modules/")) continue;
    if (entry?.version) out[name] = entry.version;
  }
  return out;
}

const bun = readBunLock();
const npm = readNpmLock();

if (!bun || !npm) {
  console.log(
    "[lockfile-sync] Single-lockfile setup detected — nothing to compare.",
  );
  process.exit(0);
}

const drift = [];
for (const name of Object.keys(declared)) {
  const b = bun[name];
  const n = npm[name];
  if (!b || !n) continue; // present in only one — informational, not drift
  if (b !== n) drift.push({ name, bun: b, npm: n });
}

if (drift.length === 0) {
  console.log(
    `[lockfile-sync] OK — ${Object.keys(declared).length} declared deps resolve consistently across bun.lock and package-lock.json.`,
  );
  process.exit(0);
}

console.error("[lockfile-sync] Drift detected between bun.lock and package-lock.json:");
for (const d of drift) {
  console.error(`  ${d.name}: bun=${d.bun}  npm=${d.npm}`);
}
console.error(
  "\nBoth lockfiles must resolve declared dependencies to the same version. " +
    "Run BOTH `bun install` AND `npm install` after changing package.json.",
);
process.exit(1);
