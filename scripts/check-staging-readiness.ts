#!/usr/bin/env bun
/**
 * Phase 2.2 — Automated Staging Readiness Checker + Evidence Collector
 *
 * Runs DNS / SSL / SSH / GitHub / deploy-target probes against the configured
 * staging target and writes a timestamped, machine + human readable report to
 * docs/infrastructure/phase-2-2-prerequisite-report.md, with raw evidence
 * stored alongside in test-results/readiness/<timestamp>/.
 *
 * Exit codes:
 *   0  → all required checks PASS
 *   1  → one or more required checks FAIL (writes NO-GO report)
 *   2  → checker itself errored
 *
 * Configuration (all optional; missing values are recorded as FAIL with
 * "not configured" evidence so the checker never crashes on a fresh repo):
 *
 *   STAGING_HOST            e.g. staging.higaet.com
 *   STAGING_BASE_URL        e.g. https://staging.higaet.com
 *   STAGING_EXPECTED_IP     e.g. 203.0.113.10 (MilesWeb origin)
 *   SSH_HOST                MilesWeb SSH host
 *   SSH_USER                MilesWeb SSH user
 *   SSH_KEY_PATH            path to private key (default: ~/.ssh/id_ed25519)
 *   DEPLOY_DIR              remote app root (default: ~/apps/higaet)
 *   GITHUB_REPO             owner/repo for environment + secret checks
 *   GITHUB_TOKEN            PAT or workflow token with repo:admin / actions
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const exec = promisify(execFile);

type Check = {
  category: string;
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  required: boolean;
  evidence: string;
};

const checks: Check[] = [];
const startedAt = new Date();
const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
const evidenceDir = resolve(process.cwd(), `test-results/readiness/${stamp}`);
mkdirSync(evidenceDir, { recursive: true });

function record(c: Check) {
  checks.push(c);
  console.log(
    `[${c.status}] ${c.category} / ${c.name}${c.required ? "" : " (optional)"}`,
  );
}

function writeArtifact(name: string, body: string): string {
  const p = resolve(evidenceDir, name);
  writeFileSync(p, body);
  return p;
}

async function run(
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number } = {},
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await exec(cmd, args, {
      timeout: opts.timeoutMs ?? 15_000,
      maxBuffer: 1024 * 1024,
    });
    return { ok: true, stdout, stderr };
  } catch (err: any) {
    return {
      ok: false,
      stdout: err.stdout?.toString?.() ?? "",
      stderr: err.stderr?.toString?.() ?? String(err?.message ?? err),
    };
  }
}

const env = process.env;
const stagingHost = env.STAGING_HOST ?? "";
const stagingUrl = env.STAGING_BASE_URL ?? "";
const expectedIp = env.STAGING_EXPECTED_IP ?? "";
const sshHost = env.SSH_HOST ?? "";
const sshUser = env.SSH_USER ?? "";
const sshKey = env.SSH_KEY_PATH ?? "";
const sshPort = env.SSH_PORT ?? "22";
const deployDir = env.DEPLOY_DIR ?? "~/apps/higaet";
const ghRepo = env.GITHUB_REPO ?? "";
const ghToken = env.GITHUB_TOKEN ?? "";

// ---------- DNS ----------
async function checkDns() {
  if (!stagingHost) {
    record({
      category: "DNS",
      name: "STAGING_HOST configured",
      status: "FAIL",
      required: true,
      evidence: "STAGING_HOST env var not set",
    });
    return;
  }
  const resolvers = ["1.1.1.1", "8.8.8.8"];
  const ips: string[] = [];
  for (const r of resolvers) {
    const res = await run("dig", ["+short", stagingHost, `@${r}`]);
    const file = writeArtifact(`dns-${r}.txt`, res.stdout + "\n" + res.stderr);
    const ip = res.stdout.trim().split("\n").find((l) => /^\d+\.\d+\.\d+\.\d+$/.test(l));
    if (ip) ips.push(ip);
    record({
      category: "DNS",
      name: `${stagingHost} via ${r}`,
      status: ip ? "PASS" : "FAIL",
      required: true,
      evidence: `Resolved: ${ip ?? "(none)"} — see ${file}`,
    });
  }
  if (expectedIp && ips.length > 0) {
    const allMatch = ips.every((ip) => ip === expectedIp);
    record({
      category: "DNS",
      name: `Matches STAGING_EXPECTED_IP (${expectedIp})`,
      status: allMatch ? "PASS" : "FAIL",
      required: true,
      evidence: `Resolved IPs: ${ips.join(", ")}`,
    });
  }
}

// ---------- SSL ----------
async function checkSsl() {
  if (!stagingHost) {
    record({
      category: "SSL",
      name: "Certificate validation",
      status: "FAIL",
      required: true,
      evidence: "STAGING_HOST not set",
    });
    return;
  }
  const res = await run(
    "bash",
    [
      "-c",
      `echo | openssl s_client -connect ${stagingHost}:443 -servername ${stagingHost} 2>/dev/null | openssl x509 -noout -subject -dates`,
    ],
    { timeoutMs: 20_000 },
  );
  const file = writeArtifact("ssl.txt", res.stdout + "\n" + res.stderr);
  const subjectMatch = res.stdout.includes(`CN = ${stagingHost}`) || res.stdout.includes(`CN=${stagingHost}`);
  const notAfter = /notAfter=(.+)/.exec(res.stdout)?.[1];
  let daysLeft = 0;
  if (notAfter) {
    daysLeft = Math.floor((Date.parse(notAfter) - Date.now()) / 86_400_000);
  }
  const ok = res.ok && subjectMatch && daysLeft >= 30;
  record({
    category: "SSL",
    name: `Cert for ${stagingHost} valid ≥30d & CN matches`,
    status: ok ? "PASS" : "FAIL",
    required: true,
    evidence: `notAfter=${notAfter ?? "(none)"}, daysLeft=${daysLeft}, CN match=${subjectMatch} — see ${file}`,
  });
}

// ---------- SSH ----------
async function checkSsh() {
  if (!sshHost || !sshUser) {
    record({
      category: "SSH",
      name: "Authentication",
      status: "FAIL",
      required: true,
      evidence: "SSH_HOST or SSH_USER not set",
    });
    return;
  }
  const keyArgs = sshKey ? ["-i", sshKey] : [];
  const sshArgs = [
    "-p", sshPort,
    "-o", "BatchMode=yes",
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "ConnectTimeout=10",
    ...keyArgs,
    `${sshUser}@${sshHost}`,
  ];

  const auth = await run("ssh", [...sshArgs, "echo ok"]);
  writeArtifact("ssh-auth.txt", auth.stdout + "\n" + auth.stderr);
  record({
    category: "SSH",
    name: `Auth to ${sshUser}@${sshHost}:${sshPort}`,
    status: auth.ok && auth.stdout.trim() === "ok" ? "PASS" : "FAIL",
    required: true,
    evidence: auth.ok ? "Returned ok" : `Error: ${auth.stderr.slice(0, 200)}`,
  });

  if (!auth.ok) return;

  const node = await run("ssh", [...sshArgs, "node --version || true"]);
  writeArtifact("ssh-node.txt", node.stdout + "\n" + node.stderr);
  const nodeVersion = node.stdout.trim();
  const major = /^v(\d+)\./.exec(nodeVersion)?.[1];
  const majorNum = major ? Number(major) : 0;
  // MilesWeb cPanel offers Node 20 and Node 24 LTS. Accept either.
  const nodeOk = majorNum >= 20;
  record({
    category: "Deployment Target",
    name: "Node ≥20 available (20 or 24 LTS)",
    status: nodeOk ? "PASS" : "FAIL",
    required: true,
    evidence: `node --version: ${nodeVersion || "(none)"}`,
  });

  const dir = await run("ssh", [
    ...sshArgs,
    `mkdir -p ${deployDir}/releases ${deployDir}/tmp && test -w ${deployDir}/releases && echo ok`,
  ]);
  writeArtifact("ssh-deploydir.txt", dir.stdout + "\n" + dir.stderr);
  record({
    category: "Deployment Target",
    name: `${deployDir}/releases writable`,
    status: dir.ok && dir.stdout.trim() === "ok" ? "PASS" : "FAIL",
    required: true,
    evidence: dir.ok ? "writable" : dir.stderr.slice(0, 200),
  });

  const passenger = await run("ssh", [
    ...sshArgs,
    `touch ${deployDir}/tmp/restart.txt && echo ok`,
  ]);
  writeArtifact("ssh-passenger.txt", passenger.stdout + "\n" + passenger.stderr);
  record({
    category: "Deployment Target",
    name: "Passenger restart trigger writable",
    status: passenger.ok && passenger.stdout.trim() === "ok" ? "PASS" : "FAIL",
    required: true,
    evidence: passenger.ok ? "tmp/restart.txt touched" : passenger.stderr.slice(0, 200),
  });
}

// ---------- GitHub ----------
async function checkGithub() {
  const required = [
    "STAGING_HOST",
    "STAGING_BASE_URL",
    "SSH_HOST",
    "SSH_PORT",
    "SSH_USER",
    "SSH_KEY",
  ];
  if (!ghRepo || !ghToken) {
    record({
      category: "GitHub",
      name: "API access",
      status: "FAIL",
      required: true,
      evidence: "GITHUB_REPO and GITHUB_TOKEN not set — cannot verify environment/secrets remotely",
    });
    for (const s of required) {
      record({
        category: "GitHub",
        name: `Secret ${s}`,
        status: "FAIL",
        required: true,
        evidence: "GitHub API not reachable",
      });
    }
    return;
  }
  const headers = {
    Authorization: `Bearer ${ghToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const envRes = await fetch(
    `https://api.github.com/repos/${ghRepo}/environments/staging`,
    { headers },
  );
  writeArtifact("gh-environment.json", JSON.stringify({ status: envRes.status }, null, 2));
  record({
    category: "GitHub",
    name: "staging environment exists",
    status: envRes.status === 200 ? "PASS" : "FAIL",
    required: true,
    evidence: `GET /environments/staging → ${envRes.status}`,
  });

  if (envRes.status !== 200) {
    for (const s of required) {
      record({
        category: "GitHub",
        name: `Secret ${s}`,
        status: "FAIL",
        required: true,
        evidence: "staging environment missing",
      });
    }
    return;
  }

  const secretsRes = await fetch(
    `https://api.github.com/repos/${ghRepo}/environments/staging/secrets`,
    { headers },
  );
  const secretsBody = await secretsRes.json().catch(() => ({}));
  writeArtifact("gh-secrets.json", JSON.stringify(secretsBody, null, 2));
  const envNames: string[] = (secretsBody?.secrets ?? []).map((s: any) => s.name);

  // Also list repo-scoped secrets — env-scope secrets can inherit / override, and
  // some teams keep the SSH_* set at repo scope only. Either scope satisfies the check.
  const repoSecretsRes = await fetch(
    `https://api.github.com/repos/${ghRepo}/actions/secrets`,
    { headers },
  );
  const repoSecretsBody = await repoSecretsRes.json().catch(() => ({}));
  writeArtifact("gh-secrets-repo.json", JSON.stringify(repoSecretsBody, null, 2));
  const repoNames: string[] = (repoSecretsBody?.secrets ?? []).map((s: any) => s.name);

  for (const s of required) {
    const inEnv = envNames.includes(s);
    const inRepo = repoNames.includes(s);
    const present = inEnv || inRepo;
    const scope = inEnv && inRepo ? "env+repo" : inEnv ? "env" : inRepo ? "repo" : "missing";
    record({
      category: "GitHub",
      name: `Secret ${s}`,
      status: present ? "PASS" : "FAIL",
      required: true,
      evidence: present ? `present (${scope})` : `not in env=[${envNames.join(", ") || "—"}] or repo=[${repoNames.join(", ") || "—"}]`,
    });
  }
}

// ---------- Report ----------
function buildReport(): string {
  const total = checks.length;
  const failed = checks.filter((c) => c.required && c.status === "FAIL");
  const status = failed.length === 0 ? "READY" : "STAGING BLOCKED";
  const lines: string[] = [];
  lines.push(`# Phase 2.2 — Prerequisite Report`);
  lines.push("");
  lines.push(`- **Generated:** ${startedAt.toISOString()}`);
  lines.push(`- **Workflow / Run:** ${env.GITHUB_RUN_ID ?? "local"}`);
  lines.push(`- **Overall status:** ${status}`);
  lines.push(`- **Evidence artifacts:** \`${evidenceDir}\``);
  lines.push("");
  lines.push("## Evidence Matrix");
  lines.push("");
  lines.push("| Category | Check | Status | Evidence |");
  lines.push("| --- | --- | --- | --- |");
  for (const c of checks) {
    lines.push(
      `| ${c.category} | ${c.name}${c.required ? "" : " _(optional)_"} | **${c.status}** | ${c.evidence.replace(/\|/g, "\\|")} |`,
    );
  }
  lines.push("");
  lines.push("## Result");
  lines.push("");
  if (failed.length === 0) {
    lines.push("All required checks PASS. Phase 2.2 execution may proceed per `phase-2-2-execution-runbook.md`.");
  } else {
    lines.push(`**STAGING BLOCKED.** ${failed.length} of ${total} required checks failed:`);
    lines.push("");
    for (const f of failed) lines.push(`- ${f.category} / ${f.name} — ${f.evidence}`);
    lines.push("");
    lines.push("See `infrastructure-activation-checklist.md` for remediation.");
  }
  return lines.join("\n") + "\n";
}

// ---------- History + Step Summary ----------
function categoryStatus(cat: string): "PASS" | "FAIL" {
  const rows = checks.filter((c) => c.required && c.category === cat);
  if (rows.length === 0) return "FAIL";
  return rows.every((r) => r.status === "PASS") ? "PASS" : "FAIL";
}

function deepLinks(): { runUrl: string; artifactUrl: string; reportPath: string; historyPath: string } {
  const runId = env.GITHUB_RUN_ID ?? "local";
  const repo = env.GITHUB_REPOSITORY ?? "";
  const branch = env.GITHUB_REF_NAME ?? "main";
  const runUrl = repo && runId !== "local"
    ? `https://github.com/${repo}/actions/runs/${runId}`
    : evidenceDir;
  const artifactUrl = repo && runId !== "local"
    ? `https://github.com/${repo}/actions/runs/${runId}#artifacts`
    : evidenceDir;
  const reportPath = repo
    ? `https://github.com/${repo}/blob/${branch}/docs/infrastructure/phase-2-2-prerequisite-report.md`
    : "docs/infrastructure/phase-2-2-prerequisite-report.md";
  const historyPath = repo
    ? `https://github.com/${repo}/blob/${branch}/docs/infrastructure/staging-readiness-history.md`
    : "docs/infrastructure/staging-readiness-history.md";
  return { runUrl, artifactUrl, reportPath, historyPath };
}

function buildStepSummary(overall: "GO" | "NO-GO"): string {
  const { runUrl, artifactUrl, reportPath, historyPath } = deepLinks();
  const rows: Array<[string, string]> = [
    ["DNS", categoryStatus("DNS")],
    ["SSL", categoryStatus("SSL")],
    ["SSH", categoryStatus("SSH")],
    ["GitHub Environment", checks.find((c) => c.name === "staging environment exists")?.status ?? "FAIL"],
    ["Required Secrets", checks.filter((c) => c.category === "GitHub" && c.name.startsWith("Secret ")).every((c) => c.status === "PASS") ? "PASS" : "FAIL"],
    ["Deploy Directory", checks.find((c) => c.name.includes("writable"))?.status ?? "FAIL"],
    ["Node Runtime", checks.find((c) => c.name === "Node 20 available")?.status ?? "FAIL"],
    ["Passenger Restart", checks.find((c) => c.name.includes("Passenger"))?.status ?? "FAIL"],
  ];
  const lines = [
    "## Staging Readiness",
    "",
    `- **Timestamp:** ${startedAt.toISOString()}`,
    `- **Run ID:** ${env.GITHUB_RUN_ID ?? "local"}`,
    "",
    "**Evidence:**",
    `- [Readiness Report](${reportPath})`,
    `- [Raw Evidence Artifact](${artifactUrl})`,
    `- [Workflow Run](${runUrl})`,
    `- [Readiness History](${historyPath})`,
    "",
    "| Check | Status |",
    "| --- | --- |",
    ...rows.map(([k, v]) => `| ${k} | ${v === "PASS" ? "✅ PASS" : "❌ FAIL"} |`),
    "",
    `**STATUS: ${overall}**`,
    "",
  ];
  return lines.join("\n");
}

function cacheKey(): string {
  const crypto = require("node:crypto");
  const fs = require("node:fs");
  const parts: string[] = [];
  for (const p of [
    ".github/workflows/staging-readiness.yml",
    "scripts/check-staging-readiness.ts",
  ]) {
    try {
      parts.push(p + ":" + crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"));
    } catch {
      parts.push(p + ":missing");
    }
  }
  const requiredSecrets = ["STAGING_HOST", "STAGING_BASE_URL", "SSH_HOST", "SSH_PORT", "SSH_USER", "SSH_KEY"];
  parts.push("secrets:" + requiredSecrets.sort().join(","));
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
}

function validateDeepLinks(links: ReturnType<typeof deepLinks>): { ok: boolean; details: string[] } {
  const fs = require("node:fs");
  const details: string[] = [];
  let ok = true;
  const reportLocal = "docs/infrastructure/phase-2-2-prerequisite-report.md";
  const historyLocal = "docs/infrastructure/staging-readiness-history.md";
  for (const [name, p] of [["report", reportLocal], ["history", historyLocal]] as const) {
    if (fs.existsSync(p)) {
      details.push(`${name}=ok`);
    } else {
      ok = false;
      details.push(`${name}=missing(${p})`);
    }
  }
  for (const [name, u] of [
    ["run_url", links.runUrl],
    ["artifact_url", links.artifactUrl],
    ["report_url", links.reportPath],
    ["history_url", links.historyPath],
  ] as const) {
    if (!u || !/^https?:\/\//.test(u)) {
      // local mode is allowed; only flag invalid http URLs
      if (u && !u.startsWith("/") && !u.startsWith("docs/")) {
        ok = false;
        details.push(`${name}=invalid(${u})`);
      } else {
        details.push(`${name}=local`);
      }
    } else {
      details.push(`${name}=ok`);
    }
  }
  return { ok, details };
}

function writeCache(overall: "GO" | "NO-GO"): string {
  const cachePath = resolve(process.cwd(), "test-results/readiness/cache.json");
  const { runUrl, artifactUrl, reportPath } = deepLinks();
  const payload = {
    run_id: env.GITHUB_RUN_ID ?? "local",
    timestamp: startedAt.toISOString(),
    status: overall,
    cache_key: cacheKey(),
    artifact_url: artifactUrl,
    report_url: reportPath,
    run_url: runUrl,
    evidence_dir: evidenceDir,
    ttl_hours: Number(env.READINESS_CACHE_TTL_HOURS ?? "24"),
  };
  mkdirSync(resolve(process.cwd(), "test-results/readiness"), { recursive: true });
  writeFileSync(cachePath, JSON.stringify(payload, null, 2));
  return cachePath;
}

function updateHistory(overall: "GO" | "NO-GO"): { prior: "GO" | "NO-GO" | null } {
  const historyPath = resolve(
    process.cwd(),
    "docs/infrastructure/staging-readiness-history.md",
  );
  const header = [
    "# Staging Readiness History",
    "",
    "Auto-maintained by `scripts/check-staging-readiness.ts`. Newest first.",
    "",
    "| Timestamp | Run ID | DNS | SSL | SSH | Secrets | Result | Evidence |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  let existing = "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    existing = require("node:fs").readFileSync(historyPath, "utf8");
  } catch {}
  const existingRows = existing
    .split("\n")
    .filter((l) => l.startsWith("| ") && !l.startsWith("| ---") && !l.startsWith("| Timestamp"));
  const prior: "GO" | "NO-GO" | null = existingRows.length
    ? (existingRows[0].includes("| GO |") ? "GO" : "NO-GO")
    : null;
  const runId = env.GITHUB_RUN_ID ?? "local";
  const repo = env.GITHUB_REPOSITORY ?? "";
  const evidenceLink = repo && runId !== "local"
    ? `[run](https://github.com/${repo}/actions/runs/${runId})`
    : "local";
  const secretsStatus = checks
    .filter((c) => c.category === "GitHub" && c.name.startsWith("Secret "))
    .every((c) => c.status === "PASS")
    ? "PASS"
    : "FAIL";
  const newRow = `| ${startedAt.toISOString()} | ${runId} | ${categoryStatus("DNS")} | ${categoryStatus("SSL")} | ${categoryStatus("SSH")} | ${secretsStatus} | ${overall} | ${evidenceLink} |`;
  const body = [...header, newRow, ...existingRows].join("\n") + "\n";
  writeFileSync(historyPath, body);
  return { prior };
}

function appendGithubOutput(kv: Record<string, string>): void {
  const out = env.GITHUB_OUTPUT;
  if (!out) return;
  const lines = Object.entries(kv).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("node:fs").appendFileSync(out, lines);
}

function appendStepSummary(body: string): void {
  const out = env.GITHUB_STEP_SUMMARY;
  if (!out) return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("node:fs").appendFileSync(out, body);
}

(async () => {
  try {
    const fixture = env.READINESS_FIXTURE_STATUS;
    if (fixture === "GO" || fixture === "NO-GO") {
      record({ category: "Fixture", name: `forced ${fixture}`, status: fixture === "GO" ? "PASS" : "FAIL", required: true, evidence: "READINESS_FIXTURE_STATUS override" });
    } else {
      await checkDns();
      await checkSsl();
      await checkSsh();
      await checkGithub();
    }
    const failed = checks.filter((c) => c.required && c.status === "FAIL");
    const overall: "GO" | "NO-GO" = failed.length === 0 ? "GO" : "NO-GO";
    const report = buildReport();
    const reportPath = resolve(
      process.cwd(),
      "docs/infrastructure/phase-2-2-prerequisite-report.md",
    );
    writeFileSync(reportPath, report);
    writeArtifact("summary.json", JSON.stringify(checks, null, 2));
    const cachePath = writeCache(overall);
    const { prior } = updateHistory(overall);
    appendStepSummary(buildStepSummary(overall));
    const links = deepLinks();
    const linkCheck = validateDeepLinks(links);
    writeArtifact("deep-link-validation.json", JSON.stringify(linkCheck, null, 2));
    if (!linkCheck.ok) {
      console.error(`[readiness] deep-link validation FAIL: ${linkCheck.details.join(", ")}`);
    }
    appendGithubOutput({
      status: overall,
      transitioned: prior === "NO-GO" && overall === "GO" ? "true" : "false",
      prior_status: prior ?? "none",
      report_url: links.reportPath,
      artifact_url: links.artifactUrl,
      run_url: links.runUrl,
      cache_path: cachePath,
      cache_key: cacheKey(),
      deep_links_ok: linkCheck.ok ? "true" : "false",
    });
    console.log(`\nReport: ${reportPath}`);
    console.log(`Cache:  ${cachePath} (key=${cacheKey()})`);
    console.log(`DeepLinks: ${linkCheck.ok ? "OK" : "FAIL"} — ${linkCheck.details.join(", ")}`);
    console.log(`Overall: ${overall} (prior: ${prior ?? "none"})`);
    process.exit(overall === "GO" ? 0 : 1);
  } catch (err) {
    console.error("[readiness] checker errored:", err);
    process.exit(2);
  }
})();

