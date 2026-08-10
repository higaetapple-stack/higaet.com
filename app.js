// Passenger entry shim for MilesWeb cPanel Node.js apps.
// Boots the TanStack Start / Nitro `node-server` build output.
// Nitro auto-listens on process.env.PORT + 0.0.0.0 when imported.

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(here, ".output/server/index.mjs");
const envPath = resolve(here, ".env");

function loadDotEnvFile(path) {
  if (!existsSync(path)) return false;
  try {
    const content = readFileSync(path, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      let value = rawValue.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
    return true;
  } catch {
    return false;
  }
}

// Canonical production defaults
process.env.NODE_ENV ||= "production";
process.env.HOST ||= "0.0.0.0";
loadDotEnvFile(envPath);

// Required Production Environment Variables
const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET"
];

const missing = REQUIRED_ENV.filter(v => !process.env[v]);

console.log("[passenger] ============================================");
console.log("[passenger] HIGAET Production Node Server");
console.log("[passenger] ============================================");
console.log("[passenger] root     :", here);
console.log("[passenger] node     :", process.version);
console.log("[passenger] env      :", process.env.NODE_ENV);
console.log("[passenger] artifact :", serverPath);
console.log("[passenger] exists   :", existsSync(serverPath));

// Safe ENV check (no values logged)
console.log("[passenger] config   :", {
  SUPABASE_URL: process.env.SUPABASE_URL ? "SET" : "MISSING",
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY ? "SET" : "MISSING",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
  SESSION_SECRET: process.env.SESSION_SECRET ? "SET" : "MISSING",
});

if (missing.length > 0) {
  console.error("[passenger] FATAL: Missing mandatory variables:", missing.join(", "));
  console.error("[passenger] Please set these in cPanel -> Setup Node.js App.");
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

if (!existsSync(serverPath)) {
  console.error("[passenger] FATAL: .output/server/index.mjs not found.");
  process.exit(1);
}

process.on("uncaughtException", (err) => {
  console.error("[passenger] Uncaught Exception:", err);
});

// Boot Nitro
import(pathToFileURL(serverPath).href)
  .then(() => console.log("[passenger] Nitro server bundle loaded"))
  .catch((err) => {
    console.error("[passenger] Failed to load server bundle:", err);
    process.exit(1);
  });
