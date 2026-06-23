#!/usr/bin/env node
/**
 * Parse playwright-results.json and emit docs/testing/launch-readiness-report.md
 * with a scenario × role grid and pass-rate.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const path = "playwright-results.json";
if (!existsSync(path)) {
  console.error(`Missing ${path}. Run \`bunx playwright test\` first.`);
  process.exit(1);
}
const data = JSON.parse(readFileSync(path, "utf8"));

const tests = [];
const walk = (suite) => {
  for (const s of suite.suites ?? []) walk(s);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const result = t.results?.[0];
      tests.push({
        title: spec.title,
        file: spec.file,
        status: result?.status ?? "unknown",
      });
    }
  }
};
for (const s of data.suites ?? []) walk(s);

const pass = tests.filter((t) => t.status === "passed").length;
const fail = tests.filter((t) => t.status !== "passed").length;
const rate = tests.length ? ((pass / tests.length) * 100).toFixed(1) : "0.0";
const overall = fail === 0 ? "✅ GO" : "❌ NO-GO";

const rows = tests
  .map((t) => `| ${t.status === "passed" ? "✅" : "❌"} | ${t.title} | \`${t.file}\` |`)
  .join("\n");

writeFileSync(
  "docs/testing/launch-readiness-report.md",
  `# Launch Readiness Report

> Generated on ${new Date().toISOString()} from \`playwright-results.json\`.

**Overall:** ${overall}  
**Pass rate:** ${rate}% (${pass}/${tests.length})  
**Failures:** ${fail}

## Scenario results

| Result | Scenario | File |
|---|---|---|
${rows || "_no tests_"}

Target: 100% before production launch.
`,
);
console.log(`Wrote docs/testing/launch-readiness-report.md (${pass}/${tests.length} passing)`);
process.exit(fail === 0 ? 0 : 1);
