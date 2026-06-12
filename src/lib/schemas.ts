import { z } from "zod";

/**
 * Shared DTOs and Zod schemas used by both client forms and server functions.
 * Mirrors the planned MySQL schema for the Phase-2 backend migration.
 */

export const LeadDivision = z.enum(["main", "academy", "global", "tech"]);
export type LeadDivision = z.infer<typeof LeadDivision>;

export const LeadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[\d+\-()\s]*$/, "Phone may only contain digits and + - ( ) spaces")
    .optional()
    .or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  division: LeadDivision.default("main"),
  source: z.string().trim().max(120).default("website"),
});
export type LeadPayload = z.infer<typeof LeadSchema>;
