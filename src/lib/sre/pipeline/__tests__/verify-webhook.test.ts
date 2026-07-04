import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { verifySentryWebhook } from "../verify-webhook";

const SECRET = "test-secret";
const body = JSON.stringify({ hello: "world" });
const sig = createHmac("sha256", SECRET).update(body).digest("hex");

describe("verifySentryWebhook", () => {
  it("accepts a valid signature", () => {
    expect(verifySentryWebhook(body, sig, SECRET)).toEqual({ ok: true });
  });

  it("rejects a missing signature", () => {
    expect(verifySentryWebhook(body, null, SECRET)).toEqual({ ok: false, reason: "missing-signature" });
  });

  it("rejects a missing secret", () => {
    expect(verifySentryWebhook(body, sig, undefined)).toEqual({ ok: false, reason: "no-secret" });
  });

  it("rejects a tampered body", () => {
    const tampered = body + " ";
    expect(verifySentryWebhook(tampered, sig, SECRET)).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects a wrong secret", () => {
    expect(verifySentryWebhook(body, sig, "other-secret")).toEqual({ ok: false, reason: "mismatch" });
  });
});
