# Git Sync & Merge Recovery Runbook

Local process guide. None of these commands run in Lovable — execute them on
your workstation. The goal: `main == staging == origin/main == origin/staging`,
no stuck merges, no vim freezes, predictable releases.

## 0. One-time editor hardening (kills the vi freeze forever)

```bash
git config --global core.editor "nano"          # or: "code --wait"
git config --global rebase.autosquash true
```

Always commit with an inline message. Never trigger an interactive editor
commit in a CI-adjacent repo:

```bash
git commit -m "fix: ..."
```

## 1. Branch health check

```bash
git fetch origin --prune
git status
git branch -vv
git log --oneline --decorate --graph --all -10
```

## 2. Full parity check between main and staging

```bash
git rev-list --left-right --count origin/main...origin/staging
```

Expected: `0 0`. Anything else means the branches have diverged — go to §3.

## 3. Safe sync (staging → main)

```bash
git checkout staging && git pull --ff-only origin staging
git checkout main    && git pull --ff-only origin main
git merge --no-edit staging
git push origin main
```

If merge produces conflicts: resolve, `git add -A`, then
`git commit --no-edit`. Do NOT abort unless the conflict is unrecoverable.

## 4. Merge stuck? ("Waiting for your editor to close the file")

DO NOT kill the terminal. In another shell:

```bash
# Safe: throw the merge away
git merge --abort

# Nuclear: only if --abort refuses
rm -f .git/MERGE_HEAD .git/MERGE_MSG
git reset --merge
```

## 5. Tagging a release (only after CI is green)

```bash
git tag -a release-vX.Y.Z -m "release vX.Y.Z"
git push origin release-vX.Y.Z
```

Rule: tags only point at commits where the full CI matrix has passed.

## 6. Emergency reset (destroys local changes)

```bash
git fetch origin
git checkout main    && git reset --hard origin/main
git checkout staging && git reset --hard origin/staging
```

## 7. Post-sync sanity check

```bash
git log --oneline --decorate -5
git diff main..staging     # must be empty
```

## 8. CI trigger safety rule

Before every push, `git status` MUST show `working tree clean`. Never push
partial merges, half-resolved conflicts, or unstaged migration bursts —
they cascade across the 15+ workflows.
