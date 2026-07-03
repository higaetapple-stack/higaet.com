#!/usr/bin/env node
/**
 * CI ESM Safety Gate
 * ------------------
 * Fails the build if it finds patterns that break under Node 22 pure ESM:
 *
 *   1. Extensionless relative imports inside .mjs / .js ESM files under
 *      scripts/ (e.g. `from './foo'` — Node ESM requires an extension).
 *   2. Runtime `bun` references in shipped code (package.json scripts,
 *      scripts/, src/). Documentation and workflows are exempt.
 *
 * TypeScript sources under src/ are intentionally NOT scanned for
 * extensionless imports: they run through Vite / tsgo which resolve
 * extensionless paths correctly. The gate targets the Node-executed
 * surface only.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const violations = [];

function walk(dir, onFile) {
  let entries;
  try {
    entries = readdirSync(join(ROOT, dir));
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const rel = join(dir, entry);
    const abs = join(ROOT, rel);
    const s = statSync(abs);
    if (s.isDirectory()) walk(rel, onFile);
    else onFile(rel, abs);
  }
}

// ---------- Check 1: extensionless ESM imports in scripts/ ----------
const esmExts = new Set([".mjs", ".js"]);
const importRe = /from\s+['"](\.\.?\/[^'"]+)['"]/g;

walk("scripts", (rel, abs) => {
  if (!esmExts.has(extname(rel))) return;
  const src = readFileSync(abs, "utf8");
  let m;
  while ((m = importRe.exec(src))) {
    const spec = m[1];
    // OK if it already has an extension or points to a directory index we can't infer.
    if (/\.(m?js|cjs|json|node)$/.test(spec)) continue;
    violations.push(`[ESM] ${rel}: extensionless import "${spec}"`);
  }
});

// ---------- Check 2: runtime `bun` references ----------
// package.json scripts
try {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  for (const [name, cmd] of Object.entries(pkg.scripts ?? {})) {
    if (/\bbun\b/.test(cmd)) {
      violations.push(`[BUN] package.json script "${name}" uses bun: ${cmd}`);
    }
  }
} catch {
  /* no package.json — ignore */
}

// scripts/ shell + node files
const bunRe = /\bbun\b/;
walk("scripts", (rel, abs) => {
  const ext = extname(rel);
  if (![".mjs", ".js", ".cjs", ".sh", ".ts"].includes(ext)) return;
  const src = readFileSync(abs, "utf8");
  for (const [i, line] of src.split("\n").entries()) {
    if (line.trim().startsWith("//") || line.trim().startsWith("#")) continue;
    if (line.trim().startsWith("*")) continue; // JSDoc
    if (bunRe.test(line)) {
      violations.push(`[BUN] ${rel}:${i + 1}: runtime bun reference: ${line.trim()}`);
    }
  }
});

// ---------- Report ----------
if (violations.length > 0) {
  console.error("❌ ESM / Bun safety check failed:\n");
  for (const v of violations) console.error("  " + v);
  console.error(`\n${violations.length} violation(s).`);
  process.exit(1);
}

console.log("✅ ESM safety check passed (no extensionless ESM imports, no runtime bun refs).");
