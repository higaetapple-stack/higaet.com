#!/usr/bin/env bun
/**
 * HIGAET P3 — SEO Graph Integrity Lint
 *
 * Hard-blocks the build when the topic-cluster graph is inconsistent.
 *
 * Detects:
 *   1. Orphan paths      — cluster paths that do not resolve to a route file
 *   2. Duplicate spokes  — same path registered as a spoke in 2+ clusters
 *   3. Hub == spoke      — a path acting as both hub and spoke
 *   4. Cannibalization   — distinct paths whose anchors collide (case-insensitive)
 *   5. Duplicate intent  — distinct paths with >= 0.8 anchor/blurb similarity
 *
 * Exit code 0 = clean; 1 = violations found.
 *
 * Run: `bun scripts/lint-seo-clusters.ts`
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { TOPIC_CLUSTERS, listClusters } from "../src/lib/seo/topic-clusters";

const ROUTES_DIR = path.resolve(process.cwd(), "src/routes");

// ───────────────────────────── route discovery ───────────────────────────────
async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(t|j)sx?$/.test(entry.name)) yield full;
  }
}

/** Convert a TanStack file path under src/routes/ into its public URL path. */
function fileToRoutePath(file: string): string | null {
  const rel = path.relative(ROUTES_DIR, file).replace(/\\/g, "/");
  if (rel.startsWith("api/")) return null;
  if (/^__/.test(rel)) return null;
  if (rel.includes("[.]")) return null; // sitemap.xml etc
  let stem = rel.replace(/\.(t|j)sx?$/, "");
  // Strip pathless underscore layout segments (e.g. _authenticated)
  stem = stem.replace(/(^|\.|\/)_[^./]+/g, "");
  // Folder = dot
  stem = stem.replace(/\//g, ".");
  // .index → leaf
  stem = stem.replace(/\.index$/, "").replace(/^index$/, "");
  if (!stem) return "/";
  return "/" + stem.replace(/\./g, "/");
}

async function collectRoutePaths(): Promise<Set<string>> {
  const out = new Set<string>(["/"]);
  for await (const f of walk(ROUTES_DIR)) {
    const p = fileToRoutePath(f);
    if (p && !p.includes("$")) out.add(p);
    if (p && p.includes("$")) out.add(p); // keep dynamic too — useful for diagnostics
  }
  return out;
}

// ──────────────────────────── similarity helpers ─────────────────────────────
function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

// ─────────────────────────────── main ────────────────────────────────────────
type Violation = { kind: string; detail: string };

async function main() {
  const routePaths = await collectRoutePaths();
  const violations: Violation[] = [];

  const allNodes: { clusterId: string; role: "hub" | "spoke"; path: string; anchor: string; blurb: string }[] = [];
  const spokeOwners = new Map<string, string[]>(); // path -> clusterIds
  const hubPaths = new Set<string>();

  for (const cluster of listClusters()) {
    hubPaths.add(cluster.hub.path);
    allNodes.push({ clusterId: cluster.id, role: "hub", ...cluster.hub });
    for (const s of cluster.spokes) {
      allNodes.push({ clusterId: cluster.id, role: "spoke", ...s });
      const owners = spokeOwners.get(s.path) ?? [];
      owners.push(cluster.id);
      spokeOwners.set(s.path, owners);
    }
  }

  // 1. Orphan paths — not resolvable in routes/
  for (const n of allNodes) {
    const exists =
      routePaths.has(n.path) ||
      // Allow dynamic-base parents (e.g. /technologies/case-studies matches
      // technologies.case-studies.index.tsx); collectRoutePaths already
      // normalizes both index and leaf forms, so a miss here is real.
      false;
    if (!exists) {
      violations.push({
        kind: "ORPHAN_PATH",
        detail: `Cluster "${n.clusterId}" references ${n.path} (${n.role}) but no route file resolves to it.`,
      });
    }
  }

  // 2. Duplicate spokes across clusters
  for (const [p, owners] of spokeOwners) {
    if (owners.length > 1) {
      violations.push({
        kind: "DUPLICATE_SPOKE",
        detail: `Path ${p} is registered as a spoke in: ${owners.join(", ")}. Each spoke must belong to exactly one cluster.`,
      });
    }
  }

  // 3. Hub == spoke collisions
  for (const cluster of listClusters()) {
    for (const s of cluster.spokes) {
      if (hubPaths.has(s.path) && s.path !== cluster.hub.path) {
        violations.push({
          kind: "HUB_AS_SPOKE",
          detail: `Path ${s.path} is the hub of one cluster but appears as a spoke under "${cluster.id}".`,
        });
      }
    }
  }

  // 4. Cannibalization — identical anchors on different paths
  const anchorIndex = new Map<string, string[]>();
  for (const n of allNodes) {
    const key = n.anchor.trim().toLowerCase();
    const arr = anchorIndex.get(key) ?? [];
    arr.push(n.path);
    anchorIndex.set(key, arr);
  }
  for (const [anchor, paths] of anchorIndex) {
    const unique = Array.from(new Set(paths));
    if (unique.length > 1) {
      violations.push({
        kind: "CANNIBALIZATION",
        detail: `Anchor "${anchor}" used by ${unique.length} distinct paths: ${unique.join(", ")}. Pick one canonical and rephrase the others.`,
      });
    }
  }

  // 5. Duplicate intent — high anchor+blurb similarity across distinct paths
  for (let i = 0; i < allNodes.length; i++) {
    for (let j = i + 1; j < allNodes.length; j++) {
      const a = allNodes[i];
      const b = allNodes[j];
      if (a.path === b.path) continue;
      const sim = jaccard(tokens(a.anchor + " " + a.blurb), tokens(b.anchor + " " + b.blurb));
      if (sim >= 0.8) {
        violations.push({
          kind: "DUPLICATE_INTENT",
          detail: `${a.path} and ${b.path} have ${(sim * 100).toFixed(0)}% intent overlap. Differentiate copy or merge.`,
        });
      }
    }
  }

  // ─── report ────────────────────────────────────────────────────────────────
  const totalPages = new Set(allNodes.map((n) => n.path)).size;
  console.log("\n🔍 HIGAET SEO Graph Integrity Lint");
  console.log("───────────────────────────────────");
  console.log(`Clusters scanned : ${listClusters().length}`);
  console.log(`Pages mapped     : ${totalPages}`);
  console.log(`Route files seen : ${routePaths.size}`);
  console.log(`Violations       : ${violations.length}\n`);

  if (violations.length === 0) {
    console.log("✅ Clean. Topic graph is integrity-valid.\n");
    process.exit(0);
  }

  const grouped = violations.reduce<Record<string, Violation[]>>((acc, v) => {
    (acc[v.kind] ??= []).push(v);
    return acc;
  }, {});
  for (const [kind, items] of Object.entries(grouped)) {
    console.log(`❌ ${kind} (${items.length})`);
    for (const v of items) console.log("   - " + v.detail);
    console.log();
  }
  console.log("Fix required before deploy.\n");
  process.exit(1);
}

main().catch((err) => {
  console.error("lint-seo-clusters crashed:", err);
  process.exit(2);
});
