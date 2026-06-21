/**
 * HIGAET RBAC smoke tests (Sprint Zero scaffold)
 *
 * Run: bunx playwright test tests/smoke/rbac.smoke.spec.ts
 *
 * Requires seeded test users (admin/faculty/counselor/placement/student@higaet.test, pw: Passw0rd!)
 * Configure BASE_URL via env. Auth pages expected at /auth.
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:8080";
const PW = "Passw0rd!";

async function signIn(page: Page, email: string) {
  await page.goto(`${BASE}/auth`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(PW);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/dashboard|\/$/, { timeout: 10_000 });
}

const cases: Array<{ role: string; email: string; allow: string; deny: string }> = [
  { role: "admin",     email: "admin@higaet.test",     allow: "/dashboard/admin",     deny: "/dashboard/student" },
  { role: "faculty",   email: "faculty@higaet.test",   allow: "/dashboard/faculty",   deny: "/dashboard/admin" },
  { role: "counselor", email: "counselor@higaet.test", allow: "/dashboard/counselor", deny: "/dashboard/admin" },
  { role: "placement", email: "placement@higaet.test", allow: "/dashboard/placement", deny: "/dashboard/admin" },
  { role: "student",   email: "student1@higaet.test",  allow: "/dashboard",           deny: "/dashboard/admin" },
];

test.describe("RBAC smoke", () => {
  for (const c of cases) {
    test(`${c.role} can hit ${c.allow} and is denied ${c.deny}`, async ({ page }) => {
      await signIn(page, c.email);
      await page.goto(`${BASE}${c.allow}`);
      await expect(page).not.toHaveURL(/\/auth/);
      await page.goto(`${BASE}${c.deny}`);
      // Either redirected away or shown a 403/forbidden surface
      const url = page.url();
      const denied = /\/(auth|403|forbidden|$)/.test(url) ||
        (await page.getByText(/forbidden|not authorized|access denied/i).count()) > 0;
      expect(denied).toBeTruthy();
    });
  }

  test("public health endpoint responds 200", async ({ request }) => {
    const res = await request.get(`${BASE}/api/public/health`);
    expect(res.status()).toBe(200);
  });

  test("removed dev seed-users route is gone", async ({ request }) => {
    const res = await request.post(`${BASE}/api/public/dev/seed-users`);
    expect([404, 405]).toContain(res.status());
  });
});
