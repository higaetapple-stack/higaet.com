import { test, expect, signIn } from "../fixtures";

test("expired session redirects to /auth/login on next navigation", async ({ page, context }) => {
  await signIn(page, "student");
  // Wipe Supabase session from storage to simulate expiry.
  await context.clearCookies();
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) if (k.startsWith("sb-")) localStorage.removeItem(k);
  });
  await page.goto("/dashboard/career");
  await page.waitForURL(/\/auth\/login/);
});
