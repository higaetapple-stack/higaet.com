#!/usr/bin/env node
/**
 * Node SSR build verifier — the single gate that proves a production build
 * produced the canonical Nitro `node-server` artifact and NOT a Cloudflare
 * Workers bundle.
 *
 * Runs automatically as `postbuild:node` and again in CI before any deploy.
 *
 * Checks:
 *   1. .output/server/index.mjs exists and is non-trivial in size
 *   2. .output/nitro.json (when present) reports the node-server preset
 *   3. no Cloudflare Workers artifacts leaked into .output/
 *
 * Exit codes: 0 = OK, 1 = build is not deployable to MilesWeb/Passenger.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, ".output");
const SERVER_ENTRY = path.join(OUTPUT_DIR, "server", "index.mjs");
const NITRO_META = path.join(OUTPUT_DIR, "nitro.json");
const MIN_BYTES = 1024;

const errors = [];
const notes = [];

if (!fs.existsSync(SERVER_ENTRY)) {
  errors.push(
    `.output/server/index.mjs is missing.\n` +
      `    Passenger boots this exact path via app.js — without it production returns 503.\n` +
      `    Cause is almost always a Cloudflare preset override: run 'npm run build:node'\n` +
      `    (it strips LOVABLE_SANDBOX / DEV_SERVER__PROJECT_PATH) instead of 'vite build'.`,
  );
} else {
  const size = fs.statSync(SERVER_ENTRY).size;
  if (size < MIN_BYTES) {
    errors.push(
      `.output/server/index.mjs is only ${size} bytes — the Nitro build did not complete.`,
    );
  } else {
    notes.push(`server entry: .output/server/index.mjs (${size} bytes)`);
  }
}

if (fs.existsSync(NITRO_META)) {
  try {
    const meta = JSON.parse(fs.readFileSync(NITRO_META, "utf8"));
    const preset = meta.preset ?? meta.output?.preset ?? "unknown";
    notes.push(`nitro preset: ${preset}`);
    if (typeof preset === "string" && preset.includes("cloudflare")) {
      errors.push(
        `Nitro built the '${preset}' preset. Production must be 'node-server'.\n` +
          `    The Lovable sandbox forces cloudflare-module when LOVABLE_SANDBOX or\n` +
          `    DEV_SERVER__PROJECT_PATH is set. Use 'npm run build:node'.`,
      );
    } else if (preset !== "node-server") {
      // Strict gate: MilesWeb/Passenger boots .output/server/index.mjs produced
      // by the node-server preset only. Any other preset is a deploy hazard.
      errors.push(
        `Nitro preset is '${preset}' — production requires exactly 'node-server'.\n` +
          `    Check nitro.preset in vite.config.ts and run 'npm run build:node'.`,
      );
    }
  } catch {
    notes.push("nitro.json present but unparseable — skipping preset assertion");
  }
} else {
  notes.push("nitro.json absent — skipping preset assertion");
}


for (const cloudflareArtifact of ["wrangler.json", "_worker.js", "worker.js"]) {
  if (fs.existsSync(path.join(OUTPUT_DIR, cloudflareArtifact))) {
    errors.push(
      `Cloudflare artifact .output/${cloudflareArtifact} present — hybrid runtime output is not allowed in production.`,
    );
  }
}

console.log("── Node SSR build verification ─────────────────────────────");
for (const n of notes) console.log(`  ✓ ${n}`);

if (errors.length > 0) {
  console.error("");
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error("");
  console.error("Build is NOT deployable to MilesWeb / Passenger.");
  process.exit(1);
}

console.log("  ✓ canonical Node SSR output verified");
console.log("────────────────────────────────────────────────────────────");
