# HIGAET Production Deployment Checklist

Canonical flow. **Never build on MilesWeb.**

```
Lovable  →  GitHub  →  GitHub Actions  →  MilesWeb Passenger
```

## Pipeline

| Stage        | Where            | What                                                                  |
| ------------ | ---------------- | --------------------------------------------------------------------- |
| Source       | Lovable → GitHub | TanStack Start routes, server entry, config                           |
| Build        | GitHub Actions   | `npm run build:node` → `.output/server/index.mjs` + `.output/public`  |
| Verify build | GitHub Actions   | `verify-node-build.mjs` + `generate-build-manifest.mjs` (hard gates)  |
| Artifact     | Actions upload   | `.output/`, `app.js`, `package.json`, `package-lock.json`, `scripts/` |
| Deploy       | `_deploy-kernel` | rsync artifact → `/home/wnwpopno/higaet.com/releases/<id>/`           |
| Install      | MilesWeb SSH     | `npm ci --omit=dev --prefer-offline --no-audit --no-fund`             |
| Activate     | MilesWeb         | `ln -sfn releases/<id> current`                                       |
| Restart      | Passenger        | `touch tmp/restart.txt`                                               |
| Health check | GitHub Actions   | poll `/healthz` until HTTP 200 (timeout 180s) — else rollback         |
| Smoke        | MilesWeb         | `scripts/run-smoke-tests.ts` against live release                     |

## 1. Build

```bash
npm ci
npm run build:node
```

`build:node` strips the Lovable sandbox signals (`LOVABLE_SANDBOX`,
`DEV_SERVER__PROJECT_PATH`) so Nitro honours `preset: "node-server"` from
`vite.config.ts` instead of the sandbox's Cloudflare override.

`postbuild:node` runs automatically and performs two hard gates:

1. `scripts/verify-node-build.mjs`
   - `.output/server/index.mjs` exists and is ≥ 1 KB
   - `nitro.json` preset is **exactly** `node-server`
   - no Cloudflare artifacts (`wrangler.json`, `_worker.js`, `worker.js`)
2. `scripts/generate-build-manifest.mjs` → writes `.output/build-manifest.json`

Either failing exits non-zero and fails the workflow before deploy.

### Build manifest

`.output/build-manifest.json` is shipped inside every release:

```json
{
  "schemaVersion": 1,
  "deploymentTarget": "MilesWeb Passenger",
  "git": { "sha": "...", "shortSha": "...", "ref": "...", "runId": "..." },
  "build": {
    "timestampUtc": "2026-07-26T18:57:27.139Z",
    "buildTarget": "node",
    "nitroPreset": "node-server",
    "ci": true
  },
  "toolchain": {
    "node": "v22.22.0",
    "npm": "10.9.4",
    "tanstackStart": "1.167.50",
    "tanstackRouter": "1.168.25",
    "vite": "7.3.2"
  },
  "serverEntry": {
    "path": ".output/server/index.mjs",
    "sizeBytes": 121598,
    "sha256": "f0942d8d…"
  },
  "publicAssets": { "files": 497, "sizeBytes": 5266786 }
}
```

Regenerate manually with `npm run build:manifest` (requires an existing
`.output/`).

## 2. Deployment verification (pre-flight, in CI)

`_ci-kernel.yml` and `_deploy-kernel.yml` both refuse to proceed unless:

- `.output/server/index.mjs` exists and is non-trivial
- `.output/build-manifest.json` exists
- `build.nitroPreset === "node-server"`
- `app.js`, `package.json`, `package-lock.json` are in the artifact
- no Cloudflare Workers output is present

## 3. Deploy & restart

Run **Deploy (Production — Node SSR → MilesWeb)** via
`workflow_dispatch`, supplying `public_url` (default `https://higaet.com`).

The kernel rsyncs the release, installs production dependencies on the host,
flips the `current` symlink atomically, then restarts Passenger:

```bash
touch /home/wnwpopno/higaet.com/tmp/restart.txt
```

## 4. Health check

Immediately after the restart the workflow runs
`scripts/wait-for-healthz.mjs`, polling `<public_url>/healthz` every 5 s until
HTTP 200 or a 180 s timeout.

- **200** → deployment continues to smoke tests.
- **timeout** → the `current` symlink is reverted to the previous release,
  Passenger is restarted again, and the workflow **fails**.

Manual equivalent:

```bash
HEALTH_URL=https://higaet.com/healthz npm run verify:health
```

## 5. Deployment logging

Each run writes a job summary containing:

- build duration (ms)
- deployment duration (ms)
- health-check duration (ms)
- server bundle size (bytes)
- full build manifest contents

## Production Server Layout

```
/home/wnwpopno/higaet.com/
├── current -> releases/release-<ts>-<sha>
├── releases/            # last 5 retained (KEEP_RELEASES)
├── tmp/restart.txt      # Passenger restart trigger
└── releases/<id>/
    ├── app.js                    # Passenger entry, imports .output/server/index.mjs
    ├── package.json
    ├── package-lock.json
    ├── .env                      # server-only secrets (never in git)
    ├── node_modules/             # npm ci --omit=dev on host
    ├── scripts/
    └── .output/
        ├── server/index.mjs      # Nitro node-server SSR entry (required)
        ├── build-manifest.json   # provenance for this release
        ├── public/               # static assets, manifest, favicons
        └── nitro.json
```

Do **not** upload `src/`, `.github/`, `tests/`, or `docs/` to MilesWeb.

## Required environment variables (host `.env`)

| Variable                        | Scope  | Purpose                        |
| ------------------------------- | ------ | ------------------------------ |
| `SUPABASE_URL`                  | server | backend endpoint               |
| `SUPABASE_PUBLISHABLE_KEY`      | server | anon-level reads               |
| `SUPABASE_SERVICE_ROLE_KEY`     | server | privileged server operations   |
| `SESSION_SECRET`                | server | reserved for server sessions   |
| `VITE_SUPABASE_URL`             | build  | injected at build time         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | build  | injected at build time         |
| `VITE_SUPABASE_PROJECT_ID`      | build  | MCP OAuth issuer derivation    |
| `PORT`                          | server | supplied by Passenger          |

## Success criteria

A deployment is successful only when **all** of these hold:

1. `.output/server/index.mjs` exists in the release
2. `.output/build-manifest.json` generated with preset `node-server`
3. Passenger starts the release
4. `/healthz` returns HTTP 200 within the timeout
5. Smoke tests pass
6. No manual intervention was required

## Recovery: production folder cleaned / SSR entry missing

1. Do **not** re-upload `src/` or run `vite build` on the host.
2. Re-run **Deploy (Production)** in GitHub Actions — CI rebuilds and rsyncs a
   fresh `.output/`.
3. On host after deploy: `test -f .output/server/index.mjs && touch tmp/restart.txt`.

## Manual rollback

```bash
ssh <user>@<host>
cd /home/wnwpopno/higaet.com
ln -sfn "$(cat .previous-release)" current
touch tmp/restart.txt
```

## Config Reference

- Build script: `package.json` → `build:node` = `env -u LOVABLE_SANDBOX -u DEV_SERVER__PROJECT_PATH BUILD_TARGET=node vite build`
- Nitro preset: `vite.config.ts` → `nitro.preset: "node-server"` with `.output` dirs
- Entry shim: `app.js` → dynamic import of `./.output/server/index.mjs`
- Runtime: Node.js 22.x LTS on Passenger (MilesWeb cPanel)
