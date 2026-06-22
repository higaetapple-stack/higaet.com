import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/webhooks")({
  head: () => ({
    meta: [
      { title: "Webhooks — HIGAET Docs" },
      { name: "description", content: "Subscribe to HIGAET platform events and verify webhook signatures." },
    ],
  }),
  component: WebhooksDoc,
});

function WebhooksDoc() {
  return (
    <div className="prose prose-invert max-w-none space-y-4">
      <h1>Webhooks</h1>
      <p>
        Webhook subscriptions let HIGAET push platform events to a URL you control. Each subscription is
        tied to an API key and receives a <code>signing_secret</code> for signature verification. Create
        and manage them from the admin console.
      </p>

      <h2>Headers we send</h2>
      <pre><code>{`X-HIGAET-Event        e.g. certificate.issued
X-HIGAET-Timestamp    unix seconds at dispatch time
X-HIGAET-Signature    HMAC-SHA256(timestamp + "." + raw_body, signing_secret)
X-HIGAET-Delivery-Id  unique per attempt (uuid)`}</code></pre>

      <h2>Signature verification (Node)</h2>
      <pre><code>{`import { createHmac, timingSafeEqual } from "node:crypto";

function verify(req, secret) {
  const ts = req.headers["x-higaet-timestamp"];
  const sig = req.headers["x-higaet-signature"];
  const expected = createHmac("sha256", secret).update(\`\${ts}.\${req.rawBody}\`).digest("hex");
  const a = Buffer.from(sig); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("bad signature");
  // Reject events older than 5 minutes to prevent replay
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) throw new Error("stale timestamp");
}`}</code></pre>

      <h2>Signature verification (Python)</h2>
      <pre><code>{`import hmac, hashlib, time
def verify(ts, sig, raw_body, secret):
    expected = hmac.new(secret.encode(), f"{ts}.{raw_body}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected): raise ValueError("bad signature")
    if abs(time.time() - int(ts)) > 300: raise ValueError("stale timestamp")`}</code></pre>

      <h2>Retry policy</h2>
      <ul>
        <li>At-least-once delivery. Responses outside <code>2xx</code> are retried.</li>
        <li>Exponential backoff: 30s, 2m, 8m, 30m, 2h, 8h.</li>
        <li>After <code>max_attempts</code> (default 6), the delivery moves to <code>dead</code> and stops retrying. Replay manually from the admin console.</li>
        <li>10s request timeout per attempt.</li>
      </ul>

      <h2>Event catalog (v1)</h2>
      <ul>
        <li><code>certificate.issued</code></li>
        <li><code>application.submitted</code></li>
        <li><code>visa.status_changed</code></li>
        <li><code>job.application_submitted</code></li>
        <li><code>payment.completed</code></li>
        <li><code>thread.reply_created</code></li>
        <li><code>event.created</code></li>
      </ul>

      <h2>Local testing</h2>
      <p>
        Use a tunnel (e.g. <code>ngrok</code>, <code>cloudflared</code>) to expose your local server, then
        register the public URL as a subscription. Trigger an event from the platform and inspect the
        delivery in the admin <em>Recent deliveries</em> table — replay until your handler is correct.
      </p>
    </div>
  );
}
