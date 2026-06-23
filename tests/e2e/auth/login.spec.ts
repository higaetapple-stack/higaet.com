import { test, expect, signIn, TEST_USERS } from "../fixtures";

for (const role of ["student", "counselor", "faculty", "admin"] as const) {
  test(`${role} logs in and lands on ${TEST_USERS[role].dashboard}`, async ({ page }) => {
    await signIn(page, role);
    await expect(page).toHaveURL(new RegExp(`^${TEST_USERS[role].dashboard.replace(/\//g, "\\/")}`));
  });
}
