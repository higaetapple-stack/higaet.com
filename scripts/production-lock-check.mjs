#!/usr/bin/env node
/**
 * Production Lock Check — CI-safe, Node-only.
 *
 * Enforces npm lockfile presence and (optionally) integrity against a
 * pinned baseline via the LOCKFILE_HASH env var. No TypeScript imports,
 * no Bun dependency — runs on stock GitHub runners.
 *
 * Exit codes:
 *   0 → lockfile present (and matches baseline if LOCKFILE_HASH set)
 *   1 → missing lockfile or baseline mismatch
 */

import fs from "node:fs";
import crypto from "node:crypto";

function fileExists(path) {
  return fs.existsSync(path);
}

function hash(file) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(file))
    .digest("hex");
}

const lockfile = fileExists("package-lock.json")
  ? "package-lock.json"
  : fileExists("npm-shrinkwrap.json")
    ? "npm-shrinkwrap.json"
    : null;

if (!lockfile) {
  console.error(
    "❌ No lockfile found (package-lock.json or npm-shrinkwrap.json)",
  );
  process.exit(1);
}

console.log(`📦 Using lockfile: ${lockfile}`);

const lockHash = hash(lockfile);
const expected = process.env.LOCKFILE_HASH;

if (expected && expected !== lockHash) {
  console.error("❌ Lockfile out of sync with baseline");
  console.error(`Expected: ${expected}`);
  console.error(`Actual:   ${lockHash}`);
  process.exit(1);
}

console.log(`🔐 sha256: ${lockHash}`);
console.log("✅ Lockfile integrity OK");
