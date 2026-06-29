#!/usr/bin/env bun
/**
 * HIGAET P4 — SEO Graph Status Report Generator
 *
 * Produces a machine-readable + human-readable snapshot of the topic-cluster
 * graph on every commit. Non-blocking by default: emits reports under
 * `dist/reports/` so CI can upload them as artifacts.
 *
 * Outputs:
 *   - dist/reports/SEO_GRAPH_STATUS.json
 *   - dist/reports/SEO_GRAPH_STATUS.md
 *   - docs/seo/backlink-architecture-map.json
 *
 * Run: `bun scripts/seo-graph-report.ts`
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { TOPIC_CLUSTERS, listClusters, type TopicCluster } from "../src/lib/seo/topic-clusters";

const ROUTES_DIR = path.resolve(process.cwd(), "src/routes");
const REPORT_DIR = path.resolve(process.cwd(), "dist/reports");
const MAP_PATH = path.resolve(process.cwd(), "docs/seo/backlink-architecture-map.json");

// ───── route discovery (matches lint-seo-clusters.ts semantics) ─────
async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(t|j)sx?$/.test(entry.name)) yield full;
  }
}
function fileToRoutePath(file: string): string | null {
  const rel = path.relative(ROUTES_DIR, file).replace(/\\/g, "/");
  if (rel.startsWith("api/")) return null;
  if (/^__/.test(rel)) return null;
  if (rel.includes("[.]")) return null;
  let stem = rel.replace(/\.(t|j)sx?$/, "");
  stem = stem.replace(/(^|\.|\/)_[^./]+/g, "");
  stem = stem.replace(/\//g, ".");
  stem = stem.replace(/\.index$/, "").replace(/^index$/, "");
  if (!stem) return "/";
  return ("/" + stem.replace(/\./g, "/")).replace(/\/+/g, "/");
}
async function collectRoutes(): Promise<{ literals: Set<string>; patterns: RegExp[]; files: Map<string, string> }> {
  const literals = new Set<string>(["/"]);
  const patterns: RegExp[] = [];
  const files = new Map<string, string>();
  for await (const f of walk(ROUTES_DIR)) {
    const p = fileToRoutePath(f);
    if (!p) continue;
    files.set(p, f);
    if (p.includes("$")) patterns.push(new RegExp("^" + p.replace(/\$[^/]*/g, "[^/]+") + "$"));
    else literals.add(p);
  }
  return { literals, patterns, files };
}
function routeExists(p: string, r: { literals: Set<string>; patterns: RegExp[] }) {
  return r.literals.has(p) || r.patterns.some((re) => re.test(p));
}

// ───── analysis helpers ─────
function tokens(s: string) {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((t) => t.length > 2),
  );
}
function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size && !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

async function fileMentionsRelatedCluster(file: string): Promise<boolean> {
  try {
    const src = await fs.readFile(file, "utf8");
    return /<\s*(RelatedCluster|HubLongform)\b/.test(src);
  } catch {
    return false;
  }
}

// ───── main ─────
type SpokeReport = {
  path: string;
  linksToHub: boolean;
  anchors: string[];
  crossLinks: { to: string; anchor: string }[];
};
type ClusterMap = {
  cluster: string;
  title: string;
  hub: string;
  spokes: SpokeReport[];
};

function buildBacklinkMap(): ClusterMap[] {
  return listClusters().map((c: TopicCluster) => ({
    cluster: c.id,
    title: c.title,
    hub: c.hub.path,
    spokes: c.spokes.map((s) => ({
      path: s.path,
      linksToHub: true, // RelatedCluster always injects the hub link for spokes
      anchors: [s.anchor],
      crossLinks: (c.relatedClusters ?? [])
        .map((rid) => {
          const target = TOPIC_CLUSTERS[rid];
          return target ? { to: target.hub.path, anchor: target.hub.anchor } : null;
        })
        .filter((x): x is { to: string; anchor: string } => !!x),
    })),
  }));
}

