#!/usr/bin/env bun
/**
 * HIGAET P5.3 — Backlink Architecture Linter
 *
 * Hard CI gate. Validates the topic-cluster graph in `src/lib/seo/topic-clusters.ts`
 * against four backlink rules and fails the build on violations.
 *
 *  RULE 1 — HUB ↔ SPOKE REQUIRED
 *           Every spoke must declare its hub (implicit via cluster membership),
 *           and every hub must list ≥1 spoke. Spoke files must render either
 *           <RelatedCluster /> (which injects the hub link) or a manual hub link.
 *
 *  RULE 2 — CROSS-CLUSTER LIMIT (soft cap, warning only, per P5.4)
 *           `relatedClusters` ≤ ceil(20% of spokes) + 2 intent bridges.
 *
 *  RULE 3 — ANCHOR VALIDATION
 *           No generic anchors ("click here", "read more", "learn more",
 *           "here", "this page").
 *
 *  RULE 4 — HUB ANCHOR REQUIREMENT
 *           Each spoke must surface a hub anchor — satisfied by
 *           <RelatedCluster /> (which always emits the cluster hub link) or
 *           by a manual `<Link to="<hub.path>"` reference.
 *
 * Run: `bun scripts/lint-backlink-architecture.ts`
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { listClusters, TOPIC_CLUSTERS } from "../src/lib/seo/topic-clusters";

const ROUTES_DIR = path.resolve(process.cwd(), "src/routes");
const GENERIC_ANCHORS = [
  "click here",
  "read more",
  "learn more",
  "here",
  "this page",
  "more info",
  "details",
];

interface Violation {
  rule: 1 | 2 | 3 | 4;
  severity: "error" | "warning";
  message: string;
}

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
  const literals = new Map<string, string>();
  const literalsIsIndex = new Map<string, boolean>();
  const patterns: { re: RegExp; file: string; pattern: string }[] = [];
  for await (const f of walk(ROUTES_DIR)) {
    const p = fileToRoutePath(f);
    if (!p) continue;
    const isIndex = /\.index\.(t|j)sx?$/.test(f) || /\/index\.(t|j)sx?$/.test(f);
    if (p.includes("$")) {
      patterns.push({ re: new RegExp("^" + p.replace(/\$[^/]*/g, "[^/]+") + "$"), file: f, pattern: p });
    } else {
      // Prefer index file over sibling layout file (e.g. global-education.index.tsx wins over global-education.tsx for "/global-education")
      const prev = literals.get(p);
      if (!prev || (isIndex && !literalsIsIndex.get(p))) {
        literals.set(p, f);
        literalsIsIndex.set(p, isIndex);
      }
    }
  }
  return { literals, patterns };
}
function resolveFile(p: string, routes: Awaited<ReturnType<typeof collectRoutes>>): string | null {
  const direct = routes.literals.get(p);
  if (direct) return direct;
  const match = routes.patterns.find((x) => x.re.test(p));
  return match ? match.file : null;
}
/** Walk every ancestor route segment and return matching layout/index files. */
function listAncestorFiles(p: string, routes: Awaited<ReturnType<typeof collectRoutes>>): string[] {
  const out: string[] = [];
  const segs = p.split("/").filter(Boolean);
  for (let i = segs.length - 1; i >= 0; i--) {
    const ancestor = "/" + segs.slice(0, i).join("/");
    const f = routes.literals.get(ancestor === "/" ? "/" : ancestor);
    if (f) out.push(f);
  }
  return out;
}
async function readSafe(file: string): Promise<string> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return "";
  }
}

