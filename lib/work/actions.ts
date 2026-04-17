"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateSpaceInput,
  CreateFolderInput,
  CreateListInput,
  CreateTaskInput,
  UpdateTaskInput,
  Space,
  SpaceMember,
  SpacePrivacy,
  SpaceMemberRole,
  Folder,
  List,
  ListType,
  ListMember,
  ListMemberRole,
  AssigneeRole,
  TaskWatcher,
  Task,
  Status,
  Comment,
  SpaceTree,
  TaskWithRelations,
  FlatTask,
  CustomFieldDef,
  GlobalTask,
  GlobalTaskFilters,
  Checklist,
  ChecklistItem,
  TimeEntry,
  TaskActivity,
  TaskAttachment,
  TaskStatusCategory,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

async function currentUserId(): Promise<string> {
  const supabase = await db();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ---------------------------------------------------------------------------
// SPACES
// ---------------------------------------------------------------------------

export async function getSpaces(): Promise<Space[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .is("archived_at", null)
    .order("order");
  if (error) throw error;
  return data ?? [];
}

export async function getSpaceTree(): Promise<SpaceTree[]> {
  const supabase = await db();

  // Get current user for private list visibility check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const [spacesRes, foldersRes, listsRes] = await Promise.all([
    supabase.from("spaces").select("*").is("archived_at", null).order("order"),
    supabase.from("folders").select("*").is("archived_at", null).order("order"),
    supabase.from("lists").select("*").is("archived_at", null).order("order"),
  ]);

  if (spacesRes.error) throw spacesRes.error;
  if (foldersRes.error) throw foldersRes.error;
  if (listsRes.error) throw listsRes.error;

  const spaces = spacesRes.data ?? [];
  const folders = foldersRes.data ?? [];
  const rawLists = listsRes.data ?? [];

  // Filter out private lists the caller is not a member of
  let memberListIds: Set<string> = new Set();
  if (userId) {
    const { data: memberRows } = await supabase
      .from("list_members")
      .select("list_id")
      .eq("profile_id", userId);
    if (memberRows) {
      memberListIds = new Set(memberRows.map((r) => r.list_id));
    }
  }

  const lists = rawLists.filter((l) => {
    const listType = (l as Record<string, unknown>).type as string | undefined;
    if (listType === "private") {
      return userId ? memberListIds.has(l.id) : false;
    }
    // shared and public are visible to all authenticated users
    return true;
  });

  return spaces.map((space) => {
    const spaceFolders = folders
      .filter((f) => f.space_id === space.id)
      .map((folder) => ({
        ...folder,
        lists: lists.filter((l) => l.folder_id === folder.id),
      }));
    const looseLists = lists.filter(
      (l) => l.space_id === space.id && !l.folder_id,
    );
    return { ...space, folders: spaceFolders, lists: looseLists };
  });
}

