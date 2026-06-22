export type CommunityVisibility = "public" | "private";
export type CommunityMembershipType = "open" | "approval_required";
export type CommunityMemberRole = "member" | "moderator" | "owner";
export type ReactionTarget = "thread" | "reply";
export type EventStatus = "draft" | "scheduled" | "live" | "completed" | "cancelled";
export type EventRsvpStatus = "going" | "maybe" | "declined";

export interface CommunityRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  icon_url: string | null;
  visibility: CommunityVisibility;
  membership_type: CommunityMembershipType;
  member_count: number;
  thread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ThreadRow {
  id: string;
  community_id: string;
  author_id: string;
  lesson_id: string | null;
  title: string;
  body: string;
  pinned: boolean;
  locked: boolean;
  reply_count: number;
  reaction_count: number;
  last_reply_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  is_hidden?: boolean;
  author?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface ReplyRow {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  reaction_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  is_hidden?: boolean;
  author?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface ReactionRow {
  id: string;
  target_type: ReactionTarget;
  target_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface EventRow {
  id: string;
  community_id: string | null;
  title: string;
  description: string | null;
  cover_url: string | null;
  location: string | null;
  virtual_url: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  rsvp_count: number;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface EventRsvpRow {
  event_id: string;
  user_id: string;
  status: EventRsvpStatus;
  created_at: string;
  updated_at: string;
}
