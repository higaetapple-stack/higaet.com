import { test, expect } from "@playwright/test";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8080";

test.describe("AI routing surface", () => {
  test("chat endpoint rejects unauthenticated POST or rate-limits", async ({ request }) => {
    const res = await request.post(`${BASE}/api/public/chat`, {
      data: { message: "ping" },
      failOnStatusCode: false,
    });
    // Acceptable: 401 (auth), 400 (validation), 429 (rate limit), 404 (route variant)
    expect([400, 401, 404, 429]).toContain(res.status());
  });
});
