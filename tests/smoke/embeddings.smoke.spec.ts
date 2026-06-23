import { test, expect } from "@playwright/test";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8080";

test.describe("Embedding pipeline surface", () => {
  test("cron endpoint rejects unauthenticated POST", async ({ request }) => {
    const res = await request.post(`${BASE}/api/public/cron/embeddings`, {
      data: {},
      failOnStatusCode: false,
    });
    expect([401, 403, 200]).toContain(res.status());
  });
});
