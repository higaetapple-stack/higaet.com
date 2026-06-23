# Phase 2.2 — Rollback Report

**Status:** ⛔ NOT EXECUTED — blocked by `phase-2-2-prerequisite-report.md`.

The rollback pipeline (`.github/workflows/staging-rollback-validation.yml`) is statically validated (`phase-2-1-deployment-dry-run.md`). A live rehearsal is required before Phase 2.3.

## Rehearsal Plan

1. Deploy a known-good build (record SHA as `BASELINE`).
2. Deploy a deliberately failing build (e.g. a smoke-spec that asserts false on staging — flipped behind a debug flag).
3. Confirm:
   - Smoke step fails.
   - "Rollback on failure" step runs.
   - `current` symlink restored to `BASELINE`.
   - "Verify rollback health" passes.
4. Run full smoke suite manually against staging after auto-rollback; expect exit 0.

## Recording Contract

| Metric | Source |
| --- | --- |
| Rollback duration | `Rollback on failure` step duration |
| Recovery duration | Time from rollback start → `Verify rollback health` 200 |
| Symlink target before/after | `readlink current` captured pre and post |
| Smoke result post-rollback | `test-results/smoke/summary.json` |

## Pass Criteria

- Previous artifact restored within 60 s.
- Health probe green within 60 s of restart.
- Post-rollback smoke suite exits 0.

## Result

Pending deployment. Rehearsal will be executed in the first authorized Phase 2.2 run.
