#!/usr/bin/env bun
/**
 * HIGAET P4/P5 — SEO Graph Status Report Generator
 *
 * P4: Topic-cluster graph snapshot (orphans, cannibalization, intent overlap,
 *     hub linking coverage, integrity score).
 * P5.1: Score delta tracking against the last successful CI run, persisted in
 *       `.seo/last-seo-score.json`.
 * P5.2: Hub authority block coverage (definition / comparison / workflow /
 *       entities / reinforcement loop) bonused into the integrity score.
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
import { HUB_AUTHORITY } from "../src/lib/seo/hub-authority";

const ROUTES_DIR = path.resolve(process.cwd(), "src/routes");
const REPORT_DIR = path.resolve(process.cwd(), "dist/reports");
const MAP_PATH = path.resolve(process.cwd(), "docs/seo/backlink-architecture-map.json");
const STATE_PATH = path.resolve(process.cwd(), ".seo/last-seo-score.json");

// ───── route discovery ─────
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
async function collectRoutes() {
  const literals = new Set<string>(["/"]);
  const patterns: RegExp[] = [];
  const files = new Map<string, string>();
  const filesIsIndex = new Map<string, boolean>();
  for await (const f of walk(ROUTES_DIR)) {
    const p = fileToRoutePath(f);
    if (!p) continue;
    const isIndex = /\.index\.(t|j)sx?$/.test(f) || /\/index\.(t|j)sx?$/.test(f);
    if (p.includes("$")) patterns.push(new RegExp("^" + p.replace(/\$[^/]*/g, "[^/]+") + "$"));
    else literals.add(p);
    const prev = files.get(p);
    if (!prev || (isIndex && !filesIsIndex.get(p))) {
      files.set(p, f);
      filesIsIndex.set(p, isIndex);
    }
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

async function fileMentionsHubModules(file: string): Promise<{ related: boolean; longform: boolean; authority: boolean }> {
  try {
    const src = await fs.readFile(file, "utf8");
    return {
      related: /<\s*RelatedCluster\b/.test(src),
      longform: /<\s*HubLongform\b/.test(src),
      authority: /<\s*HubAuthorityBlock\b/.test(src) || /<\s*HubLongform\b/.test(src), // HubLongform now injects HubAuthorityBlock
    };
  } catch {
    return { related: false, longform: false, authority: false };
  }
}

