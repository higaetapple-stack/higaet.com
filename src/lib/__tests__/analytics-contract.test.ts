import { describe, it, expect } from "vitest";
import {
  ANALYTICS_EVENT_NAMES,
  AnalyticsEventSchema,
  validateEvent,
} from "../analytics-contract";

describe("analytics contract", () => {
  it("declares exactly the expected 14 events (drift guard)", () => {
    expect(ANALYTICS_EVENT_NAMES.length).toBe(14);
    const schemaNames = AnalyticsEventSchema.options.map(
      (o) => (o.shape.name as { value: string }).value,
    );
    expect(new Set(schemaNames)).toEqual(new Set(ANALYTICS_EVENT_NAMES));
  });

  it("accepts a valid known event", () => {
    expect(
      validateEvent("password_reset", { stage: "completed" }).ok,
    ).toBe(true);
  });

  it("rejects a known event with a bad payload", () => {
    const r = validateEvent("password_reset", { stage: "nope" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/stage/);
  });

  it("rejects checkout_started missing money fields", () => {
    const r = validateEvent("checkout_started", {
      purpose: "tuition",
      method: "card",
    });
    expect(r.ok).toBe(false);
  });

  it("passes through unknown event names (non-blocking)", () => {
    expect(validateEvent("some_marketing_ping", { foo: 1 }).ok).toBe(true);
  });
});
