// Branded HTML wrapper for HIGAET transactional emails.
// Renders subject/body/CTA into a single inline-styled, Worker-safe template.

export interface EmailTemplateInput {
  subject: string;
  body: string; // plain text or simple HTML; line breaks become <br/>
  actionUrl?: string | null;
  actionLabel?: string | null;
  preheader?: string | null;
  recipientName?: string | null;
}

const BRAND = {
  name: "HIGAET",
  color: "#0b5fff",
  accent: "#0a1b3d",
  bg: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bodyToHtml(body: string): string {
  // Allow simple paragraph + line-break formatting from templates.
  return body
    .split(/\n{2,}/)
    .map(
      (para) =>
        `<p style="margin:0 0 16px 0;color:${BRAND.text};font-size:15px;line-height:1.55;">${escapeHtml(
          para,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
}

export function renderEmailHtml(input: EmailTemplateInput): string {
  const cta =
    input.actionUrl && input.actionLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
          <tr><td bgcolor="${BRAND.color}" style="border-radius:6px;">
            <a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;border-radius:6px;">${escapeHtml(input.actionLabel)}</a>
          </td></tr>
        </table>`
      : "";

  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.preheader)}</div>`
    : "";

  const greeting = input.recipientName
    ? `<p style="margin:0 0 12px 0;color:${BRAND.text};font-size:15px;">Hi ${escapeHtml(input.recipientName)},</p>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(input.subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f8fb;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;">
      <tr><td style="padding:20px 28px;background:${BRAND.accent};color:#ffffff;font-weight:700;font-size:18px;letter-spacing:.3px;">${BRAND.name}</td></tr>
      <tr><td style="padding:28px;">
        <h1 style="margin:0 0 14px 0;font-size:20px;color:${BRAND.accent};">${escapeHtml(input.subject)}</h1>
        ${greeting}
        ${bodyToHtml(input.body)}
        ${cta}
      </td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid ${BRAND.border};color:${BRAND.muted};font-size:12px;line-height:1.5;">
        This is an automated message from ${BRAND.name}. Reply to this email to reach our team.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export function renderEmailText(input: EmailTemplateInput): string {
  const lines = [
    input.subject,
    "",
    input.recipientName ? `Hi ${input.recipientName},` : "",
    input.body,
    input.actionUrl ? `\n${input.actionLabel ?? "Open"}: ${input.actionUrl}` : "",
    "",
    `— ${BRAND.name}`,
  ].filter(Boolean);
  return lines.join("\n");
}
