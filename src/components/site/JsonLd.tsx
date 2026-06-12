/** Helper to build a JSON-LD `<script>` entry for TanStack head() scripts. */
export function jsonLdScript(data: unknown) {
  return {
    type: "application/ld+json" as const,
    children: JSON.stringify(data),
  };
}
