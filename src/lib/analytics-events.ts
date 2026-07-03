/**
 * HIGAET analytics event catalog.
 *
 * Phase 1 (12 events): auth funnel, study-abroad funnel, payments funnel.
 * Extend here as new flows go live. Every event is a typed helper so call
 * sites can't drift on names/params.
 *
 * Fans out to GA4 (via GTM), Meta Pixel, and PostHog through `trackEvent`.
 */
import { trackEvent } from "./analytics";

/** Auth funnel — measures if users can enter the platform. */
export const authEvents = {
  signupStarted: (source?: string) => trackEvent("signup_started", { source }),
  signupCompleted: (props: { method: "email" | "google" | "apple"; source?: string }) =>
    trackEvent("signup_completed", props),
  login: (method: "email" | "google" | "apple") => trackEvent("login", { method }),
  passwordReset: (stage: "requested" | "completed") =>
    trackEvent("password_reset", { stage }),
};

/** Study Abroad funnel — lead → application → visa case. */
export const studyAbroadEvents = {
  leadCaptured: (props: { division: string; source: string }) =>
    trackEvent("lead_captured", props),
  applicationStarted: (props: { university_id?: string; program_id?: string }) =>
    trackEvent("application_started", props),
  applicationSubmitted: (props: {
    application_id: string;
    university_id?: string;
    program_id?: string;
  }) => trackEvent("application_submitted", props),
  visaCaseCreated: (props: { case_id: string; country?: string }) =>
    trackEvent("visa_case_created", props),
};

/** Payments funnel — checkout → success/failure → refund. */
export const paymentEvents = {
  checkoutStarted: (props: {
    purpose: string;
    method: string;
    amount_minor: number;
    currency: string;
  }) => trackEvent("checkout_started", props),
  paymentSucceeded: (props: {
    payment_id?: string;
    purpose: string;
    amount_minor: number;
    currency: string;
  }) => trackEvent("payment_succeeded", props),
  paymentFailed: (props: {
    purpose: string;
    method: string;
    reason?: string;
  }) => trackEvent("payment_failed", props),
  refundRequested: (props: { payment_id: string; reason?: string }) =>
    trackEvent("refund_requested", props),
  /** Refund processed successfully by admin (downstream outcome). */
  refundProcessed: (props: {
    payment_id: string;
    amount_minor: number;
    currency: string;
  }) => trackEvent("refund_processed", props),
  /** Refund attempt failed / declined by admin (downstream outcome). */
  refundFailed: (props: { payment_id: string; reason?: string }) =>
    trackEvent("refund_failed", props),
};
