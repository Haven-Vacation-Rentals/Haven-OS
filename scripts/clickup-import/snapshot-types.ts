/**
 * Types for the ClickUp REST API v2 payloads we consume and for the local
 * snapshot files written by extract.ts and read by load.ts /
 * provision-users.ts.
 *
 * ClickUp responses are only partially documented and drift over time, so
 * every field we do not actively consume is either omitted or typed
 * loosely; anything we pass through untouched is `unknown`.
 */

// --- ClickUp API shapes -------------------------------------------------------

export interface ClickUpUser {
  id: number;
  username: string | null;
  email: string | null;
  color?: string | null;
  initials?: string | null;
  profilePicture?: string | null;
  /** Workspace role id (1 owner, 2 admin, 3 member, 4 guest). */
  role?: number;
}

export interface ClickUpMember {
  user: ClickUpUser;
  invited_by?: unknown;
}

export interface ClickUpTeam {
  id: string;
  name: string;
  members: ClickUpMember[];
}

export interface ClickUpStatus {
  /** Present on list-detail statuses and task statuses; may be absent. */
  id?: string;
  status: string;
  color?: string | null;
  orderindex?: number | string;
  /** "open" | "custom" | "done" | "closed" */
  type?: string;
}

export interface ClickUpSpace {
  id: string;
  name: string;
  color?: string | null;
  private?: boolean;
  archived?: boolean;
  statuses?: ClickUpStatus[];
  avatar?: string | null;
}

export interface ClickUpFolder {
  id: string;
  name: string;
  orderindex?: number | string;
  hidden?: boolean;
  archived?: boolean;
  space?: { id: string; name?: string } | null;
  lists?: ClickUpList[];
}

export interface ClickUpList {
  id: string;
  name: string;
  orderindex?: number | string;
  /** List description (ClickUp calls it "content"). */
  content?: string | null;
  archived?: boolean;
  statuses?: ClickUpStatus[];
  folder?: { id: string; name?: string; hidden?: boolean } | null;
  space?: { id: string; name?: string } | null;
  task_count?: number | string | null;
}

export interface ClickUpTag {
  name: string;
  tag_fg?: string | null;
  tag_bg?: string | null;
  creator?: number | null;
}

export interface ClickUpFieldOption {
  id?: string;
  /** drop_down options use "name"; labels options use "label". */
  name?: string;
  label?: string;
  color?: string | null;
  orderindex?: number | string;
}

export interface ClickUpFieldTypeConfig {
  options?: ClickUpFieldOption[];
  default?: unknown;
  /** rating fields */
  count?: number;
  code_point?: string;
  /** currency fields */
  currency_type?: string;
  precision?: number;
  /** progress fields */
  tracking?: unknown;
  complete_on?: number;
  /** formula / relationship configs are passed through untouched. */
  [key: string]: unknown;
}

export interface ClickUpField {
  id: string;
  name: string;
  /**
   * text, short_text, number, currency, drop_down, labels, date, checkbox,
   * url, email, phone, users, emoji (rating), attachment, location, formula,
   * automatic_progress, manual_progress, list_relationship, tasks, …
   */
  type: string;
  type_config?: ClickUpFieldTypeConfig | null;
  date_created?: string | null;
  hide_from_guests?: boolean;
  required?: boolean | null;
}

/** A custom field as it appears on a task: the definition plus `value`. */
export interface ClickUpTaskFieldValue extends ClickUpField {
  value?: unknown;
  value_richtext?: unknown;
}

export interface ClickUpChecklistItem {
  id: string;
  name: string;
  orderindex?: number | string;
  resolved?: boolean;
  assignee?: ClickUpUser | null;
  date_created?: string | null;
}

export interface ClickUpChecklist {
  id: string;
  name: string;
  orderindex?: number | string;
  resolved?: number;
  unresolved?: number;
  items?: ClickUpChecklistItem[];
}

export interface ClickUpAttachment {
  id: string;
  title?: string | null;
  url?: string | null;
  url_w_query?: string | null;
  url_w_host?: string | null;
  size?: number | null;
  mimetype?: string | null;
  extension?: string | null;
  date?: string | null;
  user?: ClickUpUser | null;
}

export interface ClickUpDependency {
  task_id: string;
  depends_on: string;
  /** ClickUp dependency type code (see load.ts mapping note). */
  type?: number;
  date_created?: string | null;
  userid?: string | null;
}

export interface ClickUpLinkedTask {
  task_id: string;
  link_id: string;
  date_created?: string | null;
  userid?: string | null;
}

export interface ClickUpTaskPriority {
  id?: string | null;
  /** "urgent" | "high" | "normal" | "low" */
  priority?: string | null;
  color?: string | null;
}

