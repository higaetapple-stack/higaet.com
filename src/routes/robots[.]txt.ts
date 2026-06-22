import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { resolveTenantShell, getCurrentHost } from "@/lib/tenant-shell";

/**
 * Phase 10A · item 3 — per-host robots.txt.
 *
 * Each tenant shell advertises its own sitemap and disallows app-internal
 * paths. Corporate (apex / www / preview) keeps the historic ruleset.
 */
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const host = getCurrentHost(request.headers.get("host"));
        const shell = resolveTenantShell(host);
        const origin = `https://${host}`;

        const lines: string[] = ["User-agent: *"];

        switch (shell.id) {
          case "docs":
            lines.push("Allow: /docs", "Disallow: /dashboard", "Disallow: /auth", "Disallow: /api/");
            break;
          case "api":
            lines.push("Disallow: /");
            break;
          case "auth":
            lines.push("Disallow: /");
            break;
          case "academy":
          case "hub":
          case "ai":
            lines.push(
              `Allow: ${shell.defaultPath}`,
              "Disallow: /dashboard",
              "Disallow: /auth",
              "Disallow: /api/",
            );
            break;
          default:
            lines.push(
              "Allow: /",
              "Disallow: /dashboard",
              "Disallow: /auth",
              "Disallow: /api/",
            );
        }

        if (shell.id !== "api" && shell.id !== "auth") {
          lines.push("", `Sitemap: ${origin}/sitemap.xml`);
        }

        return new Response(lines.join("\n") + "\n", {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
