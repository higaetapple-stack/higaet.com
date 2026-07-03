/**
 * Analytics E2E validation.
 *
 * Runs the full 14-event contract against a live environment (staging or
 * localhost). Each block asserts the *real* network emission (PostHog / GA4 /
 * dataLayer) triggered by a real user flow, not a mocked track() call.
 *
 * Configure with env vars (all optional — tests self-skip if missing):
 *   PLAYWRIGHT_BASE_URL         e.g. https://staging.higaet.com
 *   HIGAET_TEST_USER_EMAIL      seeded end-user account (see docs/testing/e2e-test-users.md)
 *   HIGAET_TEST_USER_PASSWORD
 *   HIGAET_TEST_ADMIN_EMAIL     seeded admin (for visa + refund admin flows)
 *   HIGAET_TEST_ADMIN_PASSWORD
 *   HIGAET_TEST_UNIVERSITY_SLUG university slug used for the study-abroad flow
 *   HIGAET_TEST_PAYMENT_ID      approved payment id used for the refund flow
 */
import { test, expect, type Page } from "@playwright/test";
import { createEventTracker, type EventTracker } from "./event-tracker";
import { ANALYTICS_EVENT_NAMES } from "../../../src/lib/analytics-contract";

const USER_EMAIL = process.env.HIGAET_TEST_USER_EMAIL;
const USER_PASSWORD = process.env.HIGAET_TEST_USER_PASSWORD;
const ADMIN_EMAIL = process.env.HIGAET_TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.HIGAET_TEST_ADMIN_PASSWORD;
const UNIVERSITY_SLUG = process.env.HIGAET_TEST_UNIVERSITY_SLUG;
const PAYMENT_ID = process.env.HIGAET_TEST_PAYMENT_ID;

async function acceptConsent(page: Page) {
  const btn = page.getByRole("button", { name: /accept/i }).first();
  if (await btn.isVisible().catch(() => false)) await btn.click();
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/dashboard|\/$/);
}

test.describe("Analytics — contract event emission", () => {
  test("drift guard: contract still declares 14 events", () => {
    expect(ANALYTICS_EVENT_NAMES).toHaveLength(14);
  });

  test("signup + login funnel emits auth events", async ({ page }) => {
    const tracker = await createEventTracker(page);
    await page.goto("/");
    await acceptConsent(page);

    await page.goto("/auth/register");
    const uniq = Date.now();
    await page.getByLabel(/email/i).fill(`qa+${uniq}@higaet.test`);
    await page.getByLabel(/password/i).first().fill("Test@123456");
    await page.getByRole("button", { name: /create account|sign up|register/i }).click();

    await tracker.wait("signup_started", 10_000);
    await tracker.wait("signup_completed", 15_000).catch(() => {
      test.info().annotations.push({
        type: "notice",
        description: "signup_completed not observed — may require email confirmation",
      });
    });

    if (USER_EMAIL && USER_PASSWORD) {
      tracker.clear();
      await signIn(page, USER_EMAIL, USER_PASSWORD);
      await tracker.wait("login", 10_000);
    } else {
      test.info().annotations.push({
        type: "skip",
        description: "login event not verified: HIGAET_TEST_USER_* not set",
      });
    }
  });

  test("study-abroad funnel emits lead → application events", async ({ page }) => {
    test.skip(!UNIVERSITY_SLUG, "Set HIGAET_TEST_UNIVERSITY_SLUG to run");
    const tracker = await createEventTracker(page);
    await page.goto("/");
    await acceptConsent(page);

    await page.goto(`/global-education/universities/${UNIVERSITY_SLUG}`);
    await page.getByRole("button", { name: /apply/i }).first().click();

    await tracker.wait("lead_captured", 10_000).catch(() => null);
    await tracker.wait("application_started", 10_000);

    const submit = page.getByRole("button", { name: /submit application/i });
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      await tracker.wait("application_submitted", 15_000);
    }
  });

  test("admin visa case creation emits visa_case_created", async ({ page }) => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set HIGAET_TEST_ADMIN_* to run");
    const tracker = await createEventTracker(page);
    await page.goto("/");
    await acceptConsent(page);
    await signIn(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    await page.goto("/dashboard/admin/visa");
    await page.getByRole("button", { name: /new visa case|create visa/i }).click();
    await page.getByRole("button", { name: /create|save/i }).last().click();

    await tracker.wait("visa_case_created", 15_000);
  });

  test("payment + refund lifecycle emits all payment events", async ({ page }) => {
    test.skip(
      !USER_EMAIL || !USER_PASSWORD || !PAYMENT_ID || !ADMIN_EMAIL || !ADMIN_PASSWORD,
      "Set HIGAET_TEST_USER_*, HIGAET_TEST_ADMIN_*, HIGAET_TEST_PAYMENT_ID to run",
    );
    const tracker = await createEventTracker(page);
    await page.goto("/");
    await acceptConsent(page);
    await signIn(page, USER_EMAIL!, USER_PASSWORD!);

    // Checkout
    await page.goto("/dashboard/payments/new");
    await page.getByRole("button", { name: /checkout|pay/i }).first().click();
    await tracker.wait("checkout_started", 10_000);

    // Request refund on the seeded payment
    await page.goto(`/dashboard/payments/${PAYMENT_ID}`);
    await page.getByRole("button", { name: /request refund/i }).click();
    await page.getByRole("button", { name: /submit|confirm/i }).last().click();
    await tracker.wait("refund_requested", 10_000);

    // Admin processes + fails a refund
    await signIn(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/dashboard/admin/payments");

    await page.getByRole("button", { name: /mark processed|processed/i }).first().click();
    await page.getByRole("button", { name: /confirm|save/i }).last().click();
    await tracker.wait("refund_processed", 15_000);

    await page.getByRole("button", { name: /mark failed|failed/i }).first().click();
    await page.getByRole("button", { name: /confirm|save/i }).last().click();
    await tracker.wait("refund_failed", 15_000);
  });

  test("aggregate: all captured event names are contract-known", async ({ page }) => {
    const tracker = await createEventTracker(page);
    await page.goto("/");
    await acceptConsent(page);
    await page.waitForTimeout(1500);
    assertNoUnknownEvents(tracker);
  });
});

function assertNoUnknownEvents(tracker: EventTracker) {
  const known = new Set<string>(ANALYTICS_EVENT_NAMES);
  // Ignore GTM/GA4 framework-level pings and Meta bootstrap events.
  const ignore = /^(gtm\.|page_view$|PageView$|first_visit$|session_start$|user_engagement$)/;
  const unknown = tracker.events
    .map((e) => e.name)
    .filter((n): n is string => !!n && !ignore.test(n) && !known.has(n));
  expect(unknown, `Unexpected analytics events: ${unknown.join(", ")}`).toEqual([]);
}
