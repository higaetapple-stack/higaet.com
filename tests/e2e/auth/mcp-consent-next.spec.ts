import { test, expect, TEST_USERS, PASSWORD } from "../fixtures";

/**
 * End-to-end: unauthenticated visit to the MCP OAuth consent route must
 * bounce to /auth with `next` preserved, and after password sign-in the
 * user must return to the original consent URL — never to `/` or a
 * generic dashboard.
 *
 * This guards the two failure modes flagged in the audit:
 *   1. `/auth` losing the `next` param (returns to `/`).
 *   2. Social/password flows hard-coding a `/dashboard` return target
 *      that ignores `next`.
 *
 * We don't complete the OAuth exchange — Supabase provides no fake
 * authorization_id — but we DO exercise the full round-trip up to the
 * moment the consent route calls `getAuthorizationDetails`, which is the
 * boundary the audit called out.
 */

const AUTH_ID = "e2e-fake-authorization-id";
const CONSENT_URL = `/.lovable/oauth/consent?authorization_id=${AUTH_ID}`;

test.skip(!PASSWORD, "TEST_FIXTURE_PASSWORD not set — skipping OAuth e2e");

test("MCP consent → sign in → returns to consent URL with authorization_id", async ({
  page,
}) => {
  // 1. Unauthenticated hit on consent must bounce to /auth carrying `next`.
  await page.goto(CONSENT_URL);
  await page.waitForURL(/\/auth(\/|\?|$)/);

  const url = new URL(page.url());
  const next = url.searchParams.get("next");
  expect(next, "auth route must receive ?next=<original consent URL>").toBeTruthy();
  expect(next!).toContain("/.lovable/oauth/consent");
  expect(next!).toContain(`authorization_id=${AUTH_ID}`);

  // 2. If /auth is a layout that renders login by default, navigate to
  //    the explicit login screen preserving `next`.
  if (!url.pathname.endsWith("/login")) {
    await page.goto(`/auth/login?next=${encodeURIComponent(next!)}`);
  }

  // 3. Sign in with password. Preserving `next` must beat role-based redirects.
  await page.getByLabel(/email/i).fill(TEST_USERS.student.email);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // 4. Verify we land back on the ORIGINAL consent URL. The consent route
  //    itself will error out (fake authorization_id) — that is expected;
  //    what we assert is that we returned there instead of `/` or
  //    `/dashboard`.
  await page.waitForURL(/\/\.lovable\/oauth\/consent/);
  expect(page.url()).toContain(`authorization_id=${AUTH_ID}`);
});

test("unauthenticated consent visit never leaks to home page", async ({ page }) => {
  await page.goto(CONSENT_URL);
  await page.waitForURL(/\/auth(\/|\?|$)/);
  expect(new URL(page.url()).pathname).not.toBe("/");
});
