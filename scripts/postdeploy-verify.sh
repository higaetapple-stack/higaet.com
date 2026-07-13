#!/usr/bin/env bash
# Post-deploy verification for MilesWeb Passenger.
#
# SSH-checks the current release on MilesWeb, confirms .output/server/index.mjs
# and node_modules are present, runs `npm ci --omit=dev`, restarts Passenger,
# then validates that /healthz and /readyz return 200 against the public URL.
#
# Usage:
#   SSH_HOST=... SSH_USER=... SSH_PORT=22 DEPLOY_DIR=/home/USER/apps/higaet \
#     PUBLIC_URL=https://higaet.com \
#     scripts/postdeploy-verify.sh
#
# Optional:
#   SSH_KEY=/path/to/id_rsa    # explicit SSH key
#   TIMEOUT_SECONDS=120        # health poll timeout (default 120)
#
# Exit codes:
#   0 = all checks passed
#   1 = configuration error (missing env vars, ssh unreachable)
#   2 = release layout invalid (artifact or node_modules missing)
#   3 = npm ci failed
#   4 = Passenger restart failed
#   5 = health checks failed after timeout
set -euo pipefail

need() {
  local v="$1"
  if [ -z "${!v:-}" ]; then
    echo "::error::Missing required env: $v" >&2
    exit 1
  fi
}

need SSH_HOST
need SSH_USER
need SSH_PORT
need DEPLOY_DIR
need PUBLIC_URL

TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-120}"
SSH_OPTS=(-p "$SSH_PORT" -o StrictHostKeyChecking=accept-new -o BatchMode=yes)
if [ -n "${SSH_KEY:-}" ]; then
  SSH_OPTS+=(-i "$SSH_KEY")
fi

echo "==> [1/6] Verifying SSH connectivity to $SSH_USER@$SSH_HOST:$SSH_PORT"
ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "echo ok" >/dev/null || {
  echo "::error::SSH connection failed" >&2
  exit 1
}

echo "==> [2/6] Inspecting release at $DEPLOY_DIR/current"
LAYOUT=$(ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" bash -s <<REMOTE
set -e
cd '$DEPLOY_DIR/current' 2>/dev/null || { echo "MISSING_CURRENT"; exit 0; }
echo "PATH=\$(pwd -P)"
[ -f .output/server/index.mjs ] && echo "ARTIFACT=ok" || echo "ARTIFACT=missing"
[ -f package.json ]              && echo "PACKAGE_JSON=ok" || echo "PACKAGE_JSON=missing"
[ -f package-lock.json ]         && echo "LOCKFILE=ok" || echo "LOCKFILE=missing"
[ -d node_modules ]              && echo "NODE_MODULES=ok" || echo "NODE_MODULES=missing"
[ -f app.js ]                    && echo "APP_JS=ok" || echo "APP_JS=missing"
REMOTE
)
echo "$LAYOUT"
if echo "$LAYOUT" | grep -q "MISSING_CURRENT"; then
  echo "::error::$DEPLOY_DIR/current does not exist on the host" >&2
  exit 2
fi
if echo "$LAYOUT" | grep -qE "ARTIFACT=missing|APP_JS=missing|PACKAGE_JSON=missing|LOCKFILE=missing"; then
  echo "::error::Release layout invalid — required files missing" >&2
  exit 2
fi

echo "==> [3/6] Running npm ci --omit=dev on remote"
ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" bash -s <<REMOTE || { echo "::error::npm ci failed" >&2; exit 3; }
set -euo pipefail
cd '$DEPLOY_DIR/current'
echo "[remote] node: \$(node -v 2>/dev/null || echo missing)"
echo "[remote] npm:  \$(npm -v 2>/dev/null || echo missing)"
npm ci --omit=dev --prefer-offline --no-audit --no-fund
REMOTE

echo "==> [4/6] Restarting Passenger"
ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "mkdir -p '$DEPLOY_DIR/tmp' && touch '$DEPLOY_DIR/tmp/restart.txt'" || {
  echo "::error::Failed to touch restart.txt" >&2
  exit 4
}

poll_endpoint() {
  local path="$1"
  local deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))
  local last_code="000"
  while [ "$(date +%s)" -lt "$deadline" ]; do
    last_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$PUBLIC_URL$path" || echo "000")
    if [ "$last_code" = "200" ]; then
      echo "  [$path] 200 OK"
      return 0
    fi
    sleep 3
  done
  echo "::error::$path did not return 200 within ${TIMEOUT_SECONDS}s (last=$last_code)" >&2
  return 1
}

echo "==> [5/6] Polling $PUBLIC_URL/healthz"
poll_endpoint "/healthz" || exit 5

echo "==> [6/6] Polling $PUBLIC_URL/readyz"
poll_endpoint "/readyz" || {
  echo "::error::/readyz failed — fetching diagnostic body:" >&2
  curl -s --max-time 10 "$PUBLIC_URL/readyz" | head -c 4000 >&2 || true
  echo >&2
  exit 5
}

echo "✅ Post-deploy verification passed"