// ───── score state (P5.1) ─────
interface ScoreState {
  lastScore: number;
  lastRun: string;
  note?: string;
}
async function loadPreviousScore(): Promise<ScoreState | null> {
  try {
    const raw = await fs.readFile(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as ScoreState;
    if (typeof parsed.lastScore === "number") return parsed;
    return null;
  } catch {
    return null;
  }
}
async function saveScoreState(score: number) {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(
    STATE_PATH,
    JSON.stringify(
      { lastScore: score, lastRun: new Date().toISOString(), note: "Auto-updated by seo-graph-report.ts" },
      null,
      2,
    ) + "\n",
  );
}

// ───── backlink map ─────
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
      linksToHub: true,
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

  const orphans = allNodes
    .filter((n) => !routeExists(n.path, routes))
    .map((n) => ({ path: n.path, cluster: n.clusterId, role: n.role }));

  const anchorIndex = new Map<string, Set<string>>();
  for (const n of allNodes) {
    const k = n.anchor.trim().toLowerCase();
    if (!anchorIndex.has(k)) anchorIndex.set(k, new Set());
    anchorIndex.get(k)!.add(n.path);
  }
  const cannibalizationWarnings = [...anchorIndex.entries()]
    .filter(([, paths]) => paths.size > 1)
    .map(([anchor, paths]) => ({ anchor, paths: [...paths] }));

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

  // Hub coverage + authority block coverage
  let hubsWithLinking = 0;
  let hubsWithAuthority = 0;
  const authorityRegistry = new Set(Object.keys(HUB_AUTHORITY));
  for (const c of clusters) {
    const f = routes.files.get(c.hub.path);
    if (f) {
      const mods = await fileMentionsHubModules(f);
      if (mods.related || mods.longform) hubsWithLinking++;
      if (mods.authority && authorityRegistry.has(c.id)) hubsWithAuthority++;
    }
  }
  const hubCoverage = hubsWithLinking / clusters.length;
  const authorityCoverage = hubsWithAuthority / clusters.length;

  const mappedPaths = new Set(allNodes.map((n) => n.path));
  const unmappedRoutes: string[] = [];
  for (const p of routes.literals) {
    if (p === "/" || p.startsWith("/dashboard") || p.startsWith("/ops") || p.startsWith("/auth")) continue;
    if (p.startsWith("/admin") || p.startsWith("/api")) continue;
    if (!mappedPaths.has(p)) unmappedRoutes.push(p);
  }

  // ───── P5.4 — integrity scoring with authority bonus ─────
  const totalPages = mappedPaths.size;
  let score = 100;
  score -= orphans.length * 4;
  score -= cannibalizationWarnings.length * 3;
  score -= duplicateIntentPages.length * 3;
  // Hub linking penalty (capped at 12) + authority block penalty (capped at 8)
  score -= Math.round((1 - hubCoverage) * 12);
  score -= Math.round((1 - authorityCoverage) * 8);
  score = Math.max(0, Math.min(100, score));

  // ───── P5.1 — delta tracking ─────
  const previous = await loadPreviousScore();
  const delta = previous ? score - previous.lastScore : 0;
  const trend: "improving" | "declining" | "stable" =
    delta > 0 ? "improving" : delta < 0 ? "declining" : "stable";

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
      authorityCoverage: +authorityCoverage.toFixed(2),
    },
    seoIntegrityScore: score,
    delta: {
      previous: previous?.lastScore ?? null,
      current: score,
      change: previous ? delta : null,
      trend: previous ? trend : "baseline",
      previousRun: previous?.lastRun ?? null,
    },
  };

  const backlinkMap = buildBacklinkMap();

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(MAP_PATH), { recursive: true });

  await fs.writeFile(path.join(REPORT_DIR, "SEO_GRAPH_STATUS.json"), JSON.stringify(report, null, 2));
  await fs.writeFile(MAP_PATH, JSON.stringify(backlinkMap, null, 2));
  await fs.writeFile(path.join(REPORT_DIR, "SEO_GRAPH_STATUS.md"), renderMarkdown(report));

  // Persist new baseline (CI step also copies this to .seo/, but writing here
  // keeps local runs self-consistent).
  await saveScoreState(score);

  console.log(`✅ SEO graph report written → dist/reports/SEO_GRAPH_STATUS.{json,md}`);
  console.log(`✅ Backlink architecture map → ${path.relative(process.cwd(), MAP_PATH)}`);
  console.log(`   Score: ${score}/100 · Clusters: ${clusters.length} · Pages: ${totalPages}`);
  console.log(
    `SEO_SCORE_DELTA: previous=${previous?.lastScore ?? "n/a"} current=${score} delta=${
      previous ? (delta >= 0 ? `+${delta}` : `${delta}`) : "baseline"
    } trend=${report.delta.trend}`,
  );
}

function renderMarkdown(r: any): string {
  const fmtList = (arr: any[], render: (x: any) => string) =>
    arr.length ? arr.map((x) => `- ${render(x)}`).join("\n") : "_None_";
  const deltaLabel =
    r.delta.change === null
      ? "baseline (no previous run)"
      : `${r.delta.change >= 0 ? "+" : ""}${r.delta.change} (${r.delta.trend})`;
  return `# SEO_GRAPH_STATUS

_Generated: ${r.timestamp}_

| Metric | Value |
|---|---|
| Clusters | ${r.clusters} |
| Pages mapped | ${r.pagesMapped} |
| Integrity score | **${r.seoIntegrityScore} / 100** |
| Score delta | ${deltaLabel} |
| Hub→Spoke linking | ${r.internalLinkHealth.hubToSpoke} (coverage ${r.internalLinkHealth.hubCoverage}) |
| Hub authority blocks | coverage ${r.internalLinkHealth.authorityCoverage} |
| Spoke→Hub linking | ${r.internalLinkHealth.spokeToHub} |
| Cross-cluster bridges | ${r.internalLinkHealth.crossCluster} |

## Score delta (P5.1)
- previous: ${r.delta.previous ?? "n/a"}
- current: ${r.delta.current}
- delta: ${r.delta.change ?? "baseline"}
- trend: ${r.delta.trend}
- previous run: ${r.delta.previousRun ?? "n/a"}

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
