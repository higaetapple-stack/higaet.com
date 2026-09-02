#!/usr/bin/env node
/**
 * HIGAET Internal Link Authority Audit (Gate D8)
 *
 * Resolves EFFECTIVE internal links per hub page, not just literal
 * `<Link to="...">` occurrences. In addition to literal links, it
 * statically resolves destinations passed through the project's shared
 * components and registries:
 *
 *   - HubRelatedLinks  links={[{ to, label, body }]}          (data array)
 *   - CTASection       primaryHref/secondaryHref (+ /contact default)
 *   - ServiceHero      primaryHref/secondaryHref
 *   - IndustryGrid     industries={NAME} entries with href
 *   - RelatedCluster   path="..." (+ limit) via topic-clusters registry
 *   - HubLongform      clusterId="..." via hub-longform (hub path) +
 *                      topic-clusters (spokes) + hub-authority (topSpokes)
 *
 * Deliberately NOT counted (would be false positives):
 *   - bare imports of link-rendering components (render nothing by themselves)
 *   - canonical / JSON-LD href:/item:/url: strings in head()
 *   - external URLs, hash-only anchors, search-param-only diffs
 *
 * Reports: per-hub effective links, missing required keywords,
 * broken internal targets (warn, non-gating), excessive links (>50).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

function readSource(rel) {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function info(msg) {
  process.stdout.write(`[Link-audit] INFO: ${msg}\n`);
}

function warn(msg) {
  process.stderr.write(`[Link-audit] WARN: ${msg}\n`);
}

// ---------------------------------------------------------------------------
// Generic static-analysis helpers
// ---------------------------------------------------------------------------

/** Match balanced delimiters starting at index of opening char. Returns end index (exclusive) or -1. */
function matchBalanced(src, openIdx, openCh, closeCh) {
  let depth = 0;
  let inS = null; // single/double/backtick string state
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (inS) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === inS) inS = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inS = ch;
      continue;
    }
    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/** Find `const NAME = [` array region; returns inner text or null. */
function constArrayRegion(src, name) {
  const m = src.match(new RegExp(`const\\s+${name}\\s*=\\s*\\[`));
  if (!m) return null;
  const openIdx = m.index + m[0].length - 1;
  const end = matchBalanced(src, openIdx, "[", "]");
  if (end === -1) return null;
  return src.slice(openIdx + 1, end - 1);
}

/** Find `"key": {` object block region; returns inner text or null. */
function keyedBlockRegion(src, key) {
  const m = src.match(new RegExp(`"${key}"\\s*:\\s*\\{`));
  if (!m) return null;
  const openIdx = m.index + m[0].length - 1;
  const end = matchBalanced(src, openIdx, "{", "}");
  if (end === -1) return null;
  return src.slice(openIdx + 1, end - 1);
}

/** Top-level region of `export const NAME ... = {` or `NAME = {`. */
function namedObjectRegion(src, declRe) {
  const m = src.match(declRe);
  if (!m) return null;
  const openIdx = src.indexOf("{", m.index);
  if (openIdx === -1) return null;
  const end = matchBalanced(src, openIdx, "{", "}");
  if (end === -1) return null;
  return src.slice(openIdx + 1, end - 1);
}

// ---------------------------------------------------------------------------
// Registry loaders (static parse of the real TS sources — no runtime import)
// ---------------------------------------------------------------------------

const NODE_RE =
  /\{\s*path:\s*"([^"]+)"\s*,\s*anchor:\s*"([^"]+)"\s*,\s*blurb:\s*"([^"]+)"\s*,?\s*\}/g;

