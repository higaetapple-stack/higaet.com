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
npm run build:node   # canonical production build (node-server preset)
```

It must succeed and emit `.output/server/index.mjs`. Node SSR is the only
supported production runtime — never validate against a Cloudflare build.

## Two-lockfile contract

HIGAET intentionally keeps BOTH `bun.lock` and `package-lock.json`.

| Lockfile | Used by | Why |
|---|---|---|
| `package-lock.json` | **Canonical.** GitHub Actions (`npm ci`) and the MilesWeb Passenger deploy | One package manager for CI and production |
| `bun.lock` | Lovable sandbox dev server only | Local iteration speed inside Lovable; never used by CI or production |

The `scripts/production-lock-check.mjs` script (invoked by `npm run prebuild`)
hashes `package-lock.json` — that is the deploy source of truth.

To prevent drift, `scripts/check-lockfile-sync.mjs` verifies the two
lockfiles resolve the same **top-level** dependency versions declared in
`package.json`. It is wired into `pr-checks.yml`. When you change
`package.json`, run BOTH package managers:

```bash
npm install     # canonical — regenerates package-lock.json
bun install     # optional, keeps the Lovable sandbox lockfile in sync
```

`bun.lock` may be deleted once the Lovable sandbox is switched to npm; nothing
in CI, `_deploy-kernel.yml`, or MilesWeb reads it.
