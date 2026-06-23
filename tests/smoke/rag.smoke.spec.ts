import { test, expect } from "@playwright/test";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8080";

test.describe("RAG surface", () => {
  test("home renders without 5xx", async ({ request }) => {
    const res = await request.get(`${BASE}/`);
    expect(res.status()).toBeLessThan(500);
  });
});
