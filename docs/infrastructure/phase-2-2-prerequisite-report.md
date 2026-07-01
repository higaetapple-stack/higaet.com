# Phase 2.2 — Prerequisite Report

- **Generated:** 2026-07-01T09:29:28.751Z
- **Workflow / Run:** 28507681886
- **Overall status:** STAGING BLOCKED
- **Evidence artifacts:** `/home/runner/work/higaet-core-engine/higaet-core-engine/test-results/readiness/2026-07-01T09-29-28-751Z`

## Evidence Matrix

| Category | Check | Status | Evidence |
| --- | --- | --- | --- |
| DNS | staging.higaet.com via 1.1.1.1 | **PASS** | Resolved: 103.102.234.161 — see /home/runner/work/higaet-core-engine/higaet-core-engine/test-results/readiness/2026-07-01T09-29-28-751Z/dns-1.1.1.1.txt |
| DNS | staging.higaet.com via 8.8.8.8 | **PASS** | Resolved: 103.102.234.161 — see /home/runner/work/higaet-core-engine/higaet-core-engine/test-results/readiness/2026-07-01T09-29-28-751Z/dns-8.8.8.8.txt |
| DNS | Matches STAGING_EXPECTED_IP (103.102.234.161) | **PASS** | Resolved IPs: 103.102.234.161, 103.102.234.161 |
| SSL | Cert for staging.higaet.com valid ≥30d & CN matches | **PASS** | notAfter=Jun 24 03:42:13 2027 GMT, daysLeft=357, CN match=true — see /home/runner/work/higaet-core-engine/higaet-core-engine/test-results/readiness/2026-07-01T09-29-28-751Z/ssl.txt |
| SSH | Auth to wnwpopno@103.102.234.161 | **FAIL** | Error: ssh: connect to host 103.102.234.161 port 22: Connection refused
 |
| GitHub | API access | **FAIL** | GITHUB_REPO and GITHUB_TOKEN not set — cannot verify environment/secrets remotely |
| GitHub | Secret STAGING_HOST | **FAIL** | GitHub API not reachable |
| GitHub | Secret STAGING_BASE_URL | **FAIL** | GitHub API not reachable |
| GitHub | Secret SSH_HOST | **FAIL** | GitHub API not reachable |
| GitHub | Secret SSH_USER | **FAIL** | GitHub API not reachable |
| GitHub | Secret SSH_KEY | **FAIL** | GitHub API not reachable |

## Result

**STAGING BLOCKED.** 7 of 11 required checks failed:

- SSH / Auth to wnwpopno@103.102.234.161 — Error: ssh: connect to host 103.102.234.161 port 22: Connection refused

- GitHub / API access — GITHUB_REPO and GITHUB_TOKEN not set — cannot verify environment/secrets remotely
- GitHub / Secret STAGING_HOST — GitHub API not reachable
- GitHub / Secret STAGING_BASE_URL — GitHub API not reachable
- GitHub / Secret SSH_HOST — GitHub API not reachable
- GitHub / Secret SSH_USER — GitHub API not reachable
- GitHub / Secret SSH_KEY — GitHub API not reachable

See `infrastructure-activation-checklist.md` for remediation.