export async function createSpace(input: CreateSpaceInput): Promise<Space> {
  const supabase = await db();
  const userId = await currentUserId();

  const { data: maxOrder } = await supabase
    .from("spaces")
    .select("order")
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("spaces")
    .insert({
      ...input,
      order: (maxOrder?.order ?? -1) + 1,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
  return data;
}

export async function updateSpace(
  id: string,
  input: Partial<Pick<Space, "name" | "description" | "color" | "icon">>,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("spaces").update(input).eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function deleteSpace(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("spaces").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

// ---------------------------------------------------------------------------
// FOLDERS
// ---------------------------------------------------------------------------

export async function createFolder(input: CreateFolderInput): Promise<Folder> {
  const supabase = await db();
  const userId = await currentUserId();

  const { data: maxOrder } = await supabase
    .from("folders")
    .select("order")
    .eq("space_id", input.space_id)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("folders")
    .insert({
      ...input,
      order: (maxOrder?.order ?? -1) + 1,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
  return data;
}

export async function updateFolder(
  id: string,
  input: Partial<Pick<Folder, "name">>,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("folders").update(input).eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function deleteFolder(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

// ---------------------------------------------------------------------------
// LISTS
// ---------------------------------------------------------------------------

export async function getList(id: string): Promise<List | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("lists")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createList(input: CreateListInput): Promise<List> {
  const supabase = await db();
  const userId = await currentUserId();

  const { data: maxOrder } = await supabase
    .from("lists")
    .select("order")
    .eq("space_id", input.space_id)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("lists")
    .insert({
      ...input,
      order: (maxOrder?.order ?? -1) + 1,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  // Seed default statuses for the new list
  await supabase.rpc("seed_default_statuses", { p_list_id: data.id });

  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
  return data;
}

export async function updateList(
  id: string,
  input: Partial<Pick<List, "name" | "description" | "type">>,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("lists").update(input).eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function deleteList(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

/**
 * Returns the signed-in user's personal list ("My Tasks"), creating it on
 * first access. Personal lists have `space_id = null` and
 * `personal_owner_id = userId`. Default statuses are seeded on creation.
 */
export async function getOrCreatePersonalList(): Promise<List> {
  const supabase = await db();
  const userId = await currentUserId();

  // Try to find an existing personal list for this user.
  const { data: existing } = await supabase
    .from("lists")
    .select("*")
    .eq("personal_owner_id", userId)
    .maybeSingle();

  if (existing) return existing as List;

  // Create it.
  const { data: created, error } = await supabase
    .from("lists")
    .insert({
      space_id: null,
      folder_id: null,
      personal_owner_id: userId,
      name: "My Tasks",
      description: "Your personal task list.",
      order: 0,
      type: "private" as ListType,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  // Seed default statuses so the list is usable immediately.
  await supabase.rpc("seed_default_statuses", { p_list_id: created.id });

  // Add the owner as a member so assignee pickers / permissions work.
  await supabase.from("list_members").upsert({
    list_id: created.id,
    profile_id: userId,
    role: "owner",
    color: "#FF564E",
    added_by: userId,
  });

  return created as List;
}

// ---------------------------------------------------------------------------
// STATUSES
// ---------------------------------------------------------------------------

export async function getStatuses(listId: string): Promise<Status[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("statuses")
    .select("*")
    .eq("list_id", listId)
    .order("order");
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// CUSTOM FIELD DEFINITIONS
// ---------------------------------------------------------------------------

export async function getCustomFieldDefs(
  listId: string,
): Promise<CustomFieldDef[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("custom_field_defs")
    .select("*")
    .eq("list_id", listId)
    .order("order");
  if (error) throw error;
  return data ?? [];
}

export async function createCustomFieldDef(input: {
  list_id: string;
  name: string;
  field_type: string;
  config?: Record<string, unknown>;
}): Promise<CustomFieldDef> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("custom_field_defs")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
  return data;
}

// ---------------------------------------------------------------------------
// TASKS
// ---------------------------------------------------------------------------

export async function getTasks(
  listId: string,
  {
    includeArchived = false,
  }: { includeArchived?: boolean } = {},
): Promise<TaskWithRelations[]> {
  const supabase = await db();

  let query = supabase
    .from("tasks")
    .select(
      `
      *,
      status:statuses(*),
      subtasks:tasks!parent_id(id)
    `,
    )
    .eq("list_id", listId)
    .is("parent_id", null)
    .order("order");

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Resolve assignee profiles
  const allAssigneeIds = [
    ...new Set((data ?? []).flatMap((t: Task) => t.assignee_ids)),
  ];
  let profileMap: Record<
    string,
    { id: string; full_name: string | null; avatar_url: string | null }
  > = {};

  if (allAssigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", allAssigneeIds);
    if (profiles) {
      profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
  }

  return (data ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    status: t.status ?? null,
    subtask_count: Array.isArray(t.subtasks)
      ? (t.subtasks as unknown[]).length
      : 0,
    assignees: ((t.assignee_ids ?? []) as string[])
      .map((id: string) => profileMap[id])
      .filter(Boolean),
  })) as TaskWithRelations[];
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const supabase = await db();
  const userId = await currentUserId();

  // Auto-assign the first "todo" status if none provided
  let statusId = input.status_id;
  if (!statusId) {
    const { data: firstStatus } = await supabase
      .from("statuses")
      .select("id")
      .eq("list_id", input.list_id)
      .eq("category", "todo")
      .order("order")
      .limit(1)
      .single();
    statusId = firstStatus?.id ?? null;
  }

  const { data: maxOrder } = await supabase
    .from("tasks")
    .select("order")
    .eq("list_id", input.list_id)
    .is("parent_id", input.parent_id ?? null)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...input,
      status_id: statusId,
      order: (maxOrder?.order ?? -1) + 1,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
  return data;
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<void> {
  const supabase = await db();

  // If marking done, set completed_at
  if (input.status_id) {
    const { data: status } = await supabase
      .from("statuses")
      .select("category")
      .eq("id", input.status_id)
      .single();
    if (status?.category === "done" || status?.category === "closed") {
      input.completed_at = new Date().toISOString();
    } else {
      input.completed_at = null;
    }
  }

  const { error } = await supabase.from("tasks").update(input).eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

// ---------------------------------------------------------------------------
// LIST-LEVEL VIEW DATA
// ---------------------------------------------------------------------------

/**
 * TaskWithSubtasks — extends TaskWithRelations with done subtask count
 * and the full subtask array for inline rendering.
 */
export type TaskWithSubtasks = TaskWithRelations & {
  subtasks_done: number;
  subtask_list: TaskWithRelations[];
};

/**
 * Fetch ALL tasks (parents + subtasks) for a list-level view.
 * Returns parent tasks with their subtask_list populated.
 * Also used for the grouped list-view table.
 */
export async function getTasksForListView(
  listId: string,
): Promise<TaskWithSubtasks[]> {
  const supabase = await db();

  // Fetch ALL tasks (including subtasks) in one query
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      status:statuses(*),
      subtasks:tasks!parent_id(id, status_id, status:statuses(category))
    `,
    )
    .eq("list_id", listId)
    .is("archived_at", null)
    .order("order");

  if (error) throw error;

  // Resolve assignee profiles
  const allAssigneeIds = [
    ...new Set((data ?? []).flatMap((t: Task) => t.assignee_ids)),
  ];
  let profileMap: Record<
    string,
    { id: string; full_name: string | null; avatar_url: string | null }
  > = {};

  if (allAssigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", allAssigneeIds);
    if (profiles) {
      profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
  }

  const enriched = (data ?? []).map((t: Record<string, unknown>) => {
    const rawSubs = Array.isArray(t.subtasks)
      ? (t.subtasks as Array<Record<string, unknown>>)
      : [];
    const subtasks_done = rawSubs.filter((s) => {
      const st = s.status as { category: string } | null;
      return st?.category === "done" || st?.category === "closed";
    }).length;
    return {
      ...t,
      status: t.status ?? null,
      subtask_count: rawSubs.length,
      subtasks_done,
      subtask_list: [] as TaskWithRelations[], // will be populated below
      assignees: ((t.assignee_ids ?? []) as string[])
        .map((id: string) => profileMap[id])
        .filter(Boolean),
    };
  }) as TaskWithSubtasks[];

  // For subtasks, also create a map and attach to parents
  // The query above returns ALL tasks — separate parents vs subtasks
  // Note: `data` flat array has parent_id field
  const byId = new Map<string, TaskWithSubtasks>();
  for (const t of enriched) {
    byId.set(t.id, t);
  }

  // Attach subtasks as subtask_list to their parents
  for (const t of enriched) {
    if (t.parent_id && byId.has(t.parent_id)) {
      byId.get(t.parent_id)!.subtask_list.push(t as unknown as TaskWithRelations);
    }
  }

  // Return only top-level (parent_id === null) tasks
  return enriched.filter((t) => !t.parent_id);
}

/**
 * Duplicate a task (copies title, status, priority, due_date, description).
 */
export async function duplicateTask(taskId: string): Promise<Task> {
  const supabase = await db();
  const userId = await currentUserId();

  const { data: src, error: srcErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (srcErr || !src) throw srcErr ?? new Error("Task not found");

  const { data: maxOrder } = await supabase
    .from("tasks")
    .select("order")
    .eq("list_id", src.list_id)
    .is("parent_id", src.parent_id ?? null)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      list_id: src.list_id,
      status_id: src.status_id,
      parent_id: src.parent_id,
      title: src.title + " (copy)",
      description: src.description,
      priority: src.priority,
      due_date: src.due_date,
      start_date: src.start_date,
      time_estimate: src.time_estimate,
      custom_fields: src.custom_fields,
      tags: src.tags,
      order: (maxOrder?.order ?? -1) + 1,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
  return data;
}

/**
 * Fetch all tasks (including subtasks) for a list and return a flat array
 * with depth info for rendering a hierarchical list view.
 */
export async function getTasksWithHierarchy(
  listId: string,
): Promise<FlatTask[]> {
  const supabase = await db();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      status:statuses(*),
      subtasks:tasks!parent_id(id)
    `,
    )
    .eq("list_id", listId)
    .is("archived_at", null)
    .order("order");

  if (error) throw error;

  // Resolve assignee profiles
  const allAssigneeIds = [
    ...new Set((data ?? []).flatMap((t: Task) => t.assignee_ids)),
  ];
  let profileMap: Record<
    string,
    { id: string; full_name: string | null; avatar_url: string | null }
  > = {};

  if (allAssigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", allAssigneeIds);
    if (profiles) {
      profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
  }

  const enriched = (data ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    status: t.status ?? null,
    subtask_count: Array.isArray(t.subtasks)
      ? (t.subtasks as unknown[]).length
      : 0,
    assignees: ((t.assignee_ids ?? []) as string[])
      .map((id: string) => profileMap[id])
      .filter(Boolean),
  })) as TaskWithRelations[];

  // Build tree
  const map = new Map<string, FlatTask>();
  for (const t of enriched) {
    map.set(t.id, { ...t, depth: 0, children: [] });
  }

  const roots: FlatTask[] = [];
  for (const t of map.values()) {
    if (t.parent_id && map.has(t.parent_id)) {
      const parent = map.get(t.parent_id)!;
      t.depth = parent.depth + 1;
      parent.children.push(t);
    } else {
      roots.push(t);
    }
  }

  // Flatten tree depth-first
  function flatten(nodes: FlatTask[]): FlatTask[] {
    const result: FlatTask[] = [];
    for (const n of nodes) {
      result.push(n);
      if (n.children.length > 0) {
        result.push(...flatten(n.children));
      }
    }
    return result;
  }

  return flatten(roots);
}

/**
 * Reorder a task within its siblings and optionally reparent it.
 */
export async function reorderTask(
  taskId: string,
  newParentId: string | null,
  newOrder: number,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("tasks")
    .update({ parent_id: newParentId, order: newOrder })
    .eq("id", taskId);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

/**
 * Batch-update the order of multiple tasks at once (for DnD reordering).
 */
export async function reorderTasks(
  updates: { id: string; order: number; parent_id?: string | null }[],
): Promise<void> {
  const supabase = await db();
  // Run updates in parallel
  const promises = updates.map((u) =>
    supabase
      .from("tasks")
      .update({ order: u.order, ...(u.parent_id !== undefined ? { parent_id: u.parent_id } : {}) })
      .eq("id", u.id),
  );
  const results = await Promise.all(promises);
  const err = results.find((r) => r.error);
  if (err?.error) throw err.error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

// ---------------------------------------------------------------------------
// COMMENTS
// ---------------------------------------------------------------------------

export async function getComments(taskId: string): Promise<
  (Comment & { author: { full_name: string | null; avatar_url: string | null } })[]
> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:profiles!author_id(full_name, avatar_url)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as (Comment & {
    author: { full_name: string | null; avatar_url: string | null };
  })[];
}

export async function createComment(
  taskId: string,
  body: string,
): Promise<void> {
  const supabase = await db();
  const userId = await currentUserId();
  const { error } = await supabase
    .from("comments")
    .insert({ task_id: taskId, author_id: userId, body });
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

// ---------------------------------------------------------------------------
// ASSIGNEES
// ---------------------------------------------------------------------------

export async function addAssignee(
  taskId: string,
  profileId: string,
  role: AssigneeRole = "secondary",
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("task_assignees")
    .upsert({ task_id: taskId, profile_id: profileId, role });
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function removeAssignee(
  taskId: string,
  profileId: string,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId)
    .eq("profile_id", profileId);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function setPrimaryAssignee(
  taskId: string,
  profileId: string,
): Promise<void> {
  const supabase = await db();
  // Demote all existing assignees to secondary first, then set the target to primary
  const { error: demoteError } = await supabase
    .from("task_assignees")
    .update({ role: "secondary" })
    .eq("task_id", taskId);
  if (demoteError) throw demoteError;
  const { error: promoteError } = await supabase
    .from("task_assignees")
    .upsert({ task_id: taskId, profile_id: profileId, role: "primary" });
  if (promoteError) throw promoteError;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

// ---------------------------------------------------------------------------
// MEMBERS (for assigning)
// ---------------------------------------------------------------------------

export async function getMembers(): Promise<
  { id: string; full_name: string | null; email: string; avatar_url: string | null }[]
> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// SPACE MEMBERS & PRIVACY
// ---------------------------------------------------------------------------

export async function getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("space_members")
    .select("*, profile:profiles!profile_id(id, full_name, email, avatar_url)")
    .eq("space_id", spaceId)
    .order("added_at");
  if (error) throw error;
  return (data ?? []) as SpaceMember[];
}

export async function addSpaceMember(
  spaceId: string,
  profileId: string,
  role: SpaceMemberRole = "member",
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("space_members")
    .upsert({ space_id: spaceId, profile_id: profileId, role });
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function removeSpaceMember(
  spaceId: string,
  profileId: string,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("space_members")
    .delete()
    .eq("space_id", spaceId)
    .eq("profile_id", profileId);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function updateSpacePrivacy(
  spaceId: string,
  privacy: SpacePrivacy,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("spaces")
    .update({ privacy })
    .eq("id", spaceId);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function updateSpaceMemberRole(
  spaceId: string,
  profileId: string,
  role: SpaceMemberRole,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("space_members")
    .update({ role })
    .eq("space_id", spaceId)
    .eq("profile_id", profileId);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

// ---------------------------------------------------------------------------
// LIST MEMBERS
// ---------------------------------------------------------------------------

export async function getListMembers(listId: string): Promise<ListMember[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("list_members")
    .select("*, profile:profiles!profile_id(id, full_name, email, avatar_url)")
    .eq("list_id", listId)
    .order("added_at");
  if (error) throw error;
  return (data ?? []) as ListMember[];
}

export async function addListMember(
  listId: string,
  profileId: string,
  options: { role?: ListMemberRole; color?: string } = {},
): Promise<void> {
  const supabase = await db();
  const userId = await currentUserId();
  const { error } = await supabase.from("list_members").upsert({
    list_id: listId,
    profile_id: profileId,
    role: options.role ?? "member",
    color: options.color ?? "#6366f1",
    added_by: userId,
  });
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function removeListMember(
  listId: string,
  profileId: string,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("list_members")
    .delete()
    .eq("list_id", listId)
    .eq("profile_id", profileId);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function updateListMemberColor(
  listId: string,
  profileId: string,
  color: string,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("list_members")
    .update({ color })
    .eq("list_id", listId)
    .eq("profile_id", profileId);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function updateListType(
  listId: string,
  type: ListType,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("lists")
    .update({ type })
    .eq("id", listId);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

// ---------------------------------------------------------------------------
// TASK WATCHERS
// ---------------------------------------------------------------------------

export async function getWatchers(taskId: string): Promise<TaskWatcher[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("task_watchers")
    .select("*")
    .eq("task_id", taskId)
    .order("added_at");
  if (error) throw error;
  return data ?? [];
}

export async function addWatcher(
  taskId: string,
  profileId: string,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("task_watchers")
    .upsert({ task_id: taskId, profile_id: profileId });
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

export async function removeWatcher(
  taskId: string,
  profileId: string,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("task_watchers")
    .delete()
    .eq("task_id", taskId)
    .eq("profile_id", profileId);
  if (error) throw error;
  revalidatePath("/work", "layout");
  revalidatePath("/my-tasks");
}

// ---------------------------------------------------------------------------
// GLOBAL TASKS
// ---------------------------------------------------------------------------

/** Inline date helpers (avoids adding date-fns as a dep) */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getGlobalTasks(
  filters: GlobalTaskFilters = {},
): Promise<GlobalTask[]> {
  const supabase = await db();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Resolve which list_ids the caller can see (respect private visibility)
  let memberListIds: Set<string> = new Set();
  if (userId) {
    const { data: memberRows } = await supabase
      .from("list_members")
      .select("list_id")
      .eq("profile_id", userId);
    if (memberRows) {
      memberListIds = new Set(memberRows.map((r) => r.list_id));
    }
  }

  let query = supabase
    .from("tasks")
    .select(
      `
      *,
      status:statuses(*),
      subtasks:tasks!parent_id(id),
      list:lists!list_id(id, name, type, space_id),
      space:spaces!inner(id, name, color)
    `,
    )
    .is("archived_at", filters.include_archived ? undefined : null)
    .order("order");

  if (!filters.include_completed) {
    query = query.is("completed_at", null);
  }

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters.priorities && filters.priorities.length > 0) {
    query = query.in("priority", filters.priorities);
  }

  if (filters.assignee_ids && filters.assignee_ids.length > 0) {
    query = query.overlaps("assignee_ids", filters.assignee_ids);
  }

  if (filters.list_ids && filters.list_ids.length > 0) {
    query = query.in("list_id", filters.list_ids);
  }

  if (filters.space_ids && filters.space_ids.length > 0) {
    query = query.in("spaces.id", filters.space_ids);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    // Filter by status name via join — use subquery approach
    const { data: statusRows } = await supabase
      .from("statuses")
      .select("id")
      .in("name", filters.statuses);
    if (statusRows && statusRows.length > 0) {
      query = query.in(
        "status_id",
        statusRows.map((s) => s.id),
      );
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  // Resolve assignee profiles
  const allAssigneeIds = [
    ...new Set((data ?? []).flatMap((t: Task) => t.assignee_ids)),
  ];
  let profileMap: Record<
    string,
    { id: string; full_name: string | null; avatar_url: string | null }
  > = {};

  if (allAssigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", allAssigneeIds);
    if (profiles) {
      profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
  }

  const enriched = (data ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    status: t.status ?? null,
    subtask_count: Array.isArray(t.subtasks)
      ? (t.subtasks as unknown[]).length
      : 0,
    assignees: ((t.assignee_ids ?? []) as string[])
      .map((id: string) => profileMap[id])
      .filter(Boolean),
  })) as GlobalTask[];

  // Filter by visibility: hide private lists the caller isn't a member of
  const visible = enriched.filter((t) => {
    const listType = t.list?.type;
    if (listType === "private") {
      return userId ? memberListIds.has(t.list.id) : false;
    }
    return true;
  });

  // Date filters (applied in JS after DB query)
  if (!filters.due || filters.due === "all") {
    return visible;
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  return visible.filter((t) => {
    if (!t.due_date) {
      return filters.due === "none";
    }
    const d = new Date(t.due_date + "T00:00:00");
    switch (filters.due) {
      case "overdue":
        return d < todayStart;
      case "today":
        return d >= todayStart && d <= todayEnd;
      case "this_week":
        return d >= weekStart && d <= weekEnd;
      case "none":
        return false;
      default:
        return true;
    }
  });
}

// ---------------------------------------------------------------------------
// STATUSES — CRUD + reorder (ClickUp-parity)
// ---------------------------------------------------------------------------

export interface CreateStatusInput {
  name: string;
  color: string;
  category: TaskStatusCategory;
  order?: number;
}

export async function createStatus(
  listId: string,
  input: CreateStatusInput,
): Promise<Status> {
  const supabase = await db();
  await currentUserId();

  // If order not provided, put it at the end
  let order = input.order;
  if (order === undefined) {
    const { data: maxRow } = await supabase
      .from("statuses")
      .select("order")
      .eq("list_id", listId)
      .order("order", { ascending: false })
      .limit(1)
      .single();
    order = (maxRow?.order ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from("statuses")
    .insert({ list_id: listId, name: input.name, color: input.color, category: input.category, order })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/work");
  return data as Status;
}

export async function updateStatus(
  id: string,
  patch: Partial<Pick<Status, "name" | "color" | "category" | "order">>,
): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const { error } = await supabase.from("statuses").update(patch).eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}

export async function deleteStatus(
  id: string,
  reassignTo?: string,
): Promise<void> {
  const supabase = await db();
  await currentUserId();

  // Check if any tasks reference this status
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("status_id", id);

  if ((count ?? 0) > 0) {
    if (!reassignTo) {
      throw new Error(
        "Cannot delete status: tasks exist with this status. Provide reassignTo to move them first.",
      );
    }
    // Move tasks to the replacement status
    const { error: reassignError } = await supabase
      .from("tasks")
      .update({ status_id: reassignTo })
      .eq("status_id", id);
    if (reassignError) throw reassignError;
  }

  const { error } = await supabase.from("statuses").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}

export async function reorderStatuses(
  listId: string,
  idsInOrder: string[],
): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const updates = idsInOrder.map((statusId, index) =>
    supabase
      .from("statuses")
      .update({ order: index })
      .eq("id", statusId)
      .eq("list_id", listId),
  );
  const results = await Promise.all(updates);
  const err = results.find((r) => r.error);
  if (err?.error) throw err.error;
  revalidatePath("/work");
}

// ---------------------------------------------------------------------------
// CUSTOM FIELD DEFINITIONS — CRUD + reorder (ClickUp-parity)
// ---------------------------------------------------------------------------

export async function createFieldDef(
  listId: string,
  input: Pick<CustomFieldDef, "name" | "field_type"> & { config?: Record<string, unknown> },
): Promise<CustomFieldDef> {
  const supabase = await db();
  await currentUserId();

  const { data: maxRow } = await supabase
    .from("custom_field_defs")
    .select("order")
    .eq("list_id", listId)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("custom_field_defs")
    .insert({
      list_id: listId,
      name: input.name,
      field_type: input.field_type,
      config: input.config ?? {},
      order: (maxRow?.order ?? -1) + 1,
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/work");
  return data as CustomFieldDef;
}

export async function updateFieldDef(
  id: string,
  patch: Partial<Pick<CustomFieldDef, "name" | "field_type" | "config" | "order">>,
): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const { error } = await supabase
    .from("custom_field_defs")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}

export async function deleteFieldDef(id: string): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const { error } = await supabase
    .from("custom_field_defs")
    .delete()
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}

export async function reorderFieldDefs(
  listId: string,
  idsInOrder: string[],
): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const updates = idsInOrder.map((defId, index) =>
    supabase
      .from("custom_field_defs")
      .update({ order: index })
      .eq("id", defId)
      .eq("list_id", listId),
  );
  const results = await Promise.all(updates);
  const err = results.find((r) => r.error);
  if (err?.error) throw err.error;
  revalidatePath("/work");
}

/**
 * Writes a single custom field value into tasks.custom_fields JSONB.
 * Merges with existing values; pass `null` to clear a field.
 */
export async function setTaskFieldValue(
  taskId: string,
  fieldDefId: string,
  value: unknown,
): Promise<void> {
  const supabase = await db();
  await currentUserId();

  // Fetch current custom_fields, merge in the new value
  const { data: taskRow, error: fetchErr } = await supabase
    .from("tasks")
    .select("custom_fields")
    .eq("id", taskId)
    .single();
  if (fetchErr) throw fetchErr;

  const existing = (taskRow?.custom_fields as Record<string, unknown>) ?? {};
  const updated: Record<string, unknown> = { ...existing };
  if (value === null) {
    delete updated[fieldDefId];
  } else {
    updated[fieldDefId] = value;
  }

  const { error } = await supabase
    .from("tasks")
    .update({ custom_fields: updated })
    .eq("id", taskId);
  if (error) throw error;
  revalidatePath("/work");
}

// ---------------------------------------------------------------------------
// CHECKLISTS
// ---------------------------------------------------------------------------

export async function createChecklist(
  taskId: string,
  name: string = "Checklist",
): Promise<Checklist> {
  const supabase = await db();
  await currentUserId();

  const { data: maxRow } = await supabase
    .from("checklists")
    .select("order")
    .eq("task_id", taskId)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("checklists")
    .insert({ task_id: taskId, name, order: (maxRow?.order ?? -1) + 1 })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/work");
  return data as Checklist;
}

export async function renameChecklist(id: string, name: string): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const { error } = await supabase
    .from("checklists")
    .update({ name })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}

export async function deleteChecklist(id: string): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const { error } = await supabase.from("checklists").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}

export async function getChecklists(taskId: string): Promise<
  (Checklist & { items: ChecklistItem[] })[]
> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("checklists")
    .select("*, items:checklist_items(*)")
    .eq("task_id", taskId)
    .order("order");
  if (error) throw error;
  return (data ?? []) as (Checklist & { items: ChecklistItem[] })[];
}

export async function addChecklistItem(
  checklistId: string,
  content: string,
): Promise<ChecklistItem> {
  const supabase = await db();
  await currentUserId();

  const { data: maxRow } = await supabase
    .from("checklist_items")
    .select("order")
    .eq("checklist_id", checklistId)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("checklist_items")
    .insert({
      checklist_id: checklistId,
      content,
      order: (maxRow?.order ?? -1) + 1,
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/work");
  return data as ChecklistItem;
}

export async function toggleChecklistItem(id: string): Promise<void> {
  const supabase = await db();
  await currentUserId();

  const { data: item, error: fetchErr } = await supabase
    .from("checklist_items")
    .select("completed")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;

  const nowCompleted = !item.completed;
  const { error } = await supabase
    .from("checklist_items")
    .update({
      completed: nowCompleted,
      completed_at: nowCompleted ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}

export async function updateChecklistItemContent(
  id: string,
  content: string,
): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const { error } = await supabase
    .from("checklist_items")
    .update({ content })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const { error } = await supabase
    .from("checklist_items")
    .delete()
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}

export async function reorderChecklistItems(
  checklistId: string,
  idsInOrder: string[],
): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const updates = idsInOrder.map((itemId, index) =>
    supabase
      .from("checklist_items")
      .update({ order: index })
      .eq("id", itemId)
      .eq("checklist_id", checklistId),
  );
  const results = await Promise.all(updates);
  const err = results.find((r) => r.error);
  if (err?.error) throw err.error;
  revalidatePath("/work");
}

// ---------------------------------------------------------------------------
// TIME TRACKING
// ---------------------------------------------------------------------------

export async function startTimer(
  taskId: string,
  description?: string,
): Promise<TimeEntry> {
  const supabase = await db();
  const userId = await currentUserId();

  // Ensure no open timer exists for this user
  const { data: open } = await supabase
    .from("time_entries")
    .select("id")
    .eq("user_id", userId)
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();
  if (open) {
    throw new Error(
      "A timer is already running. Stop it before starting a new one.",
    );
  }

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      task_id: taskId,
      user_id: userId,
      description: description ?? null,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/work");
  return data as TimeEntry;
}

export async function stopTimer(entryId: string): Promise<TimeEntry> {
  const supabase = await db();
  await currentUserId();

  const { data: entry, error: fetchErr } = await supabase
    .from("time_entries")
    .select("started_at")
    .eq("id", entryId)
    .single();
  if (fetchErr) throw fetchErr;

  const endedAt = new Date();
  const startedAt = new Date(entry.started_at);
  const durationMs = endedAt.getTime() - startedAt.getTime();

  const { data, error } = await supabase
    .from("time_entries")
    .update({
      ended_at: endedAt.toISOString(),
      duration_ms: durationMs,
    })
    .eq("id", entryId)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/work");
  return data as TimeEntry;
}

export async function addManualTimeEntry(
  taskId: string,
  input: { startedAt: string; endedAt: string; description?: string },
): Promise<TimeEntry> {
  const supabase = await db();
  const userId = await currentUserId();

  const startedAt = new Date(input.startedAt);
  const endedAt = new Date(input.endedAt);
  const durationMs = endedAt.getTime() - startedAt.getTime();
  if (durationMs <= 0) throw new Error("endedAt must be after startedAt");

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      task_id: taskId,
      user_id: userId,
      description: input.description ?? null,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      duration_ms: durationMs,
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/work");
  return data as TimeEntry;
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const supabase = await db();
  await currentUserId();
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}

export async function getActiveTimer(userId: string): Promise<TimeEntry | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("user_id", userId)
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as TimeEntry | null;
}

export interface TaskTimeTotalResult {
  task_id: string;
  total_ms: number;
  entries: TimeEntry[];
}

export async function getTaskTimeTotal(
  taskId: string,
): Promise<TaskTimeTotalResult> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("task_id", taskId)
    .order("started_at", { ascending: false });
  if (error) throw error;
  const entries = (data ?? []) as TimeEntry[];
  const total_ms = entries.reduce((sum, e) => sum + (e.duration_ms ?? 0), 0);
  return { task_id: taskId, total_ms, entries };
}

// ---------------------------------------------------------------------------
// ACTIVITY LOG
// ---------------------------------------------------------------------------

export interface TaskActivityWithActor extends TaskActivity {
  actor?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export async function getTaskActivity(
  taskId: string,
  limit: number = 50,
): Promise<TaskActivityWithActor[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("task_activity")
    .select("*, actor:profiles!actor_id(id, full_name, avatar_url)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as TaskActivityWithActor[];
}

// ---------------------------------------------------------------------------
// COMMENTS (extend existing helpers)
// ---------------------------------------------------------------------------

export async function addComment(taskId: string, body: string): Promise<void> {
  const supabase = await db();
  const userId = await currentUserId();
  const { error } = await supabase
    .from("comments")
    .insert({ task_id: taskId, author_id: userId, body });
  if (error) throw error;
  revalidatePath("/work");
}

export async function deleteComment(id: string): Promise<void> {
  const supabase = await db();
  const userId = await currentUserId();
  // Only the author can delete (mirrors RLS policy)
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("author_id", userId);
  if (error) throw error;
  revalidatePath("/work");
}

// ---------------------------------------------------------------------------
// ATTACHMENTS
// ---------------------------------------------------------------------------

export async function uploadAttachment(
  taskId: string,
  file: File,
): Promise<TaskAttachment> {
  const supabase = await db();
  const userId = await currentUserId();

  // Storage path: {userId}/{taskId}/{filename} for namespacing
  const storagePath = `${userId}/${taskId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("task-attachments")
    .upload(storagePath, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: taskId,
      uploader_id: userId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      storage_path: storagePath,
    })
    .select()
    .single();
  if (error) {
    // Best-effort: remove the uploaded object if metadata insert fails
    await supabase.storage.from("task-attachments").remove([storagePath]);
    throw error;
  }

  revalidatePath("/work");
  return data as TaskAttachment;
}

export async function getTaskAttachments(
  taskId: string,
): Promise<TaskAttachment[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("task_attachments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TaskAttachment[];
}

export async function deleteAttachment(id: string): Promise<void> {
  const supabase = await db();
  await currentUserId();

  // Fetch storage path first so we can remove the object from Storage
  const { data: attachment, error: fetchErr } = await supabase
    .from("task_attachments")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;

  // Remove from storage (best-effort; ignore if already gone)
  await supabase.storage
    .from("task-attachments")
    .remove([attachment.storage_path]);

  const { error } = await supabase
    .from("task_attachments")
    .delete()
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/work");
}
