import { test, expect, signIn } from "../fixtures";

test("guest hitting protected route is redirected to /auth/login with redirect param", async ({ page }) => {
  await page.goto("/dashboard/admin");
  await page.waitForURL(/\/auth\/login/);
  expect(page.url()).toMatch(/redirect=/);
});

test("wrong-role user is sent to /403 with from + required params", async ({ page }) => {
  await signIn(page, "student");
  await page.goto("/dashboard/admin");
  await page.waitForURL(/\/403/);
  expect(page.url()).toMatch(/from=/);
  expect(page.url()).toMatch(/required=/);
});
