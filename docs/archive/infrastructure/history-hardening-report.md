# History Update Hardening

## Risk

Concurrent runs of `staging-readiness.yml` (scheduled cron + manual dispatch,
or matrix jobs) could race when pushing updates to
`docs/infrastructure/staging-readiness-history.md`, causing lost updates or
push rejections under branch protection.

## Mitigations applied

### 1. Concurrency group (existing)

```yaml
concurrency:
  group: staging-readiness
  cancel-in-progress: true
```

Serializes readiness runs at the workflow level — only one run mutates
history at a time per branch.

### 2. Retry with rebase-and-push (new)

The commit step now performs up to **5 push attempts**, rebasing onto the
latest remote between attempts:

```bash
for attempt in 1..5; do
  git push && exit 0
  git pull --rebase --autostash || true
  sleep $((RANDOM % 5 + 1))
done
```

This survives transient races (cross-branch bot commits, parallel housekeeping
PRs) without losing the new history row.

### 3. Append-only history format

Newest row is prepended in `updateHistory()`, so a rebase merge replays
cleanly without conflicting on prior rows.

## Why not PR-based?

A PR-per-update flow was considered but rejected for the readiness loop
because:

- Daily cron would generate one PR per day with auto-merge — review noise.
- PR creation/merge latency delays the FAIL→PASS transition notification.
- Branch protection bypass for the bot is already required for the existing
  prerequisite report commit.

The retry-rebase approach preserves history integrity, supports branch
protection, and adds no review burden. If the repo later requires
PR-only updates to `docs/`, switch the commit step to `peter-evans/create-pull-request`
with `--auto-merge` and the rest of the pipeline is unaffected.
