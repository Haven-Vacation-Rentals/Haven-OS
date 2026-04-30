/**
 * Work module types. Mirror the Supabase schema but as plain TS
 * interfaces so every component/action is typed end-to-end without
 * depending on a generated Supabase client.
 */

// --- Enums -------------------------------------------------------------------

export type TaskStatusCategory = "todo" | "in_progress" | "done" | "closed";

export type ListType = "private" | "shared" | "public";
export type ListMemberRole = "owner" | "member";
export type ListAccessLevel = "viewer" | "editor" | "admin";
export type AssigneeRole = "primary" | "secondary";

export type TaskPriority = "urgent" | "high" | "normal" | "low" | "none";

export type CustomFieldType =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "select"
  | "multi_select"
  | "date"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "people"
  | "labels";

/** All distinct action strings that can appear in task_activity.action */
export type ActivityAction =
  | "created"
  | "status_changed"
  | "assignee_added"
  | "assignee_removed"
  | "priority_changed"
  | "title_changed"
  | "description_changed"
  | "due_date_changed"
  | "start_date_changed"
  | "comment_added"
  | "comment_deleted"
  | "attachment_added"
  | "attachment_deleted"
  | "checklist_added"
  | "checklist_item_completed"
  | "archived"
  | "unarchived";

// --- Core entities -----------------------------------------------------------

export type SpacePrivacy = "team" | "private";

export type SpaceMemberRole = "admin" | "member" | "viewer";

export interface Space {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  order: number;
  privacy: SpacePrivacy;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  space_id: string;
  profile_id: string;
  role: SpaceMemberRole;
  added_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface Folder {
  id: string;
  space_id: string;
  name: string;
  order: number;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  space_id: string | null;
  folder_id: string | null;
  personal_owner_id: string | null;
  name: string;
  description: string | null;
  order: number;
  type: ListType;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListMember {
  list_id: string;
  profile_id: string;
  role: ListMemberRole;
  /**
   * Granular access level on this list. Independent of `role`, which is
   * retained for the legacy assignee-color feature.
   *   viewer  → read-only
   *   editor  → read + write tasks/statuses/fields
   *   admin   → full control incl. members + delete
   */
  access_level: ListAccessLevel;
  color: string;
  added_by: string | null;
  added_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface TaskWatcher {
  task_id: string;
  profile_id: string;
  added_at: string;
}

export interface Status {
  id: string;
  list_id: string;
  name: string;
  color: string;
  category: TaskStatusCategory;
  order: number;
}

export interface CustomFieldDef {
  id: string;
  list_id: string;
  name: string;
  field_type: CustomFieldType;
  config: Record<string, unknown>;
  order: number;
  created_at: string;
}

/** Alias for CustomFieldDef — used in spec references to FieldDef */
export type FieldDef = CustomFieldDef;

/**
 * Generic wrapper for a typed custom field value stored in tasks.custom_fields.
 * T is the JS type of the field (string, number, boolean, string[], etc.)
 */
export interface FieldValue<T> {
  field_def_id: string;
  value: T;
}

// --- Recurrence -------------------------------------------------------------

export type RecurrencePattern = "daily" | "weekly" | "monthly" | "yearly";

export type RecurrenceAnchor = "due_date" | "completion";

export type RecurrenceEnd =
  | { type: "never" }
  | { type: "on"; date: string } // ISO yyyy-mm-dd
  | { type: "after"; count: number };

export interface RecurrenceRule {
  pattern: RecurrencePattern;
  /** every N units (default 1) */
  interval: number;
  /** 0=Sun … 6=Sat — only meaningful for weekly */
  days_of_week?: number[];
  /** 1..31 — only meaningful for monthly */
  day_of_month?: number;
  /** what "next occurrence" is computed from — defaults to "due_date" */
  anchor?: RecurrenceAnchor;
  ends: RecurrenceEnd;
}

export interface Task {
  id: string;
  list_id: string;
  status_id: string | null;
  parent_id: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  start_date: string | null;
  time_estimate: number | null;
  order: number;
  custom_fields: Record<string, unknown>;
  assignee_ids: string[];
  tags: string[];
  archived_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Optional repeat rule. When set, completing the task rolls it forward. */
  recurrence_rule: RecurrenceRule | null;
  /** How many times this recurring series has rolled over. */
  recurrence_count: number;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

// --- ClickUp-parity entities -------------------------------------------------

export interface Checklist {
  id: string;
  task_id: string;
  name: string;
  order: number;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  completed: boolean;
  assignee_id: string | null;
  order: number;
  created_at: string;
  completed_at: string | null;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  actor_id: string | null;
  action: ActivityAction | string; // string fallback for future/unknown actions
  from_value: Record<string, unknown> | null;
  to_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  uploader_id: string | null;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  storage_path: string;
  created_at: string;
}

// --- Composite / view types --------------------------------------------------

export interface TaskWithRelations extends Task {
  status: Status | null;
  subtask_count: number;
  assignees: { id: string; full_name: string | null; avatar_url: string | null }[];
}

export interface GlobalTask extends TaskWithRelations {
  list: Pick<List, "id" | "name" | "type"> & { space_id: string };
  space: Pick<Space, "id" | "name" | "color">;
}

export interface GlobalTaskFilters {
  search?: string;
  statuses?: string[]; // status names
  priorities?: TaskPriority[];
  assignee_ids?: string[];
  list_ids?: string[];
  space_ids?: string[];
  due?: "all" | "overdue" | "today" | "this_week" | "none";
  include_archived?: boolean;
  include_completed?: boolean;
  /** Zero-based page index. Defaults to 0. */
  page?: number;
  /** Page size — defaults to 100. Hard-capped server-side. */
  page_size?: number;
}

/** Paginated result shape for global tasks. */
export interface PaginatedTasks {
  tasks: GlobalTask[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/** Flat list item for the list view — includes depth for indentation */
export interface FlatTask extends TaskWithRelations {
  depth: number;
  children: FlatTask[];
}

export interface SpaceTree extends Space {
  folders: (Folder & { lists: List[] })[];
  lists: List[]; // Lists directly under the space (no folder)
}

// --- Input types (for server actions) ----------------------------------------

export type CreateSpaceInput = Pick<Space, "name"> &
  Partial<Pick<Space, "description" | "color" | "icon">>;

export type CreateFolderInput = Pick<Folder, "space_id" | "name">;

export type CreateListInput = Pick<List, "space_id" | "name"> &
  Partial<Pick<List, "folder_id" | "description" | "type">>;

export type CreateTaskInput = Pick<Task, "list_id" | "title"> &
  Partial<
    Pick<
      Task,
      | "status_id"
      | "parent_id"
      | "description"
      | "priority"
      | "due_date"
      | "start_date"
      | "time_estimate"
      | "tags"
    >
  >;

export type UpdateTaskInput = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "status_id"
    | "priority"
    | "due_date"
    | "start_date"
    | "time_estimate"
    | "order"
    | "tags"
    | "custom_fields"
    | "archived_at"
    | "completed_at"
    | "parent_id"
    | "recurrence_rule"
  >
>;
