/**
 * Normalize GitHub-related error messages before they land in logs,
 * phase events, or database columns. Never hides real failures — only
 * strips values that could be secrets.
 *
 * Rules:
 *  - Never store Authorization headers.
 *  - Strip token-like substrings: ghp_*, github_pat_*, gho_*, ghs_*,
 *    ghu_*, ghr_*, bearer tokens, JWT-like strings.
 *  - Keep HTTP status, endpoint path, and GitHub error message.
 *  - Truncate to 400 chars.
 */

const TOKEN_PATTERNS: Array<[RegExp, string]> = [
  // Classic PAT & fine-grained PAT & app tokens
  [/\b(gh[pousr]|github_pat)_[A-Za-z0-9_]{16,}\b/g, "[redacted-token]"],
  // Bearer <token>
  [/\b[Bb]earer\s+[A-Za-z0-9._~+\/=-]{8,}/g, "Bearer [redacted]"],
  // Authorization header dumps: "authorization: xxx"
  [/\b[Aa]uthorization\s*:\s*[^\s"']+/g, "authorization: [redacted]"],
  // JWT-like triplet
  [/\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[redacted-jwt]"],
  // Generic long hex/base64 secret-ish blobs (>=32 chars, no spaces)
  [/\b[A-Fa-f0-9]{32,}\b/g, "[redacted-hex]"],
];

const MAX_LEN = 400;

export function sanitizeGithubError(input: unknown): string {
  const raw =
    input instanceof Error
      ? input.message
      : typeof input === "string"
      ? input
      : (() => {
          try {
            return JSON.stringify(input);
          } catch {
            return String(input);
          }
        })();

  let out = raw;
  for (const [re, replacement] of TOKEN_PATTERNS) {
    out = out.replace(re, replacement);
  }
  if (out.length > MAX_LEN) out = out.slice(0, MAX_LEN - 1) + "…";
  return out;
}
