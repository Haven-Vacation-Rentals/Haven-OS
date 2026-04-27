/**
 * Lost / left-behind items tracker — type definitions.
 * Mirrors supabase/migrations/0024_lost_items.sql.
 */

export const LOST_ITEM_STATUSES = [
  "intake",
  "pending_pickup",
  "picked_up",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
] as const;
export type LostItemStatus = (typeof LOST_ITEM_STATUSES)[number];

export const LOST_ITEM_STATUS_LABELS: Record<LostItemStatus, string> = {
  intake: "Intake",
  pending_pickup: "Pending pickup",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Statuses considered "open" / actionable. */
export const OPEN_LOST_ITEM_STATUSES: LostItemStatus[] = [
  "intake",
  "pending_pickup",
  "picked_up",
  "in_transit",
  "delivered",
];

/** Pipeline ordering for board view. */
export const LOST_ITEM_PIPELINE: LostItemStatus[] = [
  "intake",
  "pending_pickup",
  "picked_up",
  "in_transit",
  "delivered",
  "completed",
];

export const LOST_ITEM_PRIORITIES = ["urgent", "high", "normal", "low"] as const;
export type LostItemPriority = (typeof LOST_ITEM_PRIORITIES)[number];

export const LOST_ITEM_SOURCES = [
  "internal_form",
  "external_agent",
  "api",
  "cleaning_vendor",
  "guest_email",
  "other",
] as const;
export type LostItemSource = (typeof LOST_ITEM_SOURCES)[number];

export type LostItemReturnMethod =
  | "shipped"
  | "guest_pickup"
  | "in_person"
  | "other";

export interface LostItemCase {
  id: string;
  case_number: string;

  status: LostItemStatus;
  priority: LostItemPriority;

  item_description: string;
  item_category: string | null;
  found_location: string | null;
  photo_urls: string[];

  property_id: string | null;
  property_name: string | null;

  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  reservation_ref: string | null;

  cleaning_vendor: string | null;
  pickup_scheduled_at: string | null;
  pickup_completed_at: string | null;
  return_method: LostItemReturnMethod | null;
  shipping_carrier: string | null;
  shipping_tracking: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;

  assigned_to: string | null;
  follow_up_date: string | null;

  source: LostItemSource;
  external_source: string | null;
  external_id: string | null;
  external_url: string | null;

  notes: string | null;

  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LostItemCaseWithRelations extends LostItemCase {
  property: { id: string; name: string } | null;
  assignee: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export type LostItemEventType =
  | "status_change"
  | "comment"
  | "assignment"
  | "created"
  | "updated";

export interface LostItemEvent {
  id: string;
  case_id: string;
  event_type: LostItemEventType;
  body: string | null;
  from_value: string | null;
  to_value: string | null;
  actor_id: string | null;
  actor_label: string | null;
  created_at: string;
}

export interface LostItemEventWithActor extends LostItemEvent {
  actor: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export type LostItemFilter = {
  search?: string;
  status?: LostItemStatus | "all" | "open";
  priority?: LostItemPriority | "all";
  property_id?: string | "all";
  assigned_to?: string | "all" | "unassigned";
  overdue?: boolean;
};

export type CreateLostItemInput = {
  item_description: string;
  item_category?: string | null;
  found_location?: string | null;
  photo_urls?: string[];

  property_id?: string | null;
  property_name?: string | null;

  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  reservation_ref?: string | null;

  priority?: LostItemPriority;
  status?: LostItemStatus;

  cleaning_vendor?: string | null;
  follow_up_date?: string | null;
  assigned_to?: string | null;

  source?: LostItemSource;
  external_source?: string | null;
  external_id?: string | null;
  external_url?: string | null;

  notes?: string | null;
};

export type UpdateLostItemInput = Partial<
  Omit<
    LostItemCase,
    | "id"
    | "case_number"
    | "created_at"
    | "updated_at"
    | "created_by"
  >
>;
