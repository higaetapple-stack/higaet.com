// Mustache-style {{var}} template renderer. Client-safe; no server imports.
// Supports nested keys: {{user.name}}, fallback to empty string.

export function renderTemplate(
  template: string,
  vars: Record<string, unknown> = {},
): string {
  if (!template) return "";
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const value = path
      .split(".")
      .reduce<unknown>(
        (acc, key) =>
          acc && typeof acc === "object" && key in (acc as Record<string, unknown>)
            ? (acc as Record<string, unknown>)[key]
            : undefined,
        vars,
      );
    if (value == null) return "";
    return String(value);
  });
}
