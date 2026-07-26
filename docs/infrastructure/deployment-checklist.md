# HIGAET Production Deployment Checklist

Canonical flow. **Never build on MilesWeb.**

## Pipeline

| Stage       | Where            | What                                                                 |
| ----------- | ---------------- | -------------------------------------------------------------------- |
| Source      | GitHub (`src/`)  | TanStack Start routes, server entry, config                          |
| Build       | GitHub Actions   | `npm run build:node` → `.output/server/index.mjs` + `.output/public` |
| Artifact    | Actions upload   | `.output/`, `app.js`, `package.json`, `package-lock.json`, `scripts/`|
| Deploy      | `_deploy-kernel` | rsync artifact → `/home/wnwpopno/higaet.com/releases/<id>/`          |
| Install     | MilesWeb SSH     | `npm ci --omit=dev --prefer-offline --no-audit --no-fund`            |
| Activate    | MilesWeb         | `ln -sfn releases/<id> current`                                      |
| Restart     | Passenger        | `touch tmp/restart.txt`                                              |
| Verify      | Smoke tests      | `scripts/run-smoke-tests.ts` against live release                    |

## Production Server Layout

```
/home/wnwpopno/higaet.com/
├── app.js                 # Passenger entry, imports .output/server/index.mjs
├── package.json
├── package-lock.json
├── .env                   # server-only secrets (never in git)
├── node_modules/          # from `npm ci --omit=dev` on host
└── .output/
    ├── server/index.mjs   # Nitro node-server SSR entry (required)
    ├── public/            # static assets, manifest, favicons
    └── nitro.json
```

Do **not** upload `src/`, `.github/`, `tests/`, or `docs/` to MilesWeb.

## Guardrails (already in pipeline)

- `_ci-kernel.yml` fails if `.output/server/index.mjs` is missing after `BUILD_TARGET=node`.
- `_deploy-kernel.yml` re-verifies the file after rsync, before flipping the `current` symlink.
- Smoke tests run against the new release; failure triggers automatic symlink rollback.

## Recovery: production folder cleaned / SSR entry missing

1. Do **not** re-upload `src/` or run `vite build` on the host.
2. Re-run **Unified Deploy** in GitHub Actions (`deploy.yml`) — CI rebuilds and rsyncs a fresh `.output/`.
3. On host after deploy: `test -f .output/server/index.mjs && touch tmp/restart.txt`.

## Config Reference

- Build script: `package.json` → `build:node` = `BUILD_TARGET=node vite build`
- Nitro preset: `vite.config.ts` → `nitro.preset: "node-server"` with `.output` dirs
- Entry shim: `app.js` → dynamic import of `./.output/server/index.mjs`
- Runtime: Node.js 22.22.3 on Passenger (MilesWeb cPanel)
