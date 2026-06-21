/**
 * Sentry client init — frontend error capture.
 *
 * No-op when VITE_SENTRY_DSN is missing, so the app runs without DSN configured.
 * Set VITE_SENTRY_DSN (publishable) and optionally VITE_SENTRY_ENV in env to enable.
 */
import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentryClient() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment:
      (import.meta.env.VITE_SENTRY_ENV as string | undefined) ??
      import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
  });
  initialized = true;
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!initialized) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
