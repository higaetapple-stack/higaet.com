#!/usr/bin/env node
/**
 * Production build manifest generator.
 *
 * Emits `.output/build-manifest.json` describing exactly what was built, so
 * every deployed release on MilesWeb can be traced back to a commit, a
 * toolchain and a byte-for-byte server bundle.
 *
 * Runs automatically as part of `postbuild:node`, after
 * `scripts/verify-node-build.mjs`.
 *
 * HARD GATE: exits 1 when `.output/server/index.mjs` is missing or empty —
 * a release without the Passenger entry bundle must never be published.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, ".output");
const SERVER_ENTRY = path.join(OUTPUT_DIR, "server", "index.mjs");
const NITRO_META = path.join(OUTPUT_DIR, "nitro.json");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "build-manifest.json");

function fail(message) {
  console.error(`\n  ✗ ${message}\n`);
  console.error("Build manifest NOT generated — release is not deployable.");
  process.exit(1);
}

function safeExec(cmd, args) {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function depVersion(pkgName) {
  const pkgJson = readJson(
    path.join(ROOT, "node_modules", ...pkgName.split("/"), "package.json"),
  );
  if (pkgJson?.version) return pkgJson.version;
  // Fall back to the declared range in the root manifest.
  const root = readJson(path.join(ROOT, "package.json")) ?? {};
  return (
    root.dependencies?.[pkgName] ?? root.devDependencies?.[pkgName] ?? "unknown"
  );
}

// ── Hard gate: the Passenger entry bundle must exist and be non-trivial ─────
if (!fs.existsSync(SERVER_ENTRY)) {
  fail(
    ".output/server/index.mjs is missing. Passenger boots this exact path via app.js.\n" +
      "    Run `npm run build:node` (Nitro node-server preset).",
  );
}

const bundle = fs.readFileSync(SERVER_ENTRY);
if (bundle.length < 1024) {
  fail(
    `.output/server/index.mjs is only ${bundle.length} bytes — the Nitro build did not complete.`,
  );
}

const checksum = crypto.createHash("sha256").update(bundle).digest("hex");

// ── Nitro preset ────────────────────────────────────────────────────────────
let nitroPreset = "unknown";
const nitroMeta = readJson(NITRO_META);
if (nitroMeta) {
  nitroPreset = nitroMeta.preset ?? nitroMeta.output?.preset ?? "unknown";
}
if (typeof nitroPreset === "string" && nitroPreset.includes("cloudflare")) {
  fail(
    `Nitro built the '${nitroPreset}' preset. Production must be 'node-server'.`,
  );
}

// ── Public asset accounting ─────────────────────────────────────────────────
function countFiles(dir) {
  if (!fs.existsSync(dir)) return { files: 0, bytes: 0 };
  let files = 0;
  let bytes = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countFiles(full);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += fs.statSync(full).size;
    }
  }
  return { files, bytes };
}

const publicStats = countFiles(path.join(OUTPUT_DIR, "public"));

const gitSha =
  process.env.GITHUB_SHA ??
  process.env.GIT_COMMIT_SHA ??
  safeExec("git", ["rev-parse", "HEAD"]) ??
  "unknown";

const manifest = {
  schemaVersion: 1,
  deploymentTarget: "MilesWeb Passenger",
  git: {
    sha: gitSha,
    shortSha: gitSha.slice(0, 7),
    ref: process.env.GITHUB_REF ?? safeExec("git", ["rev-parse", "--abbrev-ref", "HEAD"]) ?? "unknown",
    runId: process.env.GITHUB_RUN_ID ?? null,
  },
  build: {
    timestampUtc: new Date().toISOString(),
    buildTarget: process.env.BUILD_TARGET ?? "node",
    nitroPreset,
    ci: Boolean(process.env.GITHUB_ACTIONS),
  },
  toolchain: {
    node: process.version,
    npm: safeExec("npm", ["-v"]) ?? "unknown",
    tanstackStart: depVersion("@tanstack/react-start"),
    tanstackRouter: depVersion("@tanstack/react-router"),
    vite: depVersion("vite"),
  },
  serverEntry: {
    path: ".output/server/index.mjs",
    sizeBytes: bundle.length,
    sha256: checksum,
  },
  publicAssets: {
    files: publicStats.files,
    sizeBytes: publicStats.bytes,
  },
};

fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

console.log("── Build manifest ──────────────────────────────────────────");
console.log(JSON.stringify(manifest, null, 2));
console.log(`  ✓ written to .output/build-manifest.json`);
console.log("────────────────────────────────────────────────────────────");
