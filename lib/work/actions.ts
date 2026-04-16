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
  Task,
  Status,
  Comment,
  SpaceTree,
  TaskWithRelations,
  FlatTask,
  CustomFieldDef,
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
  const lists = listsRes.data ?? [];

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
}

export async function deleteSpace(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("spaces").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
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
}

export async function deleteFolder(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
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
  return data;
}

export async function updateList(
  id: string,
  input: Partial<Pick<List, "name" | "description">>,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("lists").update(input).eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
}

export async function deleteList(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
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
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/work", "layout");
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
}

// ---------------------------------------------------------------------------
// ASSIGNEES
// ---------------------------------------------------------------------------

export async function addAssignee(
  taskId: string,
  profileId: string,
): Promise<void> {
  const supabase = await db();
  const { error } = await supabase
    .from("task_assignees")
    .upsert({ task_id: taskId, profile_id: profileId });
  if (error) throw error;
  revalidatePath("/work", "layout");
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
}
