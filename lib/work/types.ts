/**
 * Work module types. Mirror the Supabase schema but as plain TS
 * interfaces so every component/action is typed end-to-end without
 * depending on a generated Supabase client.
 */

// --- Enums -------------------------------------------------------------------

export type TaskStatusCategory = "todo" | "in_progress" | "done" | "closed";

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
  space_id: string;
  folder_id: string | null;
  name: string;
  description: string | null;
  order: number;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

// --- Composite / view types --------------------------------------------------

export interface TaskWithRelations extends Task {
  status: Status | null;
  subtask_count: number;
  assignees: { id: string; full_name: string | null; avatar_url: string | null }[];
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
  Partial<Pick<List, "folder_id" | "description">>;

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
  >
>;
