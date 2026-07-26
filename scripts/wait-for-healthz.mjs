#!/usr/bin/env node
/**
 * Post-deploy health gate.
 *
 * Polls the live site's /healthz endpoint until it returns HTTP 200 or the
 * timeout expires. Used immediately after the Passenger restart in
 * `_deploy-kernel.yml` so a release that never boots fails the workflow
 * instead of silently 503-ing in production.
 *
 * Env:
 *   HEALTH_URL         full URL to poll            (default https://higaet.com/healthz)
 *   HEALTH_TIMEOUT_MS  give up after this long     (default 180000)
 *   HEALTH_INTERVAL_MS delay between attempts      (default 5000)
 *
 * Exit codes: 0 = healthy, 1 = never became healthy.
 * Always prints the total health-check duration for workflow logging.
 */

const URL_TO_POLL = process.env.HEALTH_URL ?? "https://higaet.com/healthz";
const TIMEOUT_MS = Number(process.env.HEALTH_TIMEOUT_MS ?? 180_000);
const INTERVAL_MS = Number(process.env.HEALTH_INTERVAL_MS ?? 5_000);

const started = Date.now();
let attempt = 0;
let lastStatus = 0;
let lastError = "";

console.log(`[health] polling ${URL_TO_POLL} (timeout ${TIMEOUT_MS}ms, every ${INTERVAL_MS}ms)`);

while (Date.now() - started < TIMEOUT_MS) {
  attempt += 1;
  const elapsed = Date.now() - started;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(URL_TO_POLL, {
      headers: { "cache-control": "no-cache" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    lastStatus = res.status;

    if (res.status === 200) {
      let body = "";
      try {
        body = (await res.text()).slice(0, 300);
      } catch {
        /* body optional */
      }
      const durationMs = Date.now() - started;
      console.log(`[health] attempt ${attempt} @ ${elapsed}ms → 200 OK`);
      if (body) console.log(`[health] body: ${body}`);
      console.log(`[health] HEALTH_CHECK_DURATION_MS=${durationMs}`);
      console.log(`[health] ✓ application is healthy after ${durationMs}ms`);
      process.exit(0);
    }
    console.log(`[health] attempt ${attempt} @ ${elapsed}ms → HTTP ${res.status} (retrying)`);
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    console.log(`[health] attempt ${attempt} @ ${elapsed}ms → ${lastError} (retrying)`);
  }
  await new Promise((r) => setTimeout(r, INTERVAL_MS));
}

const durationMs = Date.now() - started;
console.log(`[health] HEALTH_CHECK_DURATION_MS=${durationMs}`);
console.error(
  `::error::/healthz never returned 200 within ${TIMEOUT_MS}ms ` +
    `(attempts=${attempt}, lastStatus=${lastStatus}${lastError ? `, lastError=${lastError}` : ""}). ` +
    `Passenger did not start the release successfully.`,
);
process.exit(1);
