#!/usr/bin/env bun
/**
 * Phase 2.0.1 — Smoke Test Runner
 *
 * Runs the tests/smoke/** Playwright suite and emits a machine-readable
 * JSON summary alongside human-friendly console output.
 *
 * Usage:
 *   SMOKE_BASE_URL=https://staging.higaet.com bun scripts/run-smoke-tests.ts
 *
 * Exit codes:
 *   0  all suites passed
 *   1  one or more suites failed
 *   2  runner itself errored
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const REPORT_DIR = resolve(process.cwd(), "test-results/smoke");
const REPORT_JSON = resolve(REPORT_DIR, "report.json");
const SUMMARY_JSON = resolve(REPORT_DIR, "summary.json");

mkdirSync(REPORT_DIR, { recursive: true });

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:8080";
console.log(`[smoke] target: ${baseUrl}`);

const args = [
  "playwright",
  "test",
  "tests/smoke",
  "--reporter=json",
];

const started = Date.now();
const child = spawn("bunx", args, {
  env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: REPORT_JSON },
  stdio: ["inherit", "pipe", "inherit"],
});

let stdout = "";
child.stdout.on("data", (b) => {
  stdout += b.toString();
});

child.on("close", (code) => {
  const elapsedMs = Date.now() - started;
  try {
    if (!existsSync(dirname(REPORT_JSON))) mkdirSync(dirname(REPORT_JSON), { recursive: true });
    if (stdout.trim().startsWith("{")) writeFileSync(REPORT_JSON, stdout);

    const raw = existsSync(REPORT_JSON) ? readFileSync(REPORT_JSON, "utf8") : stdout;
    const json = raw ? JSON.parse(raw) : {};
    const stats = json.stats ?? {};
    const summary = {
      target: baseUrl,
      startedAt: new Date(started).toISOString(),
      elapsedMs,
      exitCode: code ?? 0,
      expected: stats.expected ?? 0,
      unexpected: stats.unexpected ?? 0,
      flaky: stats.flaky ?? 0,
      skipped: stats.skipped ?? 0,
      ok: (code ?? 1) === 0,
    };
    writeFileSync(SUMMARY_JSON, JSON.stringify(summary, null, 2));
    console.log("[smoke] summary:", summary);
  } catch (err) {
    console.error("[smoke] failed to parse report:", err);
    process.exit(2);
  }
  process.exit(code ?? 1);
});
