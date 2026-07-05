# Phase 2.2 — Prerequisite Report

- **Generated:** 2026-07-05T08:40:30.031Z
- **Workflow / Run:** 28735072871
- **Overall status:** STAGING BLOCKED
- **Evidence artifacts:** `/home/runner/work/higaet/higaet/test-results/readiness/2026-07-05T08-40-30-031Z`

## Evidence Matrix

| Category | Check | Status | Evidence |
| --- | --- | --- | --- |
| DNS | staging.higaet.com via 1.1.1.1 | **PASS** | Resolved: 103.102.234.161 — see /home/runner/work/higaet/higaet/test-results/readiness/2026-07-05T08-40-30-031Z/dns-1.1.1.1.txt |
| DNS | staging.higaet.com via 8.8.8.8 | **PASS** | Resolved: 103.102.234.161 — see /home/runner/work/higaet/higaet/test-results/readiness/2026-07-05T08-40-30-031Z/dns-8.8.8.8.txt |
| DNS | Matches STAGING_EXPECTED_IP (103.102.234.161) | **PASS** | Resolved IPs: 103.102.234.161, 103.102.234.161 |
| SSL | Cert for staging.higaet.com valid ≥30d & CN matches | **PASS** | notAfter=Jun 24 03:42:13 2027 GMT, daysLeft=353, CN match=true — see /home/runner/work/higaet/higaet/test-results/readiness/2026-07-05T08-40-30-031Z/ssl.txt |
| SSH | Auth to wnwpopno@103.102.234.161:22999 | **FAIL** | Error: Warning: Permanently added '[103.102.234.161]:22999' (ED25519) to the list of known hosts.
wnwpopno@103.102.234.161: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).
 |
| GitHub | staging environment exists | **FAIL** | GET /environments/staging → 401 |
| GitHub | Secret STAGING_HOST | **FAIL** | staging environment missing |
| GitHub | Secret STAGING_BASE_URL | **FAIL** | staging environment missing |
| GitHub | Secret SSH_HOST | **FAIL** | staging environment missing |
| GitHub | Secret SSH_PORT | **FAIL** | staging environment missing |
| GitHub | Secret SSH_USER | **FAIL** | staging environment missing |
| GitHub | Secret SSH_KEY | **FAIL** | staging environment missing |

## Result

**STAGING BLOCKED.** 8 of 12 required checks failed:

- SSH / Auth to wnwpopno@103.102.234.161:22999 — Error: Warning: Permanently added '[103.102.234.161]:22999' (ED25519) to the list of known hosts.
wnwpopno@103.102.234.161: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).

- GitHub / staging environment exists — GET /environments/staging → 401
- GitHub / Secret STAGING_HOST — staging environment missing
- GitHub / Secret STAGING_BASE_URL — staging environment missing
- GitHub / Secret SSH_HOST — staging environment missing
- GitHub / Secret SSH_PORT — staging environment missing
- GitHub / Secret SSH_USER — staging environment missing
- GitHub / Secret SSH_KEY — staging environment missing

See `infrastructure-activation-checklist.md` for remediation.
