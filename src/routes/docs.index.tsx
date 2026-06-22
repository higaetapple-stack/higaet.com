import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: [
      { title: "Getting started — HIGAET Docs" },
      { name: "description", content: "Start integrating with the HIGAET Public API v1 in minutes." },
    ],
  }),
  component: () => (
    <>
      <h1>Getting started</h1>
      <p>
        The HIGAET Public API gives partners read access to programs, courses,
        jobs, universities, and certificate verification. All endpoints live under{" "}
        <code>/api/v1/*</code> and require an API key.
      </p>
      <h2>1. Get an API key</h2>
      <p>Contact an admin to issue you a key. Keys begin with <code>hga_live_…</code>.</p>
      <h2>2. Make your first call</h2>
      <pre><code>{`curl -H "Authorization: Bearer hga_live_…" \\
  https://higaet-core-engine.lovable.app/api/v1/programs`}</code></pre>
      <h2>3. Inspect responses</h2>
      <p>Every response includes a <code>request_id</code> for support correlation. Errors return a JSON body with an <code>error</code> code.</p>
    </>
  ),
});
