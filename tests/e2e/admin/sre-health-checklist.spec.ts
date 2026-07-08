/**
 * E2E: SRE health probe → operator checklist readiness roundtrip
 *
 * 1. Signs in as admin
 * 2. Hits GET /api/public/sre/e2e-health directly for higaet.com and
 *    staging.higaet.com to establish the expected pass/fail state
 * 3. Loads /dashboard/admin/launch-report and clicks
 *    "Re-run SRE health & update checklist"
 * 4. Asserts the resulting toast/panel reports the expected updates
 * 5. Navigates to /dashboard/admin/operator-checklist and asserts the two
 *    health items (staging.health, prod.health) match the expectation
 */
import { test, expect } from "@playwright/test";
import { signInAs } from "../fixtures";

const HOSTS = [
  { label: "prod.health", url: "https://higaet.com/api/public/sre/e2e-health" },
  { label: "staging.health", url: "https://staging.higaet.com/api/public/sre/e2e-health" },
];

async function probe(url: string): Promise<{ ok: boolean; status: number | null; healthy: boolean }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    let healthy = false;
    try {
      const j: any = await res.json();
      healthy = j?.healthy === true;
    } catch {}
    return { ok: res.ok, status: res.status, healthy };
  } catch {
    return { ok: false, status: null, healthy: false };
  }
}

test.describe("Admin · SRE health → operator checklist", () => {
  test("re-run probe updates prod.health and staging.health checklist items", async ({ page }) => {
    // Establish ground truth by hitting the public endpoint directly
    const expected: Record<string, "done" | "blocked"> = {};
    for (const h of HOSTS) {
      const r = await probe(h.url);
      expected[h.label] = r.ok && r.healthy ? "done" : "blocked";
    }

    await signInAs(page, "admin");
    await page.goto("/dashboard/admin/launch-report");
    await expect(page.getByRole("heading", { name: /production launch report/i })).toBeVisible();

    // Trigger the re-run + checklist update
    await page.getByRole("button", { name: /re-run sre health/i }).click();

    // The panel that lists updates renders once the mutation resolves
    await expect(page.getByText(/checklist updated from live probes/i)).toBeVisible({ timeout: 20_000 });

    // Assert both item_keys are listed with the expected status
    for (const key of Object.keys(expected)) {
      const row = page.getByText(new RegExp(`${key}.*${expected[key]}`, "i"));
      await expect(row).toBeVisible();
    }

    // Confirm the persisted state on the operator checklist page
    await page.goto("/dashboard/admin/operator-checklist");
    await expect(page.getByRole("heading", { name: /operator checklist/i })).toBeVisible();

    for (const [key, status] of Object.entries(expected)) {
      const label = key === "prod.health" ? /production health endpoint/i : /staging health endpoint/i;
      const row = page.getByRole("row", { name: label });
      await expect(row).toContainText(new RegExp(status, "i"), { timeout: 10_000 });
    }
  });
});
