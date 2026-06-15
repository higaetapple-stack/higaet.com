#!/usr/bin/env node
/**
 * Production Lock System (B.10) — CI gate / dry-run.
 *
 * Derives the live sitemap path list by:
 *   1. parsing static entries from src/routes/sitemap[.]xml.ts (regex —
 *      cheap, no SSR/route import side-effects), and
 *   2. expanding dynamic Academy entries from @/lib/academy-programs
 *      (PROGRAMS, CAMPUSES — single source of truth).
 *
 * Then runs validateGraph() and prints the report.
 * Verification-only. Exits non-zero on violation.
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

async function load(rel) {
  const url = pathToFileURL(resolve(process.cwd(), rel)).href;
  return import(url);
}

function extractStaticPaths(filePath) {
  const src = readFileSync(filePath, "utf8");
  const out = [];
  const re = /\{\s*path:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return out;
}

async function main() {
  const { validateGraph, formatReport } = await load(
    "src/lib/production-lock/validate-graph.ts",
  );
  const { PROGRAMS, CAMPUSES } = await load("src/lib/academy-programs.ts");

  const staticPaths = extractStaticPaths("src/routes/sitemap[.]xml.ts");
  const programPaths = PROGRAMS.map((p) => `/academy/programs/${p.slug}`);
  const campusPaths = CAMPUSES.map((c) => `/academy/campuses/${c.slug}`);

  const sitemapPaths = [...staticPaths, ...programPaths, ...campusPaths];

  console.log(
    `→ Sitemap surface scanned: ${sitemapPaths.length} paths ` +
      `(${staticPaths.length} static + ${programPaths.length} programs + ${campusPaths.length} campuses)`,
  );

  const report = validateGraph(sitemapPaths);
  console.log(formatReport(report));
  if (!report.ok) process.exit(1);
}

main().catch((err) => {
  console.error("❌ Production Lock check crashed:", err);
  process.exit(1);
});
