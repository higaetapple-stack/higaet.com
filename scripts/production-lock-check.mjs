#!/usr/bin/env node
/**
 * Production Lock System (B.10) — CI gate.
 *
 * Validates the 4 graphs (Routes · Breadcrumbs · Sitemap · Intelligence)
 * before build. Exits non-zero on any violation so the build pipeline
 * aborts. Verification-only — no file mutations.
 *
 * Run via:  bun scripts/production-lock-check.mjs
 *           node --import tsx scripts/production-lock-check.mjs
 */

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

async function load(rel) {
  const url = pathToFileURL(resolve(process.cwd(), rel)).href;
  return import(url);
}

async function main() {
  const { validateGraph, formatReport } = await load(
    "src/lib/production-lock/validate-graph.ts",
  );
  const sitemapMod = await load("src/content/academy/generated/sitemap.ts");

  // Pull whichever export the generator publishes (defensive — name
  // changes shouldn't silently bypass the lock).
  const sitemapPaths =
    sitemapMod.ACADEMY_SITEMAP_PATHS ??
    sitemapMod.SITEMAP_PATHS ??
    (Array.isArray(sitemapMod.default) ? sitemapMod.default : null) ??
    extractPaths(sitemapMod);

  if (!Array.isArray(sitemapPaths)) {
    console.error(
      "❌ Production Lock: could not derive sitemap path list from generator export.",
    );
    process.exit(1);
  }

  const report = validateGraph(sitemapPaths);
  console.log(formatReport(report));
  if (!report.ok) process.exit(1);
}

function extractPaths(mod) {
  for (const v of Object.values(mod)) {
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v;
    if (Array.isArray(v) && v.every((x) => x && typeof x.path === "string")) {
      return v.map((x) => x.path);
    }
  }
  return null;
}

main().catch((err) => {
  console.error("❌ Production Lock check crashed:", err);
  process.exit(1);
});
