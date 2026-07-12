import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility regression suite for HIGAET public marketing routes.
 * Fails only on serious/critical WCAG 2.1 A/AA violations to avoid noise.
 * Extend the routes list as new public pages ship.
 */
const ROUTES = [
  "/",
  "/academy",
  "/global-education",
  "/technologies",
  "/contact",
] as const;

for (const route of ROUTES) {
  test(`a11y: ${route} has no serious/critical WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    // Wait for any client-side hydration to settle.
    await page.waitForLoadState("networkidle").catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    if (blocking.length > 0) {
      // Emit readable log to CI so failures are actionable.
      console.error(
        `axe violations on ${route}:\n` +
          blocking
            .map(
              (v) =>
                `  [${v.impact}] ${v.id} — ${v.help}\n    ${v.nodes
                  .slice(0, 3)
                  .map((n) => n.target.join(" "))
                  .join("\n    ")}`,
            )
            .join("\n"),
      );
    }
    expect(blocking, `serious/critical a11y violations on ${route}`).toEqual([]);
  });
}
