import { test, expect, signIn } from "../fixtures";

// /education requires enterprise_client | admin | super_admin.
// Coverage: guest redirect, student denial, admin allowed, deep-link preservation.

test.describe("Education route authorization", () => {
  test("guest is redirected to /auth/login with redirect param preserved", async ({ page }) => {
    await page.goto("/education");
    await page.waitForURL(/\/auth\/login/);
    expect(page.url()).toMatch(/redirect=.*education/);
  });

  test("student is denied and lands on /403", async ({ page }) => {
    await signIn(page, "student");
    await page.goto("/education");
    await page.waitForURL(/\/403/);
    expect(page.url()).toContain("/403");
  });

  test("admin can reach /education", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/education");
    await expect(page).toHaveURL(/\/education/);
  });

  test("hard refresh on /education preserves authorization", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/education");
    await page.reload();
    await expect(page).toHaveURL(/\/education/);
  });
});
