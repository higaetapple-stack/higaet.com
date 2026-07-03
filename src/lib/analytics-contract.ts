/**
 * HIGAET analytics event contract — single source of truth.
 *
 * Every tracked event must be defined here. Runtime validation happens
 * inside `trackEvent` (see `analytics.ts`) and CI drift detection lives in
 * `analytics-contract.test.ts`. Add a new event by extending the union
 * below and adding a typed helper in `analytics-events.ts`.
 */
import { z } from "zod";

const method = z.enum(["email", "google", "apple"]);
const source = z.string().min(1).max(120).optional();

/* -------------------------------- Auth -------------------------------- */
const signupStarted = z.object({
  name: z.literal("signup_started"),
  properties: z.object({ source }),
});
const signupCompleted = z.object({
  name: z.literal("signup_completed"),
  properties: z.object({ method, source }),
});
const login = z.object({
  name: z.literal("login"),
  properties: z.object({ method }),
});
const passwordReset = z.object({
  name: z.literal("password_reset"),
  properties: z.object({ stage: z.enum(["requested", "completed"]) }),
});

/* ---------------------------- Study Abroad ---------------------------- */
const leadCaptured = z.object({
  name: z.literal("lead_captured"),
  properties: z.object({
    division: z.string().min(1),
    source: z.string().min(1),
  }),
});
const applicationStarted = z.object({
  name: z.literal("application_started"),
  properties: z.object({
    university_id: z.string().optional(),
    program_id: z.string().optional(),
  }),
});
const applicationSubmitted = z.object({
  name: z.literal("application_submitted"),
  properties: z.object({
    application_id: z.string().min(1),
    university_id: z.string().optional(),
    program_id: z.string().optional(),
  }),
});
const visaCaseCreated = z.object({
  name: z.literal("visa_case_created"),
  properties: z.object({
    case_id: z.string().min(1),
    country: z.string().optional(),
  }),
});

/* ------------------------------ Payments ------------------------------ */
const money = {
  amount_minor: z.number().int().nonnegative(),
  currency: z.string().length(3),
};
const checkoutStarted = z.object({
  name: z.literal("checkout_started"),
  properties: z.object({
    purpose: z.string().min(1),
    method: z.string().min(1),
    ...money,
  }),
});
const paymentSucceeded = z.object({
  name: z.literal("payment_succeeded"),
  properties: z.object({
    payment_id: z.string().optional(),
    purpose: z.string().min(1),
    ...money,
  }),
});
const paymentFailed = z.object({
  name: z.literal("payment_failed"),
  properties: z.object({
    purpose: z.string().min(1),
    method: z.string().min(1),
    reason: z.string().optional(),
  }),
});
const refundRequested = z.object({
  name: z.literal("refund_requested"),
  properties: z.object({
    payment_id: z.string().min(1),
    reason: z.string().optional(),
  }),
});
const refundProcessed = z.object({
  name: z.literal("refund_processed"),
  properties: z.object({
    payment_id: z.string().min(1),
    ...money,
  }),
});
const refundFailed = z.object({
  name: z.literal("refund_failed"),
  properties: z.object({
    payment_id: z.string().min(1),
    reason: z.string().optional(),
  }),
});

/* ------------------------------- Union -------------------------------- */
export const AnalyticsEventSchema = z.discriminatedUnion("name", [
  signupStarted,
  signupCompleted,
  login,
  passwordReset,
  leadCaptured,
  applicationStarted,
  applicationSubmitted,
  visaCaseCreated,
  checkoutStarted,
  paymentSucceeded,
  paymentFailed,
  refundRequested,
  refundProcessed,
  refundFailed,
]);

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type AnalyticsEventName = AnalyticsEvent["name"];

/** Canonical list — kept in sync via `analytics-contract.test.ts`. */
export const ANALYTICS_EVENT_NAMES = [
  "signup_started",
  "signup_completed",
  "login",
  "password_reset",
  "lead_captured",
  "application_started",
  "application_submitted",
  "visa_case_created",
  "checkout_started",
  "payment_succeeded",
  "payment_failed",
  "refund_requested",
  "refund_processed",
  "refund_failed",
] as const satisfies ReadonlyArray<AnalyticsEventName>;

export function isKnownEvent(name: string): name is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(name);
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

/** Runtime guard. Unknown event names are allowed to pass through (returns ok:true) so
 *  ad-hoc dataLayer pushes still work; known events MUST match their schema. */
export function validateEvent(
  name: string,
  properties: Record<string, unknown>,
): ValidationResult {
  if (!isKnownEvent(name)) return { ok: true };
  const parsed = AnalyticsEventSchema.safeParse({ name, properties });
  if (parsed.success) return { ok: true };
  return {
    ok: false,
    error: parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; "),
  };
}
