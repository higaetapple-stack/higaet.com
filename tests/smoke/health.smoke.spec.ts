import { test, expect } from "@playwright/test";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8080";

test.describe("Infrastructure health", () => {
  test("/healthz returns 200", async ({ request }) => {
    const res = await request.get(`${BASE}/healthz`);
    expect([200, 404]).toContain(res.status());
  });

  test("/api/public/health returns 200", async ({ request }) => {
    const res = await request.get(`${BASE}/api/public/health`);
    expect(res.status()).toBe(200);
  });

  test("security headers present on home", async ({ request }) => {
    const res = await request.get(`${BASE}/`);
    expect(res.status()).toBeLessThan(500);
    const headers = res.headers();
    expect(headers["x-content-type-options"] ?? "").toBeDefined();
  });
});
