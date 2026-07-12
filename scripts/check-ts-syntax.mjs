#!/usr/bin/env node
/**
 * Fast TypeScript syntax gate.
 *
 * Runs `tsc --noEmit` and fails IMMEDIATELY when any parse-level TS error
 * appears (TS1xxx family — e.g. TS1109 "Expression expected", TS1128
 * "Declaration or statement expected", TS1005 "';' expected", etc.).
 *
 * This runs BEFORE coverage and a11y jobs so we never waste minutes on a
 * PR that cannot even be parsed. Semantic (type) errors are still surfaced
 * by the regular typecheck step in the CI kernel — this gate only cares
 * about syntax so it stays fast and unambiguous.
 */
import { spawnSync } from "node:child_process";

const SYNTAX_TS_CODES = /\bTS1(0\d{2}|1\d{2}|2\d{2})\b/; // TS1000–TS1299 covers parser errors

const res = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["--no-install", "tsc", "--noEmit", "--pretty", "false"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);

const combined = `${res.stdout ?? ""}${res.stderr ?? ""}`;
const lines = combined.split(/\r?\n/);
const syntaxErrors = lines.filter((l) => SYNTAX_TS_CODES.test(l));

if (syntaxErrors.length > 0) {
  console.error("❌ TypeScript SYNTAX errors detected — failing PR early.\n");
  console.error("Matched lines (file:line:col — error code — message):\n");
  for (const l of syntaxErrors) console.error("  " + l);
  console.error(
    `\nTotal syntax errors: ${syntaxErrors.length}. ` +
      "Fix these before coverage/a11y jobs run.",
  );
  process.exit(1);
}

if (res.status !== 0) {
  // No syntax errors, but tsc still exited non-zero (semantic errors).
  // This gate ONLY guards syntax — let the full typecheck job report those.
  console.log(
    "✔ No TS syntax errors (TS1xxx). Non-zero tsc exit is semantic — " +
      "handled by the full typecheck job.",
  );
  process.exit(0);
}

console.log("✔ No TypeScript syntax errors detected.");
process.exit(0);
