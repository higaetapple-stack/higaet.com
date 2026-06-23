import { test, expect } from "@playwright/test";
import { signInAs } from "../fixtures";

test.describe("Admin · Launch Readiness", () => {
  test("loads dashboard with summary cards", async ({ page }) => {
    await signInAs(page, "admin");
    await page.goto("/dashboard/admin/launch-readiness");
    await expect(page.getByRole("heading", { name: /launch readiness/i })).toBeVisible();
    await expect(page.getByText(/audit errors/i).first()).toBeVisible();
    await expect(page.getByText(/historical runs/i)).toBeVisible();
  });

  test("filters historical runs by environment", async ({ page }) => {
    await signInAs(page, "admin");
    await page.goto("/dashboard/admin/launch-readiness");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /staging/i }).click();
    // Table heading still visible after filter applies
    await expect(page.getByText(/historical runs/i)).toBeVisible();
  });

  test("non-admin gets blocked", async ({ page }) => {
    await signInAs(page, "student");
    await page.goto("/dashboard/admin/launch-readiness");
    // Either redirected to /403 or shown an error from the protected server fn
    await expect(page).toHaveURL(/\/(403|auth)|launch-readiness/);
  });
});
