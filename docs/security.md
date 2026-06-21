# Phase 1A — Identity & Security Foundation

## What ships

- **Apple Sign-In** via Lovable-managed OAuth (`lovable.auth.signInWithOAuth('apple')`).
- **Google Sign-In** (already present, kept).
- **Microsoft Entra ID via SAML**: data model scaffolded (`identity_providers`, `sso_domains`); admin UI at `/dashboard/admin/identity-providers`. To activate, paste federation metadata URL + email domains, then enable.
- **TOTP MFA** (Supabase Auth `auth.mfa`): enroll, QR, verify, disable.
- **Recovery codes** (10 codes, SHA-256 hashed, single-use) stored in `user_mfa_recovery_codes`.
- **Other-session revoke** (`signOut({ scope: 'others' })`).
- **`security_events` audit feed** rendered at `/dashboard/security`.
- **HIBP leaked-password protection** enabled at the auth provider.

## Event types emitted

`mfa.enrolled · mfa.disabled · mfa.challenged · session.revoked · password.changed · password.reset · sso.linked · sso.unlinked · login.failed · login.suspicious · role.changed · recovery_code.used · recovery_codes.regenerated`

All flow through Phase 3A `dispatchNotification` with category `security`.

## Activating Entra ID later

1. Admin opens `/dashboard/admin/identity-providers`.
2. Edits the seeded `entra-higaet` row, pastes federation metadata URL, adds email domains, enables it.
3. Lovable Cloud SAML SSO is then configured via the platform tool (`supabase--configure_saml_sso`) using the same metadata URL.

## AAL2 enforcement (next step)

Hook to add later in `requireSupabaseAuth`:
```ts
if (data.claims.aal !== 'aal2' && needsAal2) throw new Error('AAL2 required');
```
Apply to admin server fns when the org mandates step-up.
