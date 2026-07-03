#!/usr/bin/env node
/**
 * CI ESM Safety Gate
 * ------------------
 * Fails the build if it finds patterns that break the Node 22 ESM
 * build path:
 *
 *   1. Extensionless relative imports inside .mjs / .js ESM files under
 *      scripts/ (Node ESM requires an explicit extension).
 *   2. Runtime bun references in the critical build chain — i.e. the
 *      package.json scripts CI actually invokes to build and ship
 *      (build, prebuild, postbuild, start, ci). Bun-based tooling for
 *      auxiliary workflows (SEO lint, graph reports) is allowed and
 *      managed by its own workflow.
 *
 * TypeScript sources under src/ are intentionally NOT scanned: they run
 * through Vite / tsgo which resolve extensionless paths correctly.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const SELF = relative(ROOT, fileURLToPath(import.meta.url));
const BUN_TOKEN = /\bb\u0075n\b/; // obfuscated to avoid self-matching
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

function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("#") || t.startsWith("*") || t.startsWith("/*");
}

// ---------- Check 1: extensionless ESM imports in scripts/ ----------
const esmExts = new Set([".mjs", ".js"]);
const importRe = /from\s+['"](\.\.?\/[^'"]+)['"]/g;

walk("scripts", (rel, abs) => {
  if (rel === SELF) return;
  if (!esmExts.has(extname(rel))) return;
  const src = readFileSync(abs, "utf8");
  for (const [i, line] of src.split("\n").entries()) {
    if (isCommentLine(line)) continue;
    let m;
    while ((m = importRe.exec(line))) {
      const spec = m[1];
      if (/\.(m?js|cjs|json|node)$/.test(spec)) continue;
      violations.push(`[ESM] ${rel}:${i + 1}: extensionless import "${spec}"`);
    }
  }
});

// ---------- Check 2: bun in the critical build chain ----------
const CRITICAL_SCRIPTS = new Set(["build", "prebuild", "postbuild", "start", "ci"]);
try {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  for (const [name, cmd] of Object.entries(pkg.scripts ?? {})) {
    if (CRITICAL_SCRIPTS.has(name) && BUN_TOKEN.test(cmd)) {
      violations.push(`[BUN] package.json script "${name}" reintroduces bun in the build chain: ${cmd}`);
    }
  }
} catch {
  /* no package.json — ignore */
}

// ---------- Report ----------
if (violations.length > 0) {
  console.error("ESM/Bun safety check failed:\n");
  for (const v of violations) console.error("  " + v);
  console.error(`\n${violations.length} violation(s).`);
  process.exit(1);
}

console.log("ESM safety check passed.");
