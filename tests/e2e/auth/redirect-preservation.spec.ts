import { test, expect, TEST_USERS, PASSWORD } from "../fixtures";

test("deep-link → login → returns to original URL", async ({ page }) => {
  await page.goto("/dashboard/admin/users");
  await page.waitForURL(/\/auth\/login/);
  await page.getByLabel(/email/i).fill(TEST_USERS.admin.email);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/dashboard\/admin\/users/);
});
