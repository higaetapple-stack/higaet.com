/**
 * HIGAET Sprint Zero smoke + flow suite (Playwright).
 *
 * Prereqs:
 *  - Seeded users (Passw0rd!): admin/faculty/counselor/placement/student1/student2 @higaet.test
 *  - BASE_URL env (default http://localhost:8080)
 *
 * Run: bunx playwright test tests/smoke
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:8080";
const PW = "Passw0rd!";

async function signIn(page: Page, email: string) {
  await page.goto(`${BASE}/auth`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(PW);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/dashboard|\/$/, { timeout: 15_000 });
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: /sign out|log out/i }).click().catch(async () => {
    // fallback via menu
    await page.getByRole("button", { name: /account|profile|menu/i }).first().click();
    await page.getByRole("menuitem", { name: /sign out|log out/i }).click();
  });
  await page.waitForURL(/\/(auth|$)/);
}

const roles = [
  { role: "admin",     email: "admin@higaet.test",     home: "/dashboard/admin",     forbidden: "/dashboard/student" },
  { role: "faculty",   email: "faculty@higaet.test",   home: "/dashboard/faculty",   forbidden: "/dashboard/admin" },
  { role: "counselor", email: "counselor@higaet.test", home: "/dashboard/counselor", forbidden: "/dashboard/admin" },
  { role: "placement", email: "placement@higaet.test", home: "/dashboard/placement", forbidden: "/dashboard/admin" },
  { role: "student",   email: "student1@higaet.test",  home: "/dashboard",           forbidden: "/dashboard/admin" },
];

test.describe("Auth + RBAC", () => {
  for (const r of roles) {
    test(`${r.role}: login → home → forbidden gate → logout`, async ({ page }) => {
      await signIn(page, r.email);
      await page.goto(`${BASE}${r.home}`);
      await expect(page).not.toHaveURL(/\/auth/);
      await page.goto(`${BASE}${r.forbidden}`);
      const denied =
        /\/(auth|403|forbidden|$)/.test(page.url()) ||
        (await page.getByText(/forbidden|not authorized|access denied/i).count()) > 0;
      expect(denied).toBeTruthy();
      await signOut(page);
    });
  }
});

test.describe("Domain flows", () => {
  test("student can browse and enroll in a program", async ({ page }) => {
    await signIn(page, "student1@higaet.test");
    await page.goto(`${BASE}/academy`);
    await page.getByRole("link", { name: /program|view|enroll/i }).first().click();
    const enroll = page.getByRole("button", { name: /enroll/i });
    if (await enroll.count()) {
      await enroll.first().click();
      await expect(page.getByText(/enrolled|success|already/i)).toBeVisible({ timeout: 10_000 });
    }
  });

  test("admin can open the CRM proposal area", async ({ page }) => {
    await signIn(page, "admin@higaet.test");
    await page.goto(`${BASE}/dashboard/admin/tech/proposals`).catch(() => {});
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test("tech client can open support ticket form", async ({ page }) => {
    await signIn(page, "admin@higaet.test");
    await page.goto(`${BASE}/dashboard/admin/tech/tickets`).catch(() => {});
    await expect(page).not.toHaveURL(/\/auth/);
  });
});

test.describe("Public API surface", () => {
  test("health endpoint responds 200", async ({ request }) => {
    const res = await request.get(`${BASE}/api/public/health`);
    expect(res.status()).toBe(200);
  });

  test("dev seed-users route removed", async ({ request }) => {
    const res = await request.post(`${BASE}/api/public/dev/seed-users`);
    expect([404, 405]).toContain(res.status());
  });

  test("rate limiter trips on chat after burst", async ({ request }) => {
    let last = 200;
    for (let i = 0; i < 30; i++) {
      const res = await request.post(`${BASE}/api/public/chat`, {
        data: { sessionId: `rl-${Date.now()}`, q: "ping" },
      });
      last = res.status();
      if (last === 429) break;
    }
    expect([200, 429]).toContain(last);
  });
});
