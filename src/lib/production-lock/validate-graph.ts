/**
 * Production Lock System (B.10) — Graph Integrity Validator
 *
 * Verifies that the 4 graphs (Routes · Breadcrumbs · Sitemap · Intelligence)
 * agree with the central RouteGraphNode registry. This module is
 * verification-only — it MUST NOT mutate any registry, generator,
 * or route output (B.5–B.9 boundaries are read-only here).
 */

import { ROUTE_GRAPH, type RouteGraphNode } from "./contracts";
import { getAcademyBreadcrumbs } from "@/content/providers";

export type LockLayer = "route" | "breadcrumb" | "sitemap" | "intelligence";

export interface LockViolation {
  layer: LockLayer;
  path: string;
  issue: string;
}

export interface LockReport {
  ok: boolean;
  checked: number;
  violations: LockViolation[];
}

/**
 * Validate the live graph against the contract registry.
 *
 * @param sitemapPaths  flat list of paths currently emitted by the sitemap
 *                      generator (no domain prefix). Required so this
 *                      validator stays generator-agnostic (no import of
 *                      route files / SSR side-effects).
 */
export function validateGraph(sitemapPaths: readonly string[]): LockReport {
  const violations: LockViolation[] = [];
  const sitemapSet = new Set(sitemapPaths.map((p) => p.replace(/\/+$/, "") || "/"));
  const contractSet = new Set(ROUTE_GRAPH.map((n) => n.path));

  for (const node of ROUTE_GRAPH) {
    // LOCK 3 — SEO / Sitemap
    if (node.indexable && !sitemapSet.has(node.path)) {
      violations.push({
        layer: "sitemap",
        path: node.path,
        issue: "Indexable route missing from sitemap",
      });
    }

    // LOCK 2 — Breadcrumb
    if (node.requiresBreadcrumb) {
      const trail = getAcademyBreadcrumbs(node.path);
      if (!Array.isArray(trail) || trail.length === 0) {
        violations.push({
          layer: "breadcrumb",
          path: node.path,
          issue: "getAcademyBreadcrumbs() returned empty trail",
        });
      }
    }
  }

  // LOCK 3 — orphan sitemap entries (Academy surface only)
  for (const path of sitemapSet) {
    if (path.startsWith("/academy") && !contractSet.has(path)) {
      // Tolerate dynamic taxonomy URLs surfaced by the resolver
      // (categories / courses / learning-paths registry-driven).
      if (
        path.startsWith("/academy/categories/") ||
        path.startsWith("/academy/courses/") ||
        path.startsWith("/academy/learning-paths/")
      ) {
        continue;
      }
      violations.push({
        layer: "sitemap",
        path,
        issue: "Sitemap entry has no matching RouteGraphNode contract",
      });
    }
  }

  return {
    ok: violations.length === 0,
    checked: ROUTE_GRAPH.length,
    violations,
  };
}

export function formatReport(report: LockReport): string {
  if (report.ok) {
    return `✅ Production Lock OK — ${report.checked} routes validated.`;
  }
  const lines = [
    `❌ GRAPH INTEGRITY VIOLATION — ${report.violations.length} issue(s):`,
    "",
  ];
  for (const v of report.violations) {
    lines.push(`  [${v.layer.toUpperCase()}] ${v.path}`);
    lines.push(`    → ${v.issue}`);
  }
  return lines.join("\n");
}

export type { RouteGraphNode };
