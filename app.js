// Passenger entry shim for MilesWeb cPanel Node.js apps.
// Imports the TanStack Start node-server build output.
// Not used by Lovable preview (Cloudflare preset) — only active after Vite
// preset is switched to "node-server" during the runtime migration.

import("./.output/server/index.mjs").catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[passenger] failed to load server bundle:", err);
  process.exit(1);
});
