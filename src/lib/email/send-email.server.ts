// Server-only email send helper with retry + delivery logging.
// Cloudflare Worker compatible — uses Brevo HTTP API.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendBrevoEmail } from "./brevo.client";
import { renderEmailHtml, renderEmailText } from "./templates";

export interface SendEmailInput {
  to: string;
  toName?: string | null;
  subject: string;
  body: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  preheader?: string | null;
  recipientName?: string | null;
  tags?: string[];
  // Optional logging linkage
  userId?: string | null;
  notificationId?: string | null;
  eventType?: string | null;
  idempotencyKey?: string | null;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  attempts: number;
  error?: string;
}

const MAX_ATTEMPTS = 2;

async function log(
  input: SendEmailInput,
  status: "sent" | "failed" | "queued",
  attempts: number,
  messageId?: string,
  error?: string,
) {
  try {
    await supabaseAdmin.from("notification_delivery_logs").insert({
      notification_id: input.notificationId ?? null,
      user_id: input.userId ?? null,
      channel: "email",
      status,
      provider: "brevo",
      provider_message_id: messageId ?? null,
      error: error ?? null,
      attempts,
      delivered_at: status === "sent" ? new Date().toISOString() : null,
    });
  } catch {
    // Never let logging failure mask the send result.
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const html = renderEmailHtml({
    subject: input.subject,
    body: input.body,
    actionUrl: input.actionUrl ?? null,
    actionLabel: input.actionLabel ?? "Open",
    preheader: input.preheader ?? null,
    recipientName: input.recipientName ?? input.toName ?? null,
  });
  const text = renderEmailText({
    subject: input.subject,
    body: input.body,
    actionUrl: input.actionUrl ?? null,
    actionLabel: input.actionLabel ?? "Open",
    recipientName: input.recipientName ?? input.toName ?? null,
  });

  let attempt = 0;
  let lastError: string | undefined;
  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    const res = await sendBrevoEmail({
      to: [{ email: input.to, ...(input.toName ? { name: input.toName } : {}) }],
      subject: input.subject,
      htmlContent: html,
      textContent: text,
      tags: input.tags,
      ...(input.idempotencyKey
        ? { headers: { "X-Idempotency-Key": input.idempotencyKey } }
        : {}),
    });
    if (res.ok) {
      await log(input, "sent", attempt, res.messageId);
      return { ok: true, messageId: res.messageId, attempts: attempt };
    }
    lastError = res.error;
    // Don't retry on 4xx (other than 429)
    if (res.status >= 400 && res.status < 500 && res.status !== 429) break;
    await new Promise((r) => setTimeout(r, 250 * attempt));
  }

  await log(input, "failed", attempt, undefined, lastError);
  return { ok: false, attempts: attempt, error: lastError };
}
