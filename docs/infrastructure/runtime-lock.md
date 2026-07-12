# Runtime Lock — Nitro 3 beta & Lockfile Contract

Owner: HIGAET Infra
Status: intentional pin

## Nitro 3 beta pin

`package.json` pins `nitro@3.0.260603-beta` (devDependency). This is
**intentional**. It matches the version bundled by
`@lovable.dev/vite-tanstack-config@2.7.1` and by the
`@tanstack/react-start@1.16x` SSR entry which emits
`.output/server/index.mjs` in the shape `app.js` boots on MilesWeb
Passenger.

Do **not** replace it with `nitro@^2` — the v2 line is not API-compatible
with TanStack Start v1 and will break both the Cloudflare Workers preset
(default Lovable Cloud build) and the `node-server` preset
(MilesWeb / Passenger build).

Nitro 3 has not shipped a stable non-beta tag on npm at time of writing.
`renovate.json` is configured to open a PR the moment one appears:

```json
{
  "matchPackageNames": ["nitro"],
  "allowedVersions": "!/beta/"
}
```

When Renovate raises that PR, verify both build targets before merging:

```bash
bun run build            # Cloudflare Workers (default Lovable Cloud)
BUILD_TARGET=node bun run build   # node-server preset for MilesWeb
```

Both must succeed and emit `.output/server/index.mjs` for the Node target.

## Two-lockfile contract

HIGAET intentionally keeps BOTH `bun.lock` and `package-lock.json`.

| Lockfile | Used by | Why |
|---|---|---|
| `bun.lock` | GitHub Actions `_ci-kernel.yml` and every kernel caller | CI install speed |
| `package-lock.json` | MilesWeb Passenger deploy (`app.js` cold start) | Deterministic prod install without requiring Bun on the shared host |

The `scripts/production-lock-check.mjs` script (invoked by `npm run prebuild`)
hashes `package-lock.json` — that is the deploy source of truth.

To prevent drift, `scripts/check-lockfile-sync.mjs` verifies the two
lockfiles resolve the same **top-level** dependency versions declared in
`package.json`. It is wired into `pr-checks.yml`. When you change
`package.json`, run BOTH package managers:

```bash
bun install
npm install
```

A single-lockfile future is possible but requires:

1. Validating MilesWeb Passenger with `bun install --production` on the
   cPanel Node.js app.
2. Updating `app.js` install docs and the deploy runbook.
3. Removing `package-lock.json` from `scripts/production-lock-check.mjs`.

Do not attempt that migration without a staged rollout and rollback plan.
