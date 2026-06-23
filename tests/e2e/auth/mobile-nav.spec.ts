import { test, expect } from "../fixtures";

test("mobile header shows Login / Sign Up for guests", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("button", { name: /menu|open menu/i });
  if (await menu.isVisible()) await menu.click();
  await expect(page.getByRole("link", { name: /log in|login/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign up|register/i })).toBeVisible();
});
