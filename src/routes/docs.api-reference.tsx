import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/api-reference")({
  head: () => ({
    meta: [
      { title: "API reference — HIGAET Docs" },
      { name: "description", content: "Reference for the HIGAET Public API v1 endpoints: programs, courses, jobs, universities, and certificate verification." },
    ],
  }),
  component: () => (
    <>
      <h1>API reference</h1>
      <p>Base URL: <code>https://www.higaet.com/api/v1</code></p>

      <h2>GET /programs</h2>
      <p>Scope: <code>read:programs</code>. Returns published programs.</p>

      <h2>GET /courses</h2>
      <p>Scope: <code>read:courses</code>. Returns the course catalog.</p>

      <h2>GET /jobs</h2>
      <p>Scope: <code>read:jobs</code>. Returns published job postings.</p>

      <h2>GET /universities</h2>
      <p>Scope: <code>read:universities</code>. Returns partner universities.</p>

      <h2>GET /certificates/verify/{`{id}`}</h2>
      <p>Scope: <code>read:certificates</code>. Looks up a certificate by id or certificate number.</p>
      <pre><code>{`{
  "data": {
    "id": "…",
    "certificate_number": "HG-2026-001",
    "issued_at": "2026-06-01T00:00:00Z",
    "status": "issued",
    "verified": true
  },
  "request_id": "…"
}`}</code></pre>
    </>
  ),
});
