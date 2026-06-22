import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/authentication")({
  head: () => ({
    meta: [
      { title: "Authentication — HIGAET Docs" },
      { name: "description", content: "How to authenticate against the HIGAET Public API v1 using API keys and scopes." },
    ],
  }),
  component: () => (
    <>
      <h1>Authentication</h1>
      <p>Pass your API key either as a Bearer token or via <code>X-Api-Key</code>:</p>
      <pre><code>{`Authorization: Bearer hga_live_…
# or
X-Api-Key: hga_live_…`}</code></pre>
      <h2>Scopes</h2>
      <p>Each key is granted explicit scopes. A request to an endpoint outside its scopes returns <code>403 scope_missing</code>.</p>
      <ul>
        <li><code>read:programs</code></li>
        <li><code>read:courses</code></li>
        <li><code>read:certificates</code></li>
        <li><code>read:jobs</code></li>
        <li><code>read:universities</code></li>
        <li><code>write:applications</code></li>
      </ul>
      <h2>Errors</h2>
      <ul>
        <li><code>401 missing_api_key</code></li>
        <li><code>401 invalid_api_key</code></li>
        <li><code>401 key_inactive</code> / <code>key_expired</code></li>
        <li><code>403 scope_missing</code></li>
      </ul>
    </>
  ),
});
