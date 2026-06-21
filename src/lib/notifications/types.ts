// Shared notification types (client-safe — no server imports).

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [k: string]: JsonValue }
  | JsonValue[];

export type NotificationChannel = "in_app" | "email" | "push";
export type NotificationPriority = "low" | "normal" | "high" | "critical";
export type NotificationStatus =
  | "pending"
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "read";

export interface NotificationRow {
  id: string;
  user_id: string;
  event_id: string | null;
  event_type: string;
  category: string;
  title: string;
  body: string;
  action_url: string | null;
  priority: NotificationPriority;
  data: JsonValue;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferenceRow {
  id: string;
  user_id: string;
  category: string;
  in_app: boolean;
  email: boolean;
  push: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplateRow {
  id: string;
  key: string;
  channel: NotificationChannel;
  locale: string;
  subject: string | null;
  title: string | null;
  body_template: string;
  action_url: string | null;
  category: string;
  enabled: boolean;
  metadata: JsonValue;
  created_at: string;
  updated_at: string;
}

// Canonical domain events emitted across HIGAET. Extend as features land.
export const DOMAIN_EVENTS = [
  "enrollment.created",
  "enrollment.completed",
  "assignment.graded",
  "certificate.issued",
  "certificate.revoked",
  "visa.status_changed",
  "application.status_changed",
  "proposal.accepted",
  "invoice.paid",
  "payment.received",
  "thread.reply_created",
  "thread.mention",
  "event.reminder",
  "system.alert",
] as const;
export type DomainEventType = (typeof DOMAIN_EVENTS)[number] | (string & {});

// Default categories — match notification_templates.category and preferences.category.
export const NOTIFICATION_CATEGORIES = [
  { key: "academic", label: "Academic & Learning" },
  { key: "career", label: "Career & Jobs" },
  { key: "global_education", label: "Global Education" },
  { key: "technologies", label: "Technologies & Projects" },
  { key: "billing", label: "Billing & Payments" },
  { key: "community", label: "Community" },
  { key: "system", label: "System & Account" },
] as const;
export type NotificationCategory =
  (typeof NOTIFICATION_CATEGORIES)[number]["key"];
