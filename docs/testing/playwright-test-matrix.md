# Playwright E2E Test Matrix

Generated from `tests/e2e/auth/*.spec.ts`. The launch-readiness report
(`docs/testing/launch-readiness-report.md`) is produced from actual run
results; this document is the static intent.

## Scenarios × roles

| Scenario | Guest | Student | Counselor | Faculty | Admin |
|---|---|---|---|---|---|
| Registration form validation | ✓ | — | — | — | — |
| Login → role dashboard | — | ✓ | ✓ | ✓ | ✓ |
| Logout + back-button | — | — | — | — | ✓ |
| Forgot password flow | ✓ | — | — | — | — |
| Session expiry → redirect | — | ✓ | — | — | — |
| Generic `/dashboard` forward | — | ✓ | ✓ | ✓ | ✓ |
| Protected route → `/auth/login` | ✓ | — | — | — | — |
| Wrong-role → `/403` | — | ✓ | — | — | — |
| 403 page shows roles | — | ✓ | — | — | — |
| Deep-link preservation | — | — | — | — | ✓ |
| Mobile nav guest CTA | ✓ | — | — | — | — |

Total: 14 test cases. Target: 100% pass before launch.

## Run

```bash
# local — dev server on :8080 must be up
TEST_FIXTURE_PASSWORD=… bunx playwright test
node scripts/generate-readiness-report.mjs
```

## Coverage rationale

- **All four seeded roles** exercise the login → dashboard map.
- **One guest path** per protection class (auth-required, role-required).
- **One cross-role denial** is sufficient because `requireRolesOrRedirect`
  treats every disallowed role identically — see audit report for branches.
