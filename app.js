// Passenger entry shim for MilesWeb cPanel Node.js apps.
// Boots the TanStack Start / Nitro `node-server` build output.
// Nitro auto-listens on process.env.PORT + 0.0.0.0 when imported — do NOT
// add an http.createServer here, that would replace the real SSR app.

import { existsSync, readlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(here, ".output/server/index.mjs");

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
});
process.on("unhandledRejection", (reason) => {
  console.error("[passenger] unhandledRejection:", reason);
});

import(pathToFileURL(serverPath).href)
  .then(() => console.log("[passenger] server bundle loaded"))
  .catch((err) => {
    console.error("[passenger] failed to load server bundle:", err);
    process.exit(1);
  });
