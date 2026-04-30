/**
 * Notification types — backed by the `notifications` table from
 * migration 0031_fts_and_notifications.sql.
 *
 * Each row is denormalized to one recipient so each user owns their own
 * read/unread state. Server actions inserting notifications fan out one
 * row per intended recipient.
 */

export type NotificationKind =
  | "task_assigned"
  | "task_status_changed"
  | "task_due_changed"
  | "task_comment_added"
  | "task_completed"
  | "task_archived";

export type NotificationSubjectType = "task" | "property" | "system";

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  kind: NotificationKind | string;
  subject_type: NotificationSubjectType | string;
  subject_id: string | null;
  subject_url: string | null;
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  /** Resolved actor profile when the row is loaded with the join. */
  actor?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}
