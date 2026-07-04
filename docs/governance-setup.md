# Governance & Knowledge Exchange — Setup

Two runtime secrets gate the governance audit + cross-org knowledge stack.
Both live as backend environment variables (never expose to the browser).

## 1. `GOVERNANCE_CI_API_KEY`

Bearer for the CI-gate endpoints:

- `GET /api/public/governance/decisions`
- `GET /api/public/governance/knowledge`

Callers send `x-governance-api-key: <value>`. Missing / mismatched headers
return `401 Unauthorized`. Comparison is constant-time.

Generate a strong random value (32+ chars) and store it via the
**Add secret** flow (name it `GOVERNANCE_CI_API_KEY`). Rotate by updating
the same secret; CI systems pick it up on next invocation.

## 2. `KNOWLEDGE_TRUSTED_KEYS`

Registry of trusted signing keys for imported knowledge packages.
Format: comma-separated `keyId:secret` pairs, e.g.

```
partner-a:aVeryLongSharedSecret,partner-b:AnotherSharedSecret
```

Add each partner secret out-of-band, then set them all together in
`KNOWLEDGE_TRUSTED_KEYS`. Optionally set `KNOWLEDGE_SIGNING_SECRET` for
the reserved `local` keyId used to sign packages this project emits.

Packages carry `signature = "<keyId>:<hex-hmac-sha256>"`. Verification
enforces, in order:

1. `signature` present and well-formed
2. `keyId` exists in the trusted registry (`untrusted_key` otherwise)
3. `hash` matches SHA-256 of canonical payload (`hash_mismatch` otherwise)
4. HMAC matches with the registered secret (`signature_mismatch` otherwise)
5. `expiresAt` in the future (`expired` otherwise)

## 3. Verify signature enforcement

The suite `src/lib/knowledge/__tests__/signing.test.ts` runs six failing
cases that MUST all be rejected by `verifyKnowledgePackage`:

- untrusted key id
- payload mutation after signing
- signature copied under a different trusted key id
- expired `expiresAt`
- missing signature
- (plus the happy-path pass)

Run:

```bash
bun run vitest run src/lib/knowledge/__tests__/signing.test.ts
```

If any of the six rejection cases returns `{ valid: true }`, do **not**
ship — the signing layer has regressed and imported packages could be
forged.

## 4. Pagination & CSV export

Both CI-gate endpoints support:

- `?limit=<1-500>` and `?cursor=<ISO created_at>` for cursor pagination.
  The first page (no cursor) also returns `total` (exact row count);
  subsequent pages return `total: null` to avoid full re-counts.
- `?format=csv` for CSV download. Filters (`tenant`, `decision`, `status`,
  `trust`) apply. The knowledge endpoint accepts `csvKind=packages|events`.

CSV escaping follows RFC 4180 (quoted cells for commas / quotes / newlines).
