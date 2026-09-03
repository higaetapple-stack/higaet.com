/**
 * Centralized public contact configuration for HIGAET.
 *
 * Division routing:
 * - Academy (admissions, programs, certifications, billing, student support)
 * - Global Education Hub (counselling, visas, university partnerships)
 * - Technologies (enterprise projects, tech partnerships, client support)
 * - Organization-wide (general, support, careers, press/partnerships)
 *
 * Backend/system mailboxes (transactional sender, PayPal receiver, legal)
 * live elsewhere and are intentionally NOT part of this public config.
 */

export const CONTACT_EMAILS = {
  academy: "academy@higaet.com",
  admissions: "admissions@higaet.com",
  support: "support@higaet.com",
  hello: "hello@higaet.com",
  info: "info@higaet.com",
  partnerships: "partnerships@higaet.com",
  billing: "billing@higaet.com",
  careers: "careers@higaet.com",
} as const;

export type ContactEmailKey = keyof typeof CONTACT_EMAILS;

export const CONTACT_PHONES = [
  { display: "+91 7780686821", href: "tel:+917780686821" },
  { display: "+91 9491927094", href: "tel:+919491927094" },
] as const;

export const CONTACT_HOURS = "Mon–Sat, 10am–7pm IST" as const;

/** Primary public mailbox per division contact page. */
export const DIVISION_CONTACT_EMAIL: Record<"academy" | "global" | "tech", string> = {
  academy: CONTACT_EMAILS.academy,
  global: CONTACT_EMAILS.admissions,
  tech: CONTACT_EMAILS.partnerships,
};
