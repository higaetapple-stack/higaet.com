/**
 * Single source of truth for the Sentry release identifier.
 * Used by: sentry-browser.ts, CI sourcemap upload, attribution mapper,
 * AI SRE logs. Drift here silently breaks commit attribution.
 */

export function buildRelease(env: string, sha: string): string {
  return `${env}-${sha}`;
}

/** Extract the git sha from a release string, or return the input if it isn't a release. */
export function extractShaFromRelease(release: string): string {
  const dash = release.lastIndexOf("-");
  return dash >= 0 ? release.slice(dash + 1) : release;
}

export function extractEnvFromRelease(release: string): string | null {
  const dash = release.lastIndexOf("-");
  return dash >= 0 ? release.slice(0, dash) : null;
}
