import { test, expect, signIn } from "../fixtures";

test("403 page shows requested resource and missing roles", async ({ page }) => {
  await signIn(page, "student");
  await page.goto("/dashboard/admin");
  await page.waitForURL(/\/403/);
  await expect(page.getByText(/forbidden|access denied|403/i)).toBeVisible();
  await expect(page.getByText(/admin/i)).toBeVisible();
});
