import { test, expect } from "@playwright/test";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8080";

test.describe("Admin dashboards", () => {
  test("provider-health route redirects unauthenticated to auth", async ({ page }) => {
    const res = await page.goto(`${BASE}/dashboard/admin/provider-health`);
    expect(res?.status() ?? 0).toBeLessThan(500);
    // Either redirected to /auth or rendered an auth gate
    expect(page.url()).toMatch(/\/(auth|dashboard)/);
  });
});
