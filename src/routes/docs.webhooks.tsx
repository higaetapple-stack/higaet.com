import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/webhooks")({
  head: () => ({
    meta: [
      { title: "Webhooks — HIGAET Docs" },
      { name: "description", content: "Subscribe to HIGAET platform events and verify webhook signatures." },
    ],
  }),
  component: () => (
    <>
      <h1>Webhooks</h1>
      <p>
        Webhook subscriptions let HIGAET push events to a URL you control. Each subscription is tied
        to an API key and receives a <code>signing_secret</code> for signature verification.
      </p>
      <h2>Signature verification</h2>
      <p>
        We will send <code>X-HIGAET-Signature</code> as an HMAC-SHA256 over the raw request body
        using your signing secret. Verify with a timing-safe comparison.
      </p>
      <h2>Delivery semantics</h2>
      <ul>
        <li>At-least-once delivery with exponential backoff.</li>
        <li>Marked <code>dead</code> after repeated failures; replayable from the admin console.</li>
      </ul>
      <p className="text-sm text-muted-foreground">
        The delivery worker ships in Phase 8B. The subscription surface is available now via the admin API console.
      </p>
    </>
  ),
});
