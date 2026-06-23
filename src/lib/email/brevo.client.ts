// Brevo HTTP API client — Cloudflare Worker compatible (no SMTP, no TCP).
// Docs: https://developers.brevo.com/reference/sendtransacemail

export interface BrevoRecipient {
  email: string;
  name?: string;
}

export interface BrevoSendInput {
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: BrevoRecipient;
  replyTo?: BrevoRecipient;
  tags?: string[];
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

export interface BrevoSendResult {
  ok: boolean;
  messageId?: string;
  status: number;
  error?: string;
  raw?: unknown;
}

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function getEnv() {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM_ADDRESS || "notifications@higaet.com";
  const fromName = process.env.EMAIL_FROM_NAME || "HIGAET";
  const replyTo = process.env.EMAIL_REPLY_TO || "support@higaet.com";
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }
  return { apiKey, fromEmail, fromName, replyTo };
}

export async function sendBrevoEmail(
  input: BrevoSendInput,
): Promise<BrevoSendResult> {
  const env = getEnv();
  const body = {
    sender: input.sender ?? { name: env.fromName, email: env.fromEmail },
    to: input.to,
    replyTo: input.replyTo ?? { email: env.replyTo, name: env.fromName },
    subject: input.subject,
    htmlContent: input.htmlContent,
    ...(input.textContent ? { textContent: input.textContent } : {}),
    ...(input.tags ? { tags: input.tags } : {}),
    ...(input.headers ? { headers: input.headers } : {}),
    ...(input.params ? { params: input.params } : {}),
  };

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env.apiKey,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    if (!res.ok) {
      const msg =
        (parsed && typeof parsed === "object" && "message" in parsed
          ? String((parsed as { message: unknown }).message)
          : null) || `Brevo HTTP ${res.status}`;
      return { ok: false, status: res.status, error: msg, raw: parsed };
    }
    const messageId =
      parsed && typeof parsed === "object" && "messageId" in parsed
        ? String((parsed as { messageId: unknown }).messageId)
        : undefined;
    return { ok: true, status: res.status, messageId, raw: parsed };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Brevo request failed";
    return { ok: false, status: 0, error: msg };
  }
}

export async function pingBrevo(): Promise<{ ok: boolean; error?: string }> {
  try {
    const env = getEnv();
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": env.apiKey, accept: "application/json" },
    });
    if (!res.ok) return { ok: false, error: `Brevo HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ping failed" };
  }
}
