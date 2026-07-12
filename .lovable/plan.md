# Remediation Plan — HIGAET Audit Follow-ups

The five requests touch production-critical surfaces (CI, package manager, server runtime, RLS, MCP auth). ADR-0004 workstream freeze is active, so I want your go-ahead on scope before editing. Each item below is independent and can be shipped separately — reply with the numbers you want me to execute (e.g. "1, 4, 5" or "all").

## 1. CI: coverage (c8) + accessibility (axe)

Scope
- Add devDeps: `c8`, `@axe-core/playwright`.
- New scripts: `test:coverage` (`c8 --reporter=lcov --reporter=text vitest run --passWithNoTests`), `test:a11y` (Playwright project that runs `axe` against a small route list).
- Add `tests/e2e/a11y/*.spec.ts` running `AxeBuilder` against `/`, `/academy`, `/global-education`, `/technologies`, `/contact` (only WCAG 2.1 A/AA violations fail).
- Extend `.github/workflows/ci.yml` (kernel caller) with two new jobs after the kernel: `coverage` and `a11y`. Both consume the existing `ci-build` artifact — no rebuild (respects Build-Once guard).
- Coverage threshold starts at "report only" (no gate) until baseline is known; a11y fails on any `serious`/`critical` violation.

Risk: Low. New jobs only. No existing behavior changes.

## 2. Consolidate package manager (bun vs npm)

Recommendation: **keep `bun` in CI, keep `package-lock.json` for deployment.**

Evidence: `_ci-kernel.yml` and every kernel-caller uses `bun run …`; `scripts/production-lock-check.mjs` hashes `package-lock.json`; MilesWeb Passenger boot (`app.js`) requires npm-installable output. Dropping `bun.lock` would break CI; dropping `package-lock.json` would break MilesWeb deploy.

Proposed action
- Document the two-lockfile contract explicitly in `docs/DEVELOPMENT.md` (bun for CI speed, npm lock for deploy determinism).
- Add `scripts/check-lockfile-sync.mjs` that fails CI if `package.json` dependency versions drift between `bun.lock` and `package-lock.json`.
- Add a `pr-checks.yml` step invoking it.

Alternative (destructive): fully switch to bun by removing `package-lock.json`, migrating `app.js` install workflow to `bun install --production` on MilesWeb. This requires validating MilesWeb Passenger with bun and re-testing deploy. **Not recommended without a staged rollout.**

Risk: Low for documented approach; Medium if you want the destructive migration — needs a separate deploy dry-run.

## 3. Pin Nitro to a stable release

Reality check
- `nitro@3.0.260603-beta` is the version pinned by `@lovable.dev/vite-tanstack-config@2.7.1`. Nitro 3 has **no stable release** yet on npm — the tag `latest` is still the 2.x line, which is not API-compatible with TanStack Start's v1 Nitro-3 integration.
- Downgrading Nitro to 2.x will break Start's SSR entry and the `.output/server/index.mjs` shape that `app.js` boots.

Proposed action
- Do **not** downgrade Nitro.
- Add a `renovate.json` config (or a scheduled workflow) to auto-open a PR when Nitro publishes a non-beta 3.x tag.
- Add a runtime-lock note in `docs/ARCHITECTURE.md` explaining why the beta pin is intentional and tied to the Lovable preset.

Risk: Very low (documentation + optional Renovate). If you insist on a stable pin today, I need to know first whether you want to move off `@lovable.dev/vite-tanstack-config`, which is a much larger migration.

## 4. Tighten community-roster RLS

Scope (migration, not code):
- Tables: `communities`, `community_members`.
- Current gap (per scanner): rosters visible to all authenticated users regardless of membership.
- New policy shape (security-definer function to avoid recursion):
  - `has_community_role(_user_id, _community_id, _role)` — stable, SECURITY DEFINER, `SET search_path = public`.
  - `is_community_member(_user_id, _community_id)` — same shape.
- `community_members` SELECT policy: user can read a row only if they are themselves a member of that community, OR are an admin (`has_role(auth.uid(),'admin')`), OR are the community owner/moderator.
- `communities` metadata (name, description) stays readable by any authenticated user — only member lists tighten. Confirm this matches your intent before I write the migration.
- Preserve INSERT/UPDATE/DELETE policies; only SELECT is rewritten.
- GRANTs re-issued in the same migration for correctness.

Risk: Medium. Any client code that currently lists non-member rosters will now return empty. I'll grep `src/lib/community.functions.ts`, `src/components/community/*`, and `src/routes/_authenticated.community.*` to enumerate call sites in the same PR and either accept the tighter behavior or add a member-scoped fetcher.

## 5. Protect the MCP endpoints with OAuth

Scope (follows `app-mcp-server-authoring` + `cloud-auth-oauth-server`):
- Call `supabase--configure_oauth_server` to enable the managed OAuth 2.1 server + DCR.
- Add `src/routes/[.]lovable.oauth.consent.tsx` (SSR-off consent route with approve/deny, using existing `supabase` browser client) — includes the `next` preservation guidance so redirects survive password/social sign-in.
- Update `src/lib/mcp/index.ts` to add `auth: auth.oauth.issuer({ issuer: \`https://${projectRef}.supabase.co/auth/v1\`, acceptedAudiences: "authenticated" })`, driven by `import.meta.env.VITE_SUPABASE_PROJECT_ID`.
- Rewrite each tool in `src/lib/mcp/tools/*` to derive user identity from `ToolContext` (`ctx.getUserId()`, `ctx.getToken()`) and use a per-request Supabase client with the forwarded bearer so RLS runs as the user.
- Regenerate `.lovable/mcp/manifest.json` via `app_mcp_server--extract_mcp_manifest`.
- Update the auth/login routes to consume the `next` search param on password + Google sign-in and in `emailRedirectTo` so consent survives sign-in.

Blockers I need confirmed
- Which tools should stay available under OAuth? I'll enumerate `src/lib/mcp/tools/` before the edit and flag any that currently touch admin/service-role data — those must either move to `has_role` gating or be removed from the MCP surface.
- The scanner flagged this as `warn`; are you OK gating even read-only tools behind OAuth, or do you want a mixed public+OAuth server (public tools listed explicitly)?

Risk: Medium-high. New route + tool refactor + provider activation. Requires a manifest re-extract after edits.

## Suggested execution order

1 → 4 → 2 → 5 → 3 (CI first because it's zero-risk and gives us a safety net; then RLS which is one migration; then lockfile doc; then MCP OAuth which is the biggest change; Nitro last because it's a doc-only note).

## Confirm before I proceed

- Which items (1–5) do you want me to execute now?
- For **#2**, keep both lockfiles (documented) or fully migrate to bun?
- For **#4**, confirm "community metadata public to authed users, roster private to members" is the intended policy.
- For **#5**, confirm all existing MCP tools should be OAuth-gated (no mixed public surface).
