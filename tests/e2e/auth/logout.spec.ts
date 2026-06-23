import { test, expect, signIn } from "../fixtures";

test("logout clears session and back-button cannot restore dashboard", async ({ page }) => {
  await signIn(page, "admin");
  await page.getByRole("button", { name: /log out|sign out/i }).click();
  await page.waitForURL(/\/auth/);
  await page.goBack();
  await expect(page).toHaveURL(/\/auth/);
});
