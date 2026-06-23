import { test, expect, signIn } from "../fixtures";

// /dashboard/admin requires admin | super_admin.
// Coverage: guest, every non-admin role, admin success, refresh persistence.

test.describe("Admin dashboard authorization", () => {
  test("guest direct entry → /auth/login with redirect", async ({ page }) => {
    await page.goto("/dashboard/admin");
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toMatch(/redirect=.*dashboard%2Fadmin/);
  });

  for (const role of ["student", "counselor", "faculty"] as const) {
    test(`${role} is denied and lands on /403`, async ({ page }) => {
      await signIn(page, role);
      await page.goto("/dashboard/admin");
      await page.waitForURL(/\/403/);
      expect(page.url()).toContain("from=");
    });
  }

  test("admin can reach /dashboard/admin", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL(/\/dashboard\/admin/);
  });

  test("refresh on /dashboard/admin keeps admin in", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/dashboard/admin");
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard\/admin/);
  });
});
