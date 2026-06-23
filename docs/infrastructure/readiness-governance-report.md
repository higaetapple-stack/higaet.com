# Readiness Governance Report

Implementation status of the Readiness Governance Enhancement (A–D).

## A. Workflow Run Summary — **PASS**

`scripts/check-staging-readiness.ts` writes a concise table to
`$GITHUB_STEP_SUMMARY` containing DNS / SSL / SSH / GitHub Environment /
Required Secrets / Deploy Directory / Node Runtime / Passenger Restart with
PASS or FAIL per row, plus the timestamp, run ID, evidence link, and a final
`STATUS: GO` or `STATUS: NO-GO` line. Visible directly in the GitHub Actions
run page; no artifact download required.

## B. Automatic Authorization Gate — **PASS**

`.github/workflows/phase-2-2-authorization.yml` reuses
`staging-readiness.yml` and refuses to authorize unless every required
category is PASS. The deploy workflow (`staging-rollback-validation.yml`)
should be dispatched only after this gate succeeds; the gate's job summary
restates the decision.

Effect: Phase 2.2 cannot be executed on a NO-GO readiness state without
explicitly bypassing the gate workflow, and bypass leaves an audit trail
because the readiness report itself records the FAIL evidence.

## C. Readiness Transition Notification — **PASS**

The checker exports `transitioned=true` on the `NO-GO → GO` edge by reading
the prior result from `staging-readiness-history.md` before prepending the
new row. The readiness workflow's transition step uses
`actions/github-script` to file an issue titled
`STAGING READY — readiness run <id>` with the run URL and artifact pointer.

- Repeat-PASS runs do **not** notify (no transition).
- Repeat-FAIL runs do not notify (no transition).
- Only the first run that flips the state opens the issue.
- Slack webhook hook point is the same step — drop in a `curl` call gated on
  a `SLACK_WEBHOOK` secret when needed; intentionally omitted to avoid
  shipping an unused secret reference.

## D. Readiness History Tracking — **PASS**

`docs/infrastructure/staging-readiness-history.md` is created on first run
and updated on every subsequent run by the checker. Newest entries first;
columns: Timestamp, Run ID, DNS, SSL, SSH, Secrets, Result, Evidence (link
to the GitHub Actions run). The readiness workflow commits the updated
report + history back to the default branch (`[skip ci]`) so the repo is
the canonical audit trail; the same files are also uploaded as a workflow
artifact in case branch protection blocks the push.

## E. Validation Summary

| Enhancement | Status |
| --- | --- |
| Workflow Run Summary | PASS |
| Authorization Gate | PASS |
| Transition Notification | PASS |
| History Tracking | PASS |

## Out of Scope

- No application code changed.
- No production infrastructure touched.
- No deployment authorization implied by the gate's existence — the gate
  prevents accidental deploys; it does not initiate one.
