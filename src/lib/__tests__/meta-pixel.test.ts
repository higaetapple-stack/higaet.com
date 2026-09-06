import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackMeta, trackPageView, primePageViewed } from "../analytics";
import { metaEvents } from "../analytics-events";

describe("meta pixel standard events", () => {
  let fbq: ReturnType<typeof vi.fn>;
  let dataLayer: unknown[];

  beforeEach(() => {
    fbq = vi.fn();
    dataLayer = [];
    vi.stubGlobal("window", { fbq, dataLayer });
  });

  it("trackMeta uses fbq track (not trackCustom) with the standard name", () => {
    trackMeta("Lead", { content_category: "main" });
    expect(fbq).toHaveBeenCalledWith("track", "Lead", { content_category: "main" });
    expect(dataLayer).toContainEqual({ event: "meta_Lead", content_category: "main" });
  });

  it("trackPageView fires once per path and dedupes repeats", () => {
    trackPageView("/meta-test-a");
    trackPageView("/meta-test-a");
    trackPageView("/meta-test-a");
    const calls = fbq.mock.calls.filter((c) => c[1] === "PageView");
    expect(calls.length).toBe(1);
    trackPageView("/meta-test-b");
    expect(fbq.mock.calls.filter((c) => c[1] === "PageView").length).toBe(2);
  });

  it("primePageViewed suppresses the initial-path fire", () => {
    primePageViewed("/meta-test-prime");
    trackPageView("/meta-test-prime");
    expect(fbq).not.toHaveBeenCalled();
  });

  it("lead event carries only safe contextual params (no PII)", () => {
    metaEvents.lead({ content_category: "academy", content_name: "contact_page" });
    const [, name, params] = fbq.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(name).toBe("Lead");
    expect(Object.keys(params).sort()).toEqual(["content_category", "content_name"]);
  });

  it("viewContent carries content identity without user data", () => {
    metaEvents.viewContent({
      content_name: "Generative AI Engineering",
      content_type: "program",
      content_category: "academy",
    });
    const [, name, params] = fbq.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(name).toBe("ViewContent");
    expect(params).toEqual({
      content_name: "Generative AI Engineering",
      content_type: "program",
      content_category: "academy",
    });
  });
});