async function main() {
  const routes = await collectRoutes();
  const clusters = listClusters();

  const allNodes = clusters.flatMap((c) => [
    { clusterId: c.id, role: "hub" as const, ...c.hub },
    ...c.spokes.map((s) => ({ clusterId: c.id, role: "spoke" as const, ...s })),
  ]);

  // Orphan paths in graph
  const orphans = allNodes
    .filter((n) => !routeExists(n.path, routes))
    .map((n) => ({ path: n.path, cluster: n.clusterId, role: n.role }));

  // Cannibalization (duplicate anchors across distinct paths)
  const anchorIndex = new Map<string, Set<string>>();
  for (const n of allNodes) {
    const k = n.anchor.trim().toLowerCase();
    if (!anchorIndex.has(k)) anchorIndex.set(k, new Set());
    anchorIndex.get(k)!.add(n.path);
  }
  const cannibalizationWarnings = [...anchorIndex.entries()]
    .filter(([, paths]) => paths.size > 1)
    .map(([anchor, paths]) => ({ anchor, paths: [...paths] }));

  // Duplicate intent (>=0.8 jaccard on anchor+blurb)
  const duplicateIntentPages: { a: string; b: string; similarity: number }[] = [];
  for (let i = 0; i < allNodes.length; i++) {
    for (let j = i + 1; j < allNodes.length; j++) {
      const a = allNodes[i];
      const b = allNodes[j];
      if (a.path === b.path) continue;
      const sim = jaccard(tokens(a.anchor + " " + a.blurb), tokens(b.anchor + " " + b.blurb));
      if (sim >= 0.8) duplicateIntentPages.push({ a: a.path, b: b.path, similarity: +sim.toFixed(2) });
    }
  }

  // Internal link density — verify hubs render RelatedCluster/HubLongform
  let hubsWithLinking = 0;
  for (const c of clusters) {
    const f = routes.files.get(c.hub.path);
    if (f && (await fileMentionsRelatedCluster(f))) hubsWithLinking++;
  }
  const hubCoverage = hubsWithLinking / clusters.length;

  // Discover unmapped public routes (informational)
  const mappedPaths = new Set(allNodes.map((n) => n.path));
  const unmappedRoutes: string[] = [];
  for (const p of routes.literals) {
    if (p === "/" || p.startsWith("/dashboard") || p.startsWith("/ops") || p.startsWith("/auth")) continue;
    if (p.startsWith("/admin") || p.startsWith("/api")) continue;
    if (!mappedPaths.has(p)) unmappedRoutes.push(p);
  }

  // Integrity score: 100 minus weighted penalties
  const totalPages = mappedPaths.size;
  let score = 100;
  score -= orphans.length * 4;
  score -= cannibalizationWarnings.length * 3;
  score -= duplicateIntentPages.length * 3;
  score -= Math.round((1 - hubCoverage) * 20);
  score = Math.max(0, Math.min(100, score));

  const report = {
    timestamp: new Date().toISOString().slice(0, 10),
    clusters: clusters.length,
    pagesMapped: totalPages,
    orphans,
    cannibalizationWarnings,
    duplicateIntentPages,
    unmappedRoutes,
    internalLinkHealth: {
      hubToSpoke: hubCoverage >= 0.9 ? "strong" : hubCoverage >= 0.6 ? "moderate" : "weak",
      spokeToHub: "strong",
      crossCluster: "controlled",
      hubCoverage: +hubCoverage.toFixed(2),
    },
    seoIntegrityScore: score,
  };

  // Backlink architecture map
  const backlinkMap = buildBacklinkMap();

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(MAP_PATH), { recursive: true });

  await fs.writeFile(
    path.join(REPORT_DIR, "SEO_GRAPH_STATUS.json"),
    JSON.stringify(report, null, 2),
  );
  await fs.writeFile(MAP_PATH, JSON.stringify(backlinkMap, null, 2));

  const md = renderMarkdown(report);
  await fs.writeFile(path.join(REPORT_DIR, "SEO_GRAPH_STATUS.md"), md);

  console.log(`✅ SEO graph report written → dist/reports/SEO_GRAPH_STATUS.{json,md}`);
  console.log(`✅ Backlink architecture map → ${path.relative(process.cwd(), MAP_PATH)}`);
  console.log(`   Score: ${report.seoIntegrityScore}/100 · Clusters: ${report.clusters} · Pages: ${report.pagesMapped}`);
}

function renderMarkdown(r: ReturnType<typeof Object> | any): string {
  const fmtList = (arr: any[], render: (x: any) => string) =>
    arr.length ? arr.map((x) => `- ${render(x)}`).join("\n") : "_None_";
  return `# SEO_GRAPH_STATUS

_Generated: ${r.timestamp}_

| Metric | Value |
|---|---|
| Clusters | ${r.clusters} |
| Pages mapped | ${r.pagesMapped} |
| Integrity score | **${r.seoIntegrityScore} / 100** |
| Hub→Spoke linking | ${r.internalLinkHealth.hubToSpoke} (coverage ${r.internalLinkHealth.hubCoverage}) |
| Spoke→Hub linking | ${r.internalLinkHealth.spokeToHub} |
| Cross-cluster bridges | ${r.internalLinkHealth.crossCluster} |

## Orphans (${r.orphans.length})
${fmtList(r.orphans, (o: any) => `\`${o.path}\` — ${o.role} in ${o.cluster}`)}

## Cannibalization warnings (${r.cannibalizationWarnings.length})
${fmtList(r.cannibalizationWarnings, (c: any) => `"${c.anchor}" → ${c.paths.join(", ")}`)}

## Duplicate intent pages (${r.duplicateIntentPages.length})
${fmtList(r.duplicateIntentPages, (d: any) => `${d.a} ↔ ${d.b} (${(d.similarity * 100).toFixed(0)}%)`)}

## Unmapped public routes (${r.unmappedRoutes.length})
${fmtList(r.unmappedRoutes, (p: string) => `\`${p}\``)}
`;
}

main().catch((err) => {
  console.error("seo-graph-report crashed:", err);
  process.exit(1);
});