export interface ClickUpTask {
  id: string;
  custom_id?: string | null;
  name: string;
  text_content?: string | null;
  description?: string | null;
  markdown_description?: string | null;
  status?: ClickUpStatus | null;
  orderindex?: string | number | null;
  date_created?: string | null;
  date_updated?: string | null;
  date_closed?: string | null;
  date_done?: string | null;
  archived?: boolean;
  creator?: ClickUpUser | null;
  assignees?: ClickUpUser[];
  watchers?: ClickUpUser[];
  checklists?: ClickUpChecklist[];
  tags?: ClickUpTag[];
  parent?: string | null;
  top_level_parent?: string | null;
  priority?: ClickUpTaskPriority | null;
  due_date?: string | null;
  start_date?: string | null;
  /** milliseconds */
  time_estimate?: number | null;
  time_spent?: number | null;
  custom_fields?: ClickUpTaskFieldValue[];
  dependencies?: ClickUpDependency[];
  linked_tasks?: ClickUpLinkedTask[];
  attachments?: ClickUpAttachment[];
  list?: { id: string; name?: string } | null;
  folder?: { id: string; name?: string } | null;
  space?: { id: string } | null;
  url?: string | null;
  /** Custom task type (e.g. "Claim" = 1001). */
  custom_item_id?: number | null;
}

export interface ClickUpComment {
  id: string;
  /** Rich-text fragments; comment_text is the flattened plain text. */
  comment?: unknown[];
  comment_text?: string | null;
  user?: ClickUpUser | null;
  /** Unix ms as string. */
  date?: string | null;
  resolved?: boolean;
  assignee?: ClickUpUser | null;
}

export interface ClickUpTimeEntry {
  id: string;
  task?: { id: string; name?: string; status?: ClickUpStatus | null } | null;
  wid?: string;
  user?: ClickUpUser | null;
  billable?: boolean | string;
  /** Unix ms (string or number). */
  start?: string | number | null;
  end?: string | number | null;
  /** Duration in ms; negative while a timer is running. */
  duration?: string | number | null;
  description?: string | null;
  at?: string | number | null;
}

// --- API response envelopes ---------------------------------------------------

export interface TeamsResponse {
  teams: ClickUpTeam[];
}
export interface SpacesResponse {
  spaces: ClickUpSpace[];
}
export interface FoldersResponse {
  folders: ClickUpFolder[];
}
export interface ListsResponse {
  lists: ClickUpList[];
}
export interface SpaceTagsResponse {
  tags: ClickUpTag[];
}
export interface FieldsResponse {
  fields: ClickUpField[];
}
export interface TasksPageResponse {
  tasks: ClickUpTask[];
  last_page?: boolean;
}
export interface CommentsResponse {
  comments: ClickUpComment[];
}
export interface TimeEntriesResponse {
  data: ClickUpTimeEntry[];
}

// --- Snapshot file shapes -----------------------------------------------------

/** snapshot/team.json */
export interface TeamSnapshot {
  extractedAt: string;
  team: ClickUpTeam;
}

/** snapshot/hierarchy.json */
export interface HierarchySnapshot {
  extractedAt: string;
  teamId: string;
  /** Active + archived spaces, deduplicated by id. */
  spaces: ClickUpSpace[];
  foldersBySpaceId: Record<string, ClickUpFolder[]>;
  folderlessListsBySpaceId: Record<string, ClickUpList[]>;
  tagsBySpaceId: Record<string, ClickUpTag[]>;
}

/** snapshot/lists/<listId>.json — one file per extracted list (checkpoint unit). */
export interface ListSnapshot {
  extractedAt: string;
  /** When this file was produced by a --since delta run, the cutoff in ms. */
  sinceMs: number | null;
  list: ClickUpList;
  spaceId: string;
  folderId: string | null;
  fields: ClickUpField[];
  /** Task detail (GET /task/{id}) — includes attachments, checklists, deps. */
  tasks: ClickUpTask[];
  commentsByTaskId: Record<string, ClickUpComment[]>;
}

/** snapshot/time-entries.json */
export interface TimeEntriesSnapshot {
  extractedAt: string;
  entries: ClickUpTimeEntry[];
}

/** snapshot/checkpoint.json */
export interface CheckpointFile {
  startedAt: string;
  updatedAt: string;
  completedListIds: string[];
  lastArgs?: Record<string, unknown>;
}

/** reports/unmapped-users.json — written by provision-users.ts. */
export interface UnmappedUserRecord {
  clickup_user_id: number;
  name: string | null;
  email: string | null;
  reason: string;
}
