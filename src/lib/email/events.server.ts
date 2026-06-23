// Thin convenience layer mapping HIGAET domain events to dispatchNotification.
// Every event creates an in-app notification AND sends an email (per user prefs),
// then logs delivery. Single source of truth — do not bypass.

import { dispatchNotification } from "@/lib/notifications/service.server";
import type { DispatchResult } from "@/lib/notifications/service.server";

interface BaseArgs {
  userId: string;
  eventId?: string | null;
  vars?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

function emit(
  eventType: string,
  category: string,
  fallback: { title: string; body: string; actionUrl?: string | null },
  args: BaseArgs,
): Promise<DispatchResult> {
  return dispatchNotification({
    userId: args.userId,
    eventType,
    eventId: args.eventId ?? null,
    category,
    vars: args.vars ?? {},
    data: args.data ?? {},
    fallback,
  });
}

// ----- Authentication -----
export const sendWelcome = (a: BaseArgs) =>
  emit("auth.welcome", "account", {
    title: "Welcome to HIGAET",
    body: "Your account is ready. Explore programs, services, and tools tailored to your goals.",
    actionUrl: "/dashboard",
  }, a);

export const sendVerifyEmail = (a: BaseArgs) =>
  emit("auth.verify_email", "account", {
    title: "Verify your email",
    body: "Confirm your email address to secure your HIGAET account.",
    actionUrl: "/auth/verify",
  }, a);

export const sendPasswordReset = (a: BaseArgs) =>
  emit("auth.password_reset", "account", {
    title: "Reset your password",
    body: "We received a request to reset your password. Use the link to choose a new one.",
    actionUrl: "/auth/reset",
  }, a);

// ----- Payments -----
export const sendPaymentSubmitted = (a: BaseArgs) =>
  emit("payment.submitted", "payments", {
    title: "Payment submitted",
    body: "We received your payment and are reviewing it. You'll be notified once it's verified.",
    actionUrl: "/account/payments",
  }, a);

export const sendPaymentApproved = (a: BaseArgs) =>
  emit("payment.approved", "payments", {
    title: "Payment approved",
    body: "Your payment has been verified and applied to your account.",
    actionUrl: "/account/payments",
  }, a);

export const sendPaymentRejected = (a: BaseArgs) =>
  emit("payment.rejected", "payments", {
    title: "Payment could not be verified",
    body: "We were unable to verify your payment. Please review the details and resubmit.",
    actionUrl: "/account/payments",
  }, a);

export const sendPaymentInfoRequested = (a: BaseArgs) =>
  emit("payment.info_requested", "payments", {
    title: "Additional information needed",
    body: "We need more details to complete payment verification.",
    actionUrl: "/account/payments",
  }, a);

// ----- Academy -----
export const sendEnrollmentConfirmation = (a: BaseArgs) =>
  emit("academy.enrollment_confirmed", "academy", {
    title: "Enrollment confirmed",
    body: "Your enrollment is confirmed. Get ready to start learning.",
    actionUrl: "/academy/learn",
  }, a);

export const sendCourseActivated = (a: BaseArgs) =>
  emit("academy.course_activated", "academy", {
    title: "Course activated",
    body: "Your course access is now active. Jump in and start your first lesson.",
    actionUrl: "/academy/learn",
  }, a);

export const sendCertificateIssued = (a: BaseArgs) =>
  emit("academy.certificate_issued", "academy", {
    title: "Your certificate is ready",
    body: "Congratulations! Your certificate has been issued and is ready to download.",
    actionUrl: "/account/certificates",
  }, a);

// ----- Global Education Hub -----
export const sendApplicationReceived = (a: BaseArgs) =>
  emit("hub.application_received", "education_hub", {
    title: "Application received",
    body: "We received your application and our team will be in touch shortly.",
    actionUrl: "/hub/applications",
  }, a);

export const sendApplicationStatusChanged = (a: BaseArgs) =>
  emit("hub.application_status", "education_hub", {
    title: "Application status updated",
    body: "There's an update on your application status.",
    actionUrl: "/hub/applications",
  }, a);

export const sendVisaStatusUpdated = (a: BaseArgs) =>
  emit("hub.visa_status", "education_hub", {
    title: "Visa case update",
    body: "Your visa case has a new update.",
    actionUrl: "/hub/visa",
  }, a);

// ----- Technologies -----
export const sendProposalCreated = (a: BaseArgs) =>
  emit("tech.proposal_created", "technologies", {
    title: "New proposal available",
    body: "A new proposal has been prepared for your review.",
    actionUrl: "/tech/proposals",
  }, a);

export const sendContractSigned = (a: BaseArgs) =>
  emit("tech.contract_signed", "technologies", {
    title: "Contract signed",
    body: "Your contract has been signed. We'll begin work as scheduled.",
    actionUrl: "/tech/contracts",
  }, a);

export const sendInvoiceGenerated = (a: BaseArgs) =>
  emit("tech.invoice_generated", "technologies", {
    title: "New invoice issued",
    body: "A new invoice has been issued to your account.",
    actionUrl: "/tech/invoices",
  }, a);

export const sendTechPaymentReceived = (a: BaseArgs) =>
  emit("tech.payment_received", "technologies", {
    title: "Payment received",
    body: "Thank you — we've received your payment.",
    actionUrl: "/tech/invoices",
  }, a);

export const sendSupportTicketUpdated = (a: BaseArgs) =>
  emit("tech.support_ticket_updated", "technologies", {
    title: "Support ticket update",
    body: "There's an update on your support ticket.",
    actionUrl: "/tech/support",
  }, a);

// ----- Platform -----
export const sendAdminNotification = (a: BaseArgs) =>
  emit("platform.admin_notification", "system", {
    title: "Admin notification",
    body: "There is a new administrative notification for your attention.",
    actionUrl: "/admin",
  }, a);

export const sendSystemAlert = (a: BaseArgs) =>
  emit("platform.system_alert", "system", {
    title: "System alert",
    body: "A system alert has been triggered.",
    actionUrl: "/admin/health",
  }, a);
