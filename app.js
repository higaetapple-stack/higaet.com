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
console.log("[passenger] booting HIGAET node server");
console.log("[passenger] node:", process.version);
console.log("[passenger] cwd:", process.cwd());
console.log("[passenger] entry:", import.meta.url);
console.log("[passenger] env:", {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
});
console.log("[passenger] dotenv loaded:", dotEnvLoaded);
console.log("[passenger] runtime config:", {
  SUPABASE_URL: process.env.SUPABASE_URL ? "set" : "missing",
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY ? "set" : "missing",
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? "set" : "missing",
  VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "set" : "missing",
  BREVO_API_KEY: process.env.BREVO_API_KEY ? "set" : "missing",
});

try {
  console.log("[passenger] resolved server bundle:", serverPath);
  console.log("[passenger] bundle exists:", existsSync(serverPath));
  try {
    console.log("[passenger] .output -> ", readlinkSync(resolve(here, ".output")));
  } catch {
    /* not a symlink — fine */
  }
} catch (err) {
  console.error("[passenger] pre-boot check failed:", err);
}

if (!existsSync(serverPath)) {
  console.error(
    "[passenger] FATAL: .output/server/index.mjs is missing. " +
      "Run `BUILD_TARGET=node bun run build:node` and re-deploy.",
  );
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