async function main() {
  const routes = await collectRoutes();
  const clusters = listClusters();
  const violations: Violation[] = [];
  const stats = { spokesChecked: 0, hubsChecked: 0, crossClusterWarnings: 0 };

  // Site-wide hub links from global chrome (Header/Footer/SiteShell). A hub
  // path referenced in chrome counts as a satisfied spoke→hub backlink site-wide.
  const chromeFiles = [
    "src/components/site/Header.tsx",
    "src/components/site/Footer.tsx",
    "src/components/site/SiteShell.tsx",
    "src/components/site/AcademyMegaMenu.tsx",
  ];
  const chromeSrc = (
    await Promise.all(
      chromeFiles.map((rel) => readSafe(path.resolve(process.cwd(), rel))),
    )
  ).join("\n");
  const hubInChrome = (hubPath: string) => {
    const esc = hubPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match either JSX prop form `to="/path"` or nav-config object form `to: "/path"`.
    return new RegExp(`\\bto\\s*[:=]\\s*["'\`]${esc}["'\`]`).test(chromeSrc);
  };

  for (const c of clusters) {
    stats.hubsChecked++;

    // RULE 1a — Hub must list at least one spoke
    if (!c.spokes.length) {
      violations.push({
        rule: 1,
        severity: "error",
        message: `Cluster "${c.id}" has no spokes — every hub must list ≥1 spoke.`,
      });
    }

    // RULE 2 — cross-cluster soft cap (warn only per P5.4)
    const allowed = Math.max(2, Math.ceil(c.spokes.length * 0.2)) + 2; // 20% cap + 2 intent bridges
    const cross = c.relatedClusters?.length ?? 0;
    if (cross > allowed) {
      stats.crossClusterWarnings++;
      violations.push({
        rule: 2,
        severity: "warning",
        message: `Cluster "${c.id}" has ${cross} related clusters (soft cap ${allowed}). Trim or convert to intent bridges.`,
      });
    }

    // RULE 3 — anchor validation (hub anchor)
    if (GENERIC_ANCHORS.includes(c.hub.anchor.trim().toLowerCase())) {
      violations.push({
        rule: 3,
        severity: "error",
        message: `Hub "${c.hub.path}" uses generic anchor "${c.hub.anchor}".`,
      });
    }

    for (const spoke of c.spokes) {
      stats.spokesChecked++;

      // RULE 3 — anchor validation (spoke anchor)
      if (GENERIC_ANCHORS.includes(spoke.anchor.trim().toLowerCase())) {
        violations.push({
          rule: 3,
          severity: "error",
          message: `Spoke "${spoke.path}" uses generic anchor "${spoke.anchor}".`,
        });
      }

      // RULE 1b + RULE 4 — spoke must reference its hub
      const file = resolveFile(spoke.path, routes);
      if (!file) {
        violations.push({
          rule: 1,
          severity: "error",
          message: `Spoke "${spoke.path}" (cluster ${c.id}) does not resolve to a route file.`,
        });
        continue;
      }
      const src = await readSafe(file);
      // Aggregate spoke source + every ancestor route layout file. Layouts
      // (e.g. technologies.engagement.tsx) wrap their children via <Outlet />
      // and frequently render hub links / cluster modules.
      const ancestorFiles = listAncestorFiles(spoke.path, routes);
      const ancestorSrc = (
        await Promise.all(ancestorFiles.map((f) => readSafe(f)))
      ).join("\n");
      const combined = src + "\n" + ancestorSrc;
      const hasRelatedCluster = /<\s*RelatedCluster\b/.test(combined);
      const escapedHub = c.hub.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const manualHubLink = new RegExp(
        `<\\s*Link\\b[^>]*\\bto\\s*=\\s*["'\`]${escapedHub}["'\`]`,
      ).test(combined);
      const hubAnchorText = new RegExp(
        c.hub.anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      ).test(combined);

      if (!hasRelatedCluster && !manualHubLink && !hubInChrome(c.hub.path)) {
        violations.push({
          rule: 4,
          severity: "error",
          message: `Spoke "${spoke.path}" missing hub backlink to "${c.hub.path}". Add <RelatedCluster path="${spoke.path}" />, a manual <Link to="${c.hub.path}">, surface it in site chrome, or render it in an ancestor layout.`,
        });
      } else if (!hasRelatedCluster && !hubAnchorText) {
        // Manual link present but anchor text missing — soft warning.
        violations.push({
          rule: 3,
          severity: "warning",
          message: `Spoke "${spoke.path}" links to hub but does not surface the cluster anchor "${c.hub.anchor}".`,
        });
      }
    }

    // RULE 1c — hub file must exist and reference its spokes (via RelatedCluster/HubLongform/HubAuthorityBlock)
    const hubFile = resolveFile(c.hub.path, routes);
    if (!hubFile) {
      violations.push({
        rule: 1,
        severity: "error",
        message: `Hub "${c.hub.path}" does not resolve to a route file.`,
      });
    } else {
      const src = await readSafe(hubFile);
      const hasModule = /<\s*(RelatedCluster|HubLongform|HubAuthorityBlock)\b/.test(src);
      if (!hasModule) {
        violations.push({
          rule: 1,
          severity: "error",
          message: `Hub "${c.hub.path}" missing spoke surface — render <HubLongform clusterId="${c.id}" /> or <RelatedCluster path="${c.hub.path}" />.`,
        });
      }
    }
  }

  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.filter((v) => v.severity === "warning");

  console.log("");
  console.log("════════════════════════════════════════════════════════════════════");
  console.log("HIGAET — Backlink Architecture Linter (P5.3)");
  console.log("════════════════════════════════════════════════════════════════════");
  console.log(`Hubs checked      : ${stats.hubsChecked}`);
  console.log(`Spokes checked    : ${stats.spokesChecked}`);
  console.log(`Errors            : ${errors.length}`);
  console.log(`Warnings          : ${warnings.length}`);
  console.log("────────────────────────────────────────────────────────────────────");
  if (!violations.length) {
    console.log("✅ Backlink architecture clean. Hub↔Spoke graph enforced.");
  } else {
    for (const v of violations) {
      const tag = v.severity === "error" ? "❌ ERROR" : "⚠️  WARN";
      console.log(`${tag} [Rule ${v.rule}] ${v.message}`);
    }
  }
  console.log("════════════════════════════════════════════════════════════════════");

  if (errors.length) process.exit(1);
}

main().catch((err) => {
  console.error("lint-backlink-architecture crashed:", err);
  process.exit(1);
});
