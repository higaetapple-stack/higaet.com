import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase admin (logging) — no-op
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: () => ({ insert: async () => ({ error: null }) }),
  },
}));

// Mock fetch for Brevo
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  fetchMock.mockReset();
  process.env.BREVO_API_KEY = "test-key";
  process.env.EMAIL_FROM_ADDRESS = "notifications@higaet.com";
  process.env.EMAIL_FROM_NAME = "HIGAET";
  process.env.EMAIL_REPLY_TO = "support@higaet.com";
});

describe("brevo client", () => {
  it("posts to Brevo HTTP API and returns messageId on success", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ messageId: "abc-123" }), { status: 201 }),
    );
    const { sendBrevoEmail } = await import("../brevo.client");
    const res = await sendBrevoEmail({
      to: [{ email: "u@example.com" }],
      subject: "hi",
      htmlContent: "<p>hi</p>",
    });
    expect(res.ok).toBe(true);
    expect(res.messageId).toBe("abc-123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns error on non-2xx", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "bad" }), { status: 400 }),
    );
    const { sendBrevoEmail } = await import("../brevo.client");
    const res = await sendBrevoEmail({
      to: [{ email: "u@example.com" }],
      subject: "hi",
      htmlContent: "x",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("bad");
  });
});

describe("template renderer", () => {
  it("escapes user input and includes CTA", async () => {
    const { renderEmailHtml } = await import("../templates");
    const html = renderEmailHtml({
      subject: "<script>x</script>",
      body: "hello\n\nworld",
      actionUrl: "https://example.com",
      actionLabel: "Go",
    });
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("https://example.com");
    expect(html).toContain("Go");
  });
});

describe("sendEmail retry", () => {
  it("retries on 500 then succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("err", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ messageId: "ok" }), { status: 201 }),
      );
    const { sendEmail } = await import("../send-email.server");
    const res = await sendEmail({
      to: "u@example.com",
      subject: "s",
      body: "b",
    });
    expect(res.ok).toBe(true);
    expect(res.attempts).toBe(2);
  });

  it("does not retry on 400", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "bad" }), { status: 400 }),
    );
    const { sendEmail } = await import("../send-email.server");
    const res = await sendEmail({
      to: "u@example.com",
      subject: "s",
      body: "b",
    });
    expect(res.ok).toBe(false);
    expect(res.attempts).toBe(1);
  });
});
