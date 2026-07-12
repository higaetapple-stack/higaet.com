#!/usr/bin/env node
/**
 * Deploy-kernel contract validator.
 *
 * Enforces on `.github/workflows/_deploy-kernel.yml` at the current checkout:
 *   1. File exists.
 *   2. No `SSH_PRIVATE_KEY` reference (legacy contract).
 *   3. At least one `secrets.SSH_KEY` reference (current contract).
 *   4. `DEPLOY_DIR` sourced from `vars.DEPLOY_DIR`, NEVER `secrets.DEPLOY_DIR`.
 *
 * Prints matched line numbers + line contents so failed CI runs surface
 * actionable evidence instead of a generic "grep found something" message.
 *
 * Exit codes:
 *   0 — kernel contract is correct
 *   1 — one or more violations
 *   2 — kernel file missing
 *
 * Usage:
 *   node scripts/check-deploy-kernel.mjs
 *   node scripts/check-deploy-kernel.mjs --json    # machine-readable output
 *   node scripts/check-deploy-kernel.mjs --file <path>   # override target
 */

import { readFileSync, existsSync } from "node:fs";
import { relative, resolve } from "node:path";

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const fileFlagIdx = args.indexOf("--file");
const KERNEL = resolve(
  fileFlagIdx >= 0 && args[fileFlagIdx + 1]
    ? args[fileFlagIdx + 1]
    : ".github/workflows/_deploy-kernel.yml",
);

const isCi = process.env.GITHUB_ACTIONS === "true";
const gh = (kind, msg) => (isCi ? `::${kind}::${msg}` : `[${kind}] ${msg}`);

/** Scan for a pattern and return { line, text } for every hit. */
function scan(source, pattern) {
  const out = [];
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) out.push({ line: i + 1, text: lines[i].trim() });
  }
  return out;
}

const findings = [];
const evidence = {
  file: relative(process.cwd(), KERNEL),
  ssh_private_key: [],
  ssh_key: [],
  deploy_dir_vars: [],
  deploy_dir_secrets: [],
};

if (!existsSync(KERNEL)) {
  console.error(gh("error", `Deploy kernel missing at ${evidence.file}`));
  if (jsonMode) console.log(JSON.stringify({ ok: false, reason: "missing", evidence }, null, 2));
  process.exit(2);
}

const source = readFileSync(KERNEL, "utf8");

// 1. Legacy secret must be gone.
evidence.ssh_private_key = scan(source, /SSH_PRIVATE_KEY/);
if (evidence.ssh_private_key.length > 0) {
  findings.push({
    severity: "error",
    rule: "no-legacy-ssh-private-key",
    message: `Legacy secret SSH_PRIVATE_KEY still referenced (${evidence.ssh_private_key.length} occurrence(s)). Use secrets.SSH_KEY.`,
    matches: evidence.ssh_private_key,
  });
}

// 2. Must reference secrets.SSH_KEY.
evidence.ssh_key = scan(source, /secrets\.SSH_KEY\b/);
if (evidence.ssh_key.length === 0) {
  findings.push({
    severity: "error",
    rule: "requires-ssh-key",
    message: "secrets.SSH_KEY not referenced anywhere in the deploy kernel.",
    matches: [],
  });
}

// 3. DEPLOY_DIR must come from vars, not secrets.
evidence.deploy_dir_vars = scan(source, /vars\.DEPLOY_DIR\b/);
evidence.deploy_dir_secrets = scan(source, /secrets\.DEPLOY_DIR\b/);
if (evidence.deploy_dir_vars.length === 0) {
  findings.push({
    severity: "error",
    rule: "deploy-dir-from-vars",
    message: "DEPLOY_DIR is not sourced from vars.DEPLOY_DIR.",
    matches: [],
  });
}
if (evidence.deploy_dir_secrets.length > 0) {
  findings.push({
    severity: "error",
    rule: "no-deploy-dir-from-secrets",
    message: `DEPLOY_DIR must come from vars, not secrets (${evidence.deploy_dir_secrets.length} occurrence(s)).`,
    matches: evidence.deploy_dir_secrets,
  });
}

const ok = findings.length === 0;

if (jsonMode) {
  console.log(JSON.stringify({ ok, findings, evidence }, null, 2));
} else {
  console.log(`Deploy kernel contract check — ${evidence.file}`);
  console.log(`  SSH_PRIVATE_KEY refs : ${evidence.ssh_private_key.length}  (expected 0)`);
  console.log(`  secrets.SSH_KEY refs : ${evidence.ssh_key.length}  (expected >= 1)`);
  console.log(`  vars.DEPLOY_DIR refs : ${evidence.deploy_dir_vars.length}  (expected >= 1)`);
  console.log(`  secrets.DEPLOY_DIR   : ${evidence.deploy_dir_secrets.length}  (expected 0)`);

  const printMatches = (label, matches) => {
    if (matches.length === 0) return;
    console.log(`\n  ${label}:`);
    for (const m of matches) console.log(`    ${evidence.file}:${m.line}: ${m.text}`);
  };
  printMatches("SSH_PRIVATE_KEY matches", evidence.ssh_private_key);
  printMatches("secrets.SSH_KEY matches", evidence.ssh_key);
  printMatches("vars.DEPLOY_DIR matches", evidence.deploy_dir_vars);
  printMatches("secrets.DEPLOY_DIR matches", evidence.deploy_dir_secrets);

  if (!ok) {
    console.error("");
    for (const f of findings) {
      console.error(gh(f.severity, `[${f.rule}] ${f.message}`));
      for (const m of f.matches) {
        console.error(gh(f.severity, `  ${evidence.file}:${m.line}: ${m.text}`));
      }
    }
    console.error("");
    console.error(
      gh(
        "error",
        `Deploy kernel contract FAILED — re-dispatch Unified Deploy from a SHA where ${evidence.file} uses secrets.SSH_KEY + vars.DEPLOY_DIR only.`,
      ),
    );
  } else {
    console.log("\n" + gh("notice", "Deploy kernel contract OK."));
  }
}

process.exit(ok ? 0 : 1);
