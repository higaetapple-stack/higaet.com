/**
 * Sentry webhook signature verification.
 *
 * Sentry signs webhook payloads with HMAC-SHA256 over the raw request body
 * using the integration client secret, and sends the hex digest in the
 * `sentry-hook-signature` header. We MUST verify with a constant-time
 * compare before trusting anything in the body.
 *
 * Kept pure (no env reads) so it is trivially testable.
 */

import { createHmac, timingSafeEqual } from "crypto";

export type WebhookVerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing-signature" | "no-secret" | "mismatch" };

export function verifySentryWebhook(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | undefined,
): WebhookVerifyResult {
  if (!secret) return { ok: false, reason: "no-secret" };
  if (!signature) return { ok: false, reason: "missing-signature" };
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return { ok: false, reason: "mismatch" };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: "mismatch" };
  return { ok: true };
}
