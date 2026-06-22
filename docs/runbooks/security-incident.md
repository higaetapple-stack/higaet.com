# Security Incident

## Classify
| Type | Severity | Examples |
| --- | --- | --- |
| Credential leak | SEV1 | Service-role key in public repo, JWT in logs |
| Account takeover | SEV1 | Confirmed unauthorized access to admin account |
| Data exposure | SEV1 | RLS bypass, public bucket with PII |
| Suspicious activity | SEV2 | Spike in failed logins, abnormal API usage |
| Reported vulnerability | SEV2 | Researcher report, dependency CVE |

## Immediate actions (first 30 min)
1. Declare incident; follow `incident-response.md`.
2. Containment:
   - Revoke compromised API keys: `UPDATE api_keys SET status='revoked' WHERE id=...`
   - Rotate any leaked secret via `update_secret` tool; for `LOVABLE_API_KEY` use `ai_gateway--rotate_lovable_api_key`.
   - For account takeover: force-signout user (`auth.admin.signOut`), reset password, revoke MFA factors.
3. Preserve evidence: snapshot `security_events`, `audit_logs`, `api_key_usage`, `domain_events` for the window.

## Investigation
- Query `security_events` for the actor: failed MFA, IP changes, scope grants.
- Cross-reference `api_key_usage.ip` for unusual geographies.
- Check `audit_logs` for privileged writes (role grants, certificate issuance).

## Notification
- Internal: security channel + legal within 1 h for SEV1.
- External: if PII confirmed exposed, follow regional breach-notification laws (72 h GDPR).
- Customers: status page update; direct email for materially affected users.

## Post-incident
- Run `security--run_security_scan`.
- Update RLS / policies; add regression query to `tests/smoke/rbac.smoke.spec.ts`.
- Record fix in `docs/audit/critical-fixes.md` and `mem://security/`.
