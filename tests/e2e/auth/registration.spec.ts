import { test, expect } from "../fixtures";

test("registration page renders and validates email", async ({ page }) => {
  await page.goto("/auth/register");
  await page.getByLabel(/email/i).fill("not-an-email");
  await page.getByRole("button", { name: /sign up|register|create/i }).click();
  await expect(page.getByText(/invalid|valid email/i)).toBeVisible({ timeout: 4000 });
});
