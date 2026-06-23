import { test, expect } from "../fixtures";

test("forgot password page renders and accepts an email", async ({ page }) => {
  await page.goto("/auth/forgot-password");
  await page.getByLabel(/email/i).fill("student.test@higaet.dev");
  await page.getByRole("button", { name: /reset|send/i }).click();
  await expect(page.getByText(/check your (email|inbox)|reset link sent/i)).toBeVisible({ timeout: 8000 });
});
