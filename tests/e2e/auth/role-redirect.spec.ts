import { test, expect, signIn, TEST_USERS } from "../fixtures";

for (const role of ["student", "counselor", "faculty", "admin"] as const) {
  test(`generic /dashboard forwards ${role} to ${TEST_USERS[role].dashboard}`, async ({ page }) => {
    await signIn(page, role);
    await page.goto("/dashboard");
    await page.waitForURL(new RegExp(`^${TEST_USERS[role].dashboard.replace(/\//g, "\\/")}`));
  });
}
