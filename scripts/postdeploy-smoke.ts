#!/usr/bin/env bun
/**
 * Post-deploy smoke test.
 *
 * Confirms the freshly-deployed release is actually serving traffic by:
 *   1. Polling /healthz until it returns 200 (liveness).
 *   2. Polling /readyz until it returns 200 (readiness / DB reachable).
 *   3. Fetching / and asserting SSR HTML includes the expected meta tags
 *      (<title>, description, canonical, og:title, og:description).
 *
 * Any failure exits non-zero so the deploy job (or a manual dispatch) can
 * flip the symlink back to the previous release.
 *
 * Usage:
 *   SMOKE_BASE_URL=https://higaet.com bun scripts/postdeploy-smoke.ts
 *   SMOKE_BASE_URL=https://higaet.com SMOKE_TIMEOUT_MS=120000 bun scripts/postdeploy-smoke.ts
 */

const BASE = (process.env.SMOKE_BASE_URL ?? "https://higaet.com").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 120_000);
const POLL_MS = 3_000;

type CheckResult = { name: string; ok: boolean; detail: string; ms: number };
const results: CheckResult[] = [];

async function pollFor200(path: string, name: string): Promise<CheckResult> {
  const url = `${BASE}${path}`;
  const started = Date.now();
  let lastStatus = 0;
  let lastErr = "";
  while (Date.now() - started < TIMEOUT_MS) {
    try {
      const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
      lastStatus = res.status;
      if (res.status === 200) {
        return { name, ok: true, detail: `200 OK`, ms: Date.now() - started };
      }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return {
    name,
    ok: false,
    detail: `never reached 200 (last=${lastStatus}${lastErr ? ` err=${lastErr}` : ""})`,
    ms: Date.now() - started,
  };
}

async function checkSsrMeta(): Promise<CheckResult> {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}/`, { headers: { "cache-control": "no-cache" } });
    if (res.status !== 200) {
      return { name: "ssr /", ok: false, detail: `status=${res.status}`, ms: Date.now() - started };
    }
    const html = await res.text();
    const required: Array<{ label: string; re: RegExp }> = [
      { label: "<title>", re: /<title>[^<]{3,}<\/title>/i },
      { label: 'meta description', re: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{10,}/i },
      { label: 'link canonical', re: /<link[^>]+rel=["']canonical["'][^>]+href=/i },
      { label: 'og:title', re: /<meta[^>]+property=["']og:title["'][^>]+content=/i },
      { label: 'og:description', re: /<meta[^>]+property=["']og:description["'][^>]+content=/i },
    ];
    const missing = required.filter((r) => !r.re.test(html)).map((r) => r.label);
    if (missing.length > 0) {
      return {
        name: "ssr /",
        ok: false,
        detail: `missing meta: ${missing.join(", ")} (html ${html.length}b)`,
        ms: Date.now() - started,
      };
    }
    return { name: "ssr /", ok: true, detail: `meta OK (html ${html.length}b)`, ms: Date.now() - started };
  } catch (err) {
    return {
      name: "ssr /",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
      ms: Date.now() - started,
    };
  }
}

console.log(`[postdeploy-smoke] target: ${BASE}`);
console.log(`[postdeploy-smoke] timeout: ${TIMEOUT_MS}ms`);

results.push(await pollFor200("/healthz", "healthz"));
if (results.at(-1)!.ok) {
  results.push(await pollFor200("/readyz", "readyz"));
}
if (results.every((r) => r.ok)) {
  results.push(await checkSsrMeta());
}

console.log("");
console.log("[postdeploy-smoke] results:");
for (const r of results) {
  const icon = r.ok ? "✅" : "❌";
  console.log(`  ${icon} ${r.name.padEnd(10)} ${r.ms.toString().padStart(6)}ms  ${r.detail}`);
}

const failed = results.filter((r) => !r.ok);
if (failed.length > 0) {
  console.error(`\n[postdeploy-smoke] FAILED — ${failed.length} check(s)`);
  process.exit(1);
}
console.log("\n[postdeploy-smoke] OK");
