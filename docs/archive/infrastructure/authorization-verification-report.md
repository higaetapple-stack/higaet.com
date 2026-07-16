# Authorization Verification Report

Validates the Phase 2.2 authorization gate behavior using fixtures, without
requiring a live staging environment. Driven by
`.github/workflows/authorization-verification.yml`, which runs the
readiness checker with `READINESS_FIXTURE_STATUS` overriding live probes.

> Scope note: fixture verification proves **gate logic**, not the readiness
> of an actual staging environment. A real PASS requires live infrastructure.

## Test 1 — NO-GO fixture

| Field | Value |
| --- | --- |
| Input | `READINESS_FIXTURE_STATUS=NO-GO` |
| Expected exit code | non-zero (1) |
| Expected output `status` | `NO-GO` |
| Expected gate behavior | blocked; failure message includes artifact + run links |
| Actual exit code | _populated by CI run — see workflow artifact_ |
| Actual `status` | _populated by CI run_ |
| Result | _PASS / FAIL (set by `Assert exit code matches fixture` step)_ |

## Test 2 — GO fixture

| Field | Value |
| --- | --- |
| Input | `READINESS_FIXTURE_STATUS=GO` |
| Expected exit code | 0 |
| Expected output `status` | `GO` |
| Expected gate behavior | permitted; deployment workflow may proceed |
| Actual exit code | _populated by CI run_ |
| Actual `status` | _populated by CI run_ |
| Result | _PASS / FAIL_ |

## Evidence

Each matrix leg uploads a `auth-verification-<fixture>-<run-id>` artifact
containing the generated prerequisite report and raw evidence directory.
Inspect via the workflow run's Artifacts panel.

## Sign-off criteria

The gate is considered verified when **both** matrix legs report PASS in
the latest run of `authorization-verification.yml` on the main branch.
