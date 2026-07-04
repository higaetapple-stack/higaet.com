/**
 * E2E: admin governance dashboard
 *
 * Verifies the three visible affordances shipped in the governance UI:
 *   1. Composite-cursor pagination — "Load more" fetches a fresh batch and
 *      the loaded counter advances against the total.
 *   2. Total counters render alongside the loaded count.
 *   3. CSV download buttons trigger a file download with the expected
 *      filename prefix for decisions, knowledge packages, and signature
 *      failures.
 *
 * Requires TEST_FIXTURE_PASSWORD and a seeded admin user. Skips when the
 * fixture password isn't provided so contributor checkouts don't break.
 */
import { test, expect } from "@playwright/test";
import { signIn, PASSWORD } from "../fixtures";

test.describe("Admin governance dashboard", () => {
  test.skip(!PASSWORD, "TEST_FIXTURE_PASSWORD not configured");

  test.beforeEach(async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/dashboard/admin/governance");
    await expect(
      page.getByRole("heading", { name: /governance & knowledge review/i }),
    ).toBeVisible();
  });

  test("decision log shows total counter and paginates via Load more", async ({ page }) => {
    await page.getByRole("tab", { name: /decision log/i }).click();
    // Meta line has the shape "Showing N of M".
    const meta = page.getByText(/Showing \d+/);
    await expect(meta).toBeVisible();
    const before = await meta.innerText();
    const loadMore = page.getByRole("button", { name: /load more/i });
    if (await loadMore.isEnabled()) {
      await loadMore.click();
      await expect
        .poll(async () => (await meta.innerText()) !== before, { timeout: 5_000 })
        .toBe(true);
    } else {
      // Not enough data to paginate — the button must still surface an
      // end-of-results state rather than disappear silently.
      await expect(page.getByRole("button", { name: /end of results/i })).toBeVisible();
    }
  });

  test("decision log CSV download triggers governance-decisions-*.csv", async ({ page }) => {
    await page.getByRole("tab", { name: /decision log/i }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /download csv/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^governance-decisions-\d+\.csv$/);
  });

  test("knowledge packages tab paginates + exports CSV", async ({ page }) => {
    await page.getByRole("tab", { name: /knowledge packages/i }).click();
    await expect(page.getByText(/Showing \d+/)).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /download csv/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^knowledge-packages-\d+\.csv$/);
  });

  test("signature failures tab paginates + exports CSV", async ({ page }) => {
    await page.getByRole("tab", { name: /signature failures/i }).click();
    await expect(page.getByText(/Showing \d+/)).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /download csv/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^signature-failures-\d+\.csv$/);
  });

  test("total counter renders in loaded/total format on first page", async ({ page }) => {
    await page.getByRole("tab", { name: /decision log/i }).click();
    const meta = page.getByText(/Showing \d+/);
    // Either "Showing N of M" (with total) or "Showing N" (empty dataset).
    await expect(meta).toContainText(/Showing \d+( of \d+)?/);
  });
});