function loadTopicClusters() {
  const src = readSource("src/lib/seo/topic-clusters.ts");
  const region = namedObjectRegion(src, /TOPIC_CLUSTERS[^=]*=/);
  if (!region) throw new Error("TOPIC_CLUSTERS region not found");
  const clusters = [];
  const blockRe = /"([a-z0-9-]+)"\s*:\s*\{/g;
  let m;
  while ((m = blockRe.exec(region)) !== null) {
    const id = m[1];
    const openIdx = m.index + m[0].length - 1;
    const end = matchBalanced(region, openIdx, "{", "}");
    if (end === -1) continue;
    const body = region.slice(openIdx + 1, end - 1);
    // Avoid matching nested spoke objects as cluster blocks: require hub+spokes keys.
    if (!/hub\s*:/.test(body) || !/spokes\s*:/.test(body)) continue;
    const hubM = body.match(
      /hub\s*:\s*\{\s*path:\s*"([^"]+)"\s*,\s*anchor:\s*"([^"]+)"\s*,\s*blurb:\s*"([^"]+)"\s*,?\s*\}/,
    );
    const spokesM = body.match(/spokes\s*:\s*\[/);
    const spokes = [];
    if (spokesM) {
      const sOpen = body.indexOf("[", spokesM.index);
      const sEnd = matchBalanced(body, sOpen, "[", "]");
      if (sEnd !== -1) {
        const sBody = body.slice(sOpen + 1, sEnd - 1);
        let nm;
        NODE_RE.lastIndex = 0;
        while ((nm = NODE_RE.exec(sBody)) !== null) {
          spokes.push({ path: nm[1], anchor: nm[2], blurb: nm[3] });
        }
      }
    }
    const relM = body.match(/relatedClusters\s*:\s*\[([^\]]*)\]/);
    const related = relM ? [...relM[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
    clusters.push({
      id,
      hub: hubM ? { path: hubM[1], anchor: hubM[2], blurb: hubM[3] } : null,
      spokes,
      relatedClusters: related,
    });
  }
  return clusters;
}

/** Exact static replica of getRelatedLinks(path, limit) from topic-clusters.ts */
function buildClusterIndex(clusters) {
  const index = new Map();
  for (const c of clusters) {
    if (c.hub && !index.has(c.hub.path)) index.set(c.hub.path, { cluster: c, role: "hub" });
    for (const s of c.spokes) {
      if (!index.has(s.path)) index.set(s.path, { cluster: c, role: "spoke" });
    }
  }
  const byId = new Map(clusters.map((c) => [c.id, c]));
  function getRelatedLinks(path, limit = 6) {
    const entry = index.get(path);
    if (!entry) return [];
    const { cluster, role } = entry;
    if (role === "hub") return cluster.spokes.slice(0, limit);
    const out = [cluster.hub];
    for (const s of cluster.spokes) {
      if (s.path !== path && out.length < limit) out.push(s);
    }
    for (const rid of cluster.relatedClusters) {
      if (out.length >= limit) break;
      const rel = byId.get(rid);
      if (rel && rel.hub && !out.some((n) => n.path === rel.hub.path)) out.push(rel.hub);
    }
    return out.slice(0, limit);
  }
  return { getRelatedLinks, byId };
}

function loadHubAuthority() {
  const src = readSource("src/lib/seo/hub-authority.ts");
  const region = namedObjectRegion(src, /HUB_AUTHORITY[^=]*=/);
  const map = new Map();
  if (!region) return map;
  const blockRe = /"([a-z0-9-]+)"\s*:\s*\{/g;
  let m;
  while ((m = blockRe.exec(region)) !== null) {
    const openIdx = m.index + m[0].length - 1;
    const end = matchBalanced(region, openIdx, "{", "}");
    if (end === -1) continue;
    const body = region.slice(openIdx + 1, end - 1);
    const tM = body.match(/topSpokes\s*:\s*\[([^\]]*)\]/);
    if (tM)
      map.set(
        m[1],
        [...tM[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]),
      );
  }
  return map;
}

function loadLongformPaths() {
  const src = readSource("src/lib/seo/hub-longform.ts");
  const region = namedObjectRegion(src, /HUB_LONGFORM[^=]*=/);
  const map = new Map();
  if (!region) return map;
  const blockRe = /"([a-z0-9-]+)"\s*:\s*\{/g;
  let m;
  while ((m = blockRe.exec(region)) !== null) {
    const openIdx = m.index + m[0].length - 1;
    const end = matchBalanced(region, openIdx, "{", "}");
    if (end === -1) continue;
    const body = region.slice(openIdx + 1, end - 1);
    const pM = body.match(/^\s*path:\s*"([^"]+)"/m);
    if (pM) map.set(m[1], pM[1]);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Route existence (project dot-naming convention: a.b.c.tsx -> /a/b/c)
// ---------------------------------------------------------------------------

function routeFileExists(urlPath) {
  const clean = urlPath.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (clean === "/") return existsSync(resolve(ROOT, "src/routes/index.tsx"));
  const dotted = clean.replace(/^\//, "").replace(/\//g, ".");
  return (
    existsSync(resolve(ROOT, `src/routes/${dotted}.tsx`)) ||
    existsSync(resolve(ROOT, `src/routes/${dotted}.index.tsx`))
  );
}

// ---------------------------------------------------------------------------
// Per-hub effective link extraction
// ---------------------------------------------------------------------------

const ENTITY_PAGES = [
  { name: "Academy Homepage", path: "/academy", file: "src/routes/academy.index.tsx" },
  {
    name: "Academy Programs Listing",
    path: "/academy/programs",
    file: "src/routes/academy.programs.index.tsx",
  },
  {
    name: "Global Education Homepage",
    path: "/global-education",
    file: "src/routes/global-education.index.tsx",
  },
  {
    name: "Countries Listing",
    path: "/global-education/countries",
    file: "src/routes/global-education.countries.tsx",
  },
  {
    name: "Universities Listing",
    path: "/global-education/knowledge-base/universities",
    file: "src/routes/global-education.knowledge-base.universities.index.tsx",
  },
  {
    name: "Technologies Homepage",
    path: "/technologies",
    file: "src/routes/technologies.index.tsx",
  },
  { name: "Blog Listing", path: "/blog", file: "src/routes/blog.tsx" },
  { name: "Careers Listing", path: "/careers", file: "src/routes/careers.tsx" },
];

/** Literal <Link to="..."> / <a href="..."> (pre-existing behavior, kept). */
function extractLiteralLinks(content) {
  const links = [];
  const patterns = [
    /<Link\s+[^>]*to="([^"]+)"[^>]*>([\s\S]*?)<\/Link>/gi,
    /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const href = match[1];
      const anchor = match[2]
        .replace(/<[^>]*>/g, "")
        .trim()
        .slice(0, 100);
      if (href.startsWith("/") || href.startsWith("https://www.higaet.com")) {
        links.push({ href: href.replace("https://www.higaet.com", ""), anchor, via: "literal" });
      }
    }
  }
  return links;
}

/** Opening-tag text of each usage `<Name ...>` (NOT bare imports). */
function componentUsages(content, names) {
  const out = [];
  const re = new RegExp(`<(${names.join("|")})\\b((?:"[^"]*"|'[^']*'|[^>"'])*)>`, "g");
  let m;
  while ((m = re.exec(content)) !== null) {
    out.push({ name: m[1], props: m[2] });
  }
  return out;
}

function stringProp(props, name) {
  const m = props.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`));
  return m ? m[1] : null;
}

function exprProp(props, name) {
  const m = props.match(new RegExp(`${name}\\s*=\\s*\\{([^}]*)\\}`));
  return m ? m[1].trim() : null;
}

const CTA_DEFAULTS = { primaryHref: "/contact", primaryLabel: "Schedule Consultation" };
const HERO_DEFAULTS = { primaryLabel: "Talk to an engineer" };

/** CTASection / ServiceHero href props -> links (mirrors component rendering). */
function extractHeroCtaLinks(props, defaults) {
  const links = [];
  for (const kind of ["primary", "secondary"]) {
    const href = stringProp(props, `${kind}Href`);
    if (href && href.startsWith("/")) {
      const label =
        stringProp(props, `${kind}Label`) ?? (kind === "primary" ? defaults.primaryLabel : "");
      links.push({ href, anchor: (label ?? "").toLowerCase(), via: "props" });
    }
  }
  return links;
}

/** HubRelatedLinks links={[{ to, label, body }]} triples. */
function extractHubRelatedLinks(props) {
  const links = [];
  const re = /\bto:\s*"([^"]+)"\s*,\s*label:\s*"([^"]+)"\s*,\s*body:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(props)) !== null) {
    if (!m[1].startsWith("/")) continue;
    links.push({ href: m[1], anchor: `${m[2]} ${m[3]}`.toLowerCase().slice(0, 100), via: "props" });
  }
  return links;
}

/** IndustryGrid industries={NAME} -> entries carrying href (mirrors `industry.href ? <Link> : <article>`). */
function extractIndustryLinks(content, props) {
  const links = [];
  const ref = exprProp(props, "industries");
  if (!ref || /[{["']/.test(ref)) return links; // only simple identifiers
  const region = constArrayRegion(content, ref);
  if (!region) return links;
  const entryRe =
    /\{\s*icon:[^}]*?name:\s*"([^"]+)"\s*,\s*body:\s*"([^"]+)"\s*(?:,\s*href:\s*"([^"]+)")?\s*\}/g;
  let m;
  while ((m = entryRe.exec(region)) !== null) {
    if (m[3] && m[3].startsWith("/")) {
      links.push({
        href: m[3],
        anchor: `${m[1]} ${m[2]}`.toLowerCase().slice(0, 100),
        via: "props",
      });
    }
  }
  return links;
}

function nodeToLink(n, via) {
  return { href: n.path, anchor: `${n.anchor} ${n.blurb}`.toLowerCase().slice(0, 100), via };
}

function getRequiredLinks(pageName) {
  const requirements = {
    "Academy Homepage": ["programs", "courses", "certifications", "career-tracks"],
    "Academy Programs Listing": ["programs", "categories", "filters"],
    "Global Education Homepage": ["countries", "universities", "study-abroad", "visa"],
    "Countries Listing": ["countries", "universities", "visa", "scholarships"],
    "Universities Listing": ["universities", "countries", "programs", "rankings"],
    "Technologies Homepage": ["services", "industries", "case-studies", "expertise", "engagement"],
    "Blog Listing": ["blog-posts", "categories", "tags"],
    "Careers Listing": ["jobs", "departments", "benefits"],
  };
  return requirements[pageName] || [];
}

function main() {
  info("Starting Internal Link Authority Audit (Gate D8)...");

  const clusters = loadTopicClusters();
  const { getRelatedLinks, byId } = buildClusterIndex(clusters);
  const authority = loadHubAuthority();
  const longformPaths = loadLongformPaths();
  info(
    `  Registries: ${clusters.length} clusters, ${authority.size} authority blocks, ${longformPaths.size} longform paths`,
  );

  const report = {
    generatedAt: new Date().toISOString(),
    pages: [],
    summary: {
      totalPages: 0,
      totalInternalLinks: 0,
      orphanedPages: [],
      excessiveLinks: [],
      missingRequiredLinks: [],
      brokenTargets: [],
    },
  };

  for (const page of ENTITY_PAGES) {
    try {
      const content = readSource(page.file);
      const byHref = new Map();
      const add = (l) => {
        if (!l.href.startsWith("/")) return; // external never counted
        if (!byHref.has(l.href)) byHref.set(l.href, { ...l, vias: [l.via] });
        else {
          // Same URL, additional anchor variant (e.g. literal card + shared
          // strip): merge anchors so keyword coverage sees every rendered
          // anchor, mirroring what crawlers observe in SSR output.
          const cur = byHref.get(l.href);
          if (!cur.vias.includes(l.via)) cur.vias.push(l.via);
          const merged = `${cur.anchor} ${l.anchor}`.toLowerCase();
          if (!cur.anchor.toLowerCase().includes(l.anchor.toLowerCase())) {
            cur.anchor = merged.slice(0, 200);
          }
        }
      };

      // 1. Literal links (original behavior).
      for (const l of extractLiteralLinks(content)) add(l);

      // 2. Shared-component usages (JSX only — bare imports render nothing).
      const usages = componentUsages(content, [
        "CTASection",
        "ServiceHero",
        "HubRelatedLinks",
        "RelatedCluster",
        "HubLongform",
        "IndustryGrid",
      ]);
      for (const u of usages) {
        if (u.name === "CTASection" || u.name === "ServiceHero") {
          const defaults = u.name === "CTASection" ? CTA_DEFAULTS : HERO_DEFAULTS;
          for (const l of extractHeroCtaLinks(u.props, defaults)) add(l);
          if (u.name === "CTASection" && !stringProp(u.props, "primaryHref")) {
            const label = stringProp(u.props, "primaryLabel") ?? CTA_DEFAULTS.primaryLabel;
            add({
              href: CTA_DEFAULTS.primaryHref,
              anchor: label.toLowerCase(),
              via: "props-default",
            });
          }
        } else if (u.name === "HubRelatedLinks") {
          for (const l of extractHubRelatedLinks(u.props)) add(l);
        } else if (u.name === "IndustryGrid") {
          for (const l of extractIndustryLinks(content, u.props)) add(l);
        } else if (u.name === "RelatedCluster") {
          const p = stringProp(u.props, "path");
          const limRaw = exprProp(u.props, "limit");
          const limit = limRaw && /^\d+$/.test(limRaw) ? parseInt(limRaw, 10) : 6;
          if (p) for (const n of getRelatedLinks(p, limit)) add(nodeToLink(n, "cluster"));
        } else if (u.name === "HubLongform") {
          const cid = stringProp(u.props, "clusterId");
          if (cid && byId.has(cid)) {
            const hubPath = longformPaths.get(cid) ?? byId.get(cid).hub?.path;
            const withRelated = exprProp(u.props, "withRelated");
            if (hubPath && withRelated !== "false") {
              for (const n of getRelatedLinks(hubPath, 6)) add(nodeToLink(n, "cluster"));
            }
            // HubAuthorityBlock reinforcement loop: topSpokes (subset of spokes).
            const cluster = byId.get(cid);
            const spokeByPath = new Map(cluster.spokes.map((s) => [s.path, s]));
            for (const p of authority.get(cid) ?? []) {
              const s = spokeByPath.get(p);
              if (s) add(nodeToLink(s, "cluster"));
            }
          }
        }
      }

      const internalLinks = [...byHref.values()];
      const outboundLinks = []; // unchanged: this audit counts internal page links
      const anchorTexts = new Set(internalLinks.map((l) => l.anchor.toLowerCase()));
      const anchorDiversity = anchorTexts.size;

      const required = getRequiredLinks(page.name);
      const missingRequired = required.filter(
        (req) =>
          !internalLinks.some((l) => l.href.includes(req) || l.anchor.toLowerCase().includes(req)),
      );

      const broken = internalLinks.filter((l) => !routeFileExists(l.href)).map((l) => l.href);

      const isExcessive = internalLinks.length > 50;
      const hasInbound = internalLinks.length > 0; // Placeholder (unchanged)

      const resolvedBy = { literal: 0, props: 0, cluster: 0 };
      for (const l of internalLinks) {
        for (const v of l.vias) {
          if (v === "literal") resolvedBy.literal++;
          else if (v === "cluster") resolvedBy.cluster++;
          else resolvedBy.props++;
        }
      }

      const pageReport = {
        name: page.name,
        path: page.path,
        internalLinkCount: internalLinks.length,
        outboundLinkCount: outboundLinks.length,
        uniqueAnchors: anchorDiversity,
        anchorDiversityRatio:
          internalLinks.length > 0 ? (anchorDiversity / internalLinks.length).toFixed(2) : 0,
        requiredLinks: required,
        missingRequiredLinks: missingRequired,
        excessiveLinks: isExcessive,
        resolvedBy,
        brokenTargets: broken,
        sampleLinks: internalLinks.slice(0, 10).map((l) => ({ href: l.href, anchor: l.anchor })),
      };

      if (missingRequired.length > 0) {
        report.summary.missingRequiredLinks.push({ page: page.name, missing: missingRequired });
      }
      if (broken.length > 0) {
        report.summary.brokenTargets.push({ page: page.name, broken });
      }
      if (isExcessive)
        report.summary.excessiveLinks.push({ page: page.name, count: internalLinks.length });
      if (!hasInbound) report.summary.orphanedPages.push(page.name);

      report.pages.push(pageReport);
      info(
        `  ${page.name}: ${internalLinks.length} internal (literal:${resolvedBy.literal} props:${resolvedBy.props} cluster:${resolvedBy.cluster}), ${anchorDiversity} unique anchors`,
      );
    } catch (e) {
      warn(`Could not scan ${page.name}: ${e.message}`);
    }
  }

  report.summary.totalPages = report.pages.length;
  report.summary.totalInternalLinks = report.pages.reduce((sum, p) => sum + p.internalLinkCount, 0);

  writeFileSync(resolve(ROOT, ".link-audit.json"), JSON.stringify(report, null, 2));

  info(`Link audit complete. Report written to .link-audit.json`);
  info(`Total pages: ${report.summary.totalPages}`);
  info(`Total internal links: ${report.summary.totalInternalLinks}`);
  info(`Missing required links: ${report.summary.missingRequiredLinks.length}`);
  info(`Excessive links: ${report.summary.excessiveLinks.length}`);
  info(`Orphaned pages: ${report.summary.orphanedPages.length}`);
  info(`Pages with broken targets: ${report.summary.brokenTargets.length}`);

  if (report.summary.missingRequiredLinks.length > 0) {
    process.stdout.write("\n[Link-audit] MISSING REQUIRED LINKS:\n");
    for (const m of report.summary.missingRequiredLinks) {
      process.stdout.write(`  ${m.page}: ${m.missing.join(", ")}\n`);
    }
  }
  if (report.summary.brokenTargets.length > 0) {
    process.stdout.write("\n[Link-audit] BROKEN TARGETS:\n");
    for (const b of report.summary.brokenTargets) {
      process.stdout.write(`  ${b.page}: ${b.broken.join(", ")}\n`);
    }
  }
}

main();
