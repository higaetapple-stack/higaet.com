// Passenger entry shim for MilesWeb cPanel Node.js apps.
// Boots the TanStack Start / Nitro `node-server` build output.
// Nitro auto-listens on process.env.PORT + 0.0.0.0 when imported — do NOT
// add an http.createServer here, that would replace the real SSR app.

import { existsSync, readFileSync, readlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(here, ".output/server/index.mjs");
const envPath = resolve(here, ".env");

function loadDotEnvFile(path) {
  if (!existsSync(path)) return false;

  const content = readFileSync(path, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }

  return true;
}

process.env.NODE_ENV ||= "production";
process.env.HOST ||= "0.0.0.0";
const dotEnvLoaded = loadDotEnvFile(envPath);

// Strict runtime validation of required environment variables.
// Passenger swallows silent boot crashes into an opaque 504 — fail loudly
// with an actionable, cPanel-visible message instead. Set STRICT_ENV=0 only
// for temporary local debugging; production must keep it on.
const REQUIRED_ENV = [
  {
    name: "SUPABASE_URL",
    hint: "Set in cPanel → Setup Node.js App → Environment variables. Must match VITE_SUPABASE_URL.",
  },
  {
    name: "SUPABASE_PUBLISHABLE_KEY",
    hint: "Publishable (anon) key from Lovable Cloud. NOT the service role key.",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    hint: "Server-only. Required for admin/webhook code paths. Never expose to the client.",
  },
  {
    name: "SESSION_SECRET",
    hint: "Random 32+ char string. Generate with: openssl rand -hex 32",
  },
];

const strictEnv = process.env.STRICT_ENV !== "0" && process.env.NODE_ENV === "production";
const missingEnv = REQUIRED_ENV.filter((v) => !process.env[v.name]);
if (missingEnv.length > 0) {
  console.error("[passenger] FATAL: missing required environment variables:");
  for (const v of missingEnv) {
    console.error(`  - ${v.name}: ${v.hint}`);
  }
  console.error(
    "[passenger] Configure them in cPanel → Setup Node.js App → Environment variables, then restart the app (touch tmp/restart.txt).",
  );
  if (strictEnv) {
    process.exit(1);
  } else {
    console.error("[passenger] STRICT_ENV=0 — continuing boot with degraded config (NOT SAFE for production).");
  }
}

// Boot diagnostics — surface in cPanel stderr.log so 504s are debuggable.
// Everything below is printed BEFORE the server bundle is imported so the
// operator can see the resolved application root, Node version, env, and
// artifact path even if bundle import fails.
let supabaseHost = "unset";
try {
  supabaseHost = process.env.SUPABASE_URL
    ? new URL(process.env.SUPABASE_URL).host
    : "unset";
} catch {
  supabaseHost = "invalid-url";
}

console.log("[passenger] ============================================");
console.log("[passenger]  HIGAET node server — startup diagnostics");
console.log("[passenger] ============================================");
console.log("[passenger] application root :", here);
console.log("[passenger] cwd              :", process.cwd());
console.log("[passenger] node version     :", process.version);
console.log("[passenger] NODE_ENV         :", process.env.NODE_ENV);
console.log("[passenger] server bundle    :", serverPath);
console.log("[passenger] bundle exists    :", existsSync(serverPath));
console.log("[passenger] PORT             :", process.env.PORT ?? "(unset)");
console.log("[passenger] HOST             :", process.env.HOST);
console.log("[passenger] SUPABASE_URL host:", supabaseHost);
console.log("[passenger] dotenv loaded    :", dotEnvLoaded);
console.log("[passenger] env check        :", {
  SUPABASE_URL: process.env.SUPABASE_URL ? "PRESENT" : "MISSING",
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY ? "PRESENT" : "MISSING",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "PRESENT" : "MISSING",
  SESSION_SECRET: process.env.SESSION_SECRET ? "PRESENT" : "MISSING",
});


try {
  console.log("[passenger] .output -> ", readlinkSync(resolve(here, ".output")));
} catch {
  /* not a symlink — fine */
}
console.log("[passenger] ============================================");

if (!existsSync(serverPath)) {
  console.error("[passenger] ============================================");
  console.error("[passenger]  FATAL: SSR entry not found");
  console.error("[passenger] ============================================");
  console.error("[passenger] expected: " + serverPath);
  try {
    const { readdirSync, statSync } = await import("node:fs");
    const outputDir = resolve(here, ".output");
    if (existsSync(outputDir)) {
      console.error("[passenger] .output/ contents:");
      for (const entry of readdirSync(outputDir)) {
        const p = resolve(outputDir, entry);
        const kind = statSync(p).isDirectory() ? "dir " : "file";
        console.error(`[passenger]   ${kind} ${entry}`);
      }
    } else {
      console.error("[passenger] .output/ directory does NOT exist at " + outputDir);
    }
    console.error("[passenger] release root contents:");
    for (const entry of readdirSync(here)) {
      console.error(`[passenger]   - ${entry}`);
    }
  } catch (err) {
    console.error("[passenger] (failed to list release dir: " + err + ")");
  }
  console.error("[passenger] --------------------------------------------");
  console.error("[passenger] Fix: re-run Unified Deploy in GitHub Actions.");
  console.error("[passenger] CI must build with BUILD_TARGET=node and rsync");
  console.error("[passenger] .output/ into this release folder. Do NOT run");
  console.error("[passenger] vite build on the host — CloudLinux LVE limits");
  console.error("[passenger] will crash Rayon threads.");
  console.error("[passenger] ============================================");
  process.exit(1);
}

process.on("uncaughtException", (err) => {
  console.error("[passenger] uncaughtException:", err);
  setImmediate(() => process.exit(1));
});
process.on("unhandledRejection", (reason) => {
  console.error("[passenger] unhandledRejection:", reason);
  setImmediate(() => process.exit(1));
});
process.on("warning", (warning) => {
  console.warn("[passenger] warning:", warning);
});

import(pathToFileURL(serverPath).href)
  .then(() => console.log("[passenger] server bundle loaded"))
  .catch((err) => {
    console.error("[passenger] failed to load server bundle:", err);
    process.exit(1);
  });
