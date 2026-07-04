/**
 * Sentry client init — frontend error capture.
 *
 * No-op when VITE_SENTRY_DSN is missing, so the app runs without DSN configured.
 * Set VITE_SENTRY_DSN (publishable) and optionally VITE_SENTRY_ENV / VITE_GIT_COMMIT_SHA
 * in env to enable env-aware release tagging.
 */
import * as Sentry from "@sentry/react";
import { buildRelease } from "./release";

let initialized = false;

export function initSentryClient() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  const env =
    (import.meta.env.VITE_SENTRY_ENV as string | undefined) ??
    import.meta.env.MODE;
  const sha = import.meta.env.VITE_GIT_COMMIT_SHA as string | undefined;
  // env-aware release name: `${env}-${sha}` gives clean staging vs prod separation
  const release = sha ? buildRelease(env ?? "development", sha) : undefined;

  Sentry.init({
    dsn,
    environment: env,
    release,
    tracesSampleRate: env === "production" ? 0.2 : 0.5,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });
  initialized = true;
}

/** Alias for the new naming used across the SRE knowledge base. */
export const initSentry = initSentryClient;

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!initialized) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
