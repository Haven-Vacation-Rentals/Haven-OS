"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isHrAdmin } from "@/lib/hr/actions";
import type {
  DbOnboardingProject,
  DbOnboardingTask,
  DbOnboardingChecklistItem,
  DbOnboardingTaskTemplate,
  OnboardingProjectStatus,
  OnboardingTaskStatus,
  OnboardingDepartment,
  OnboardingTaskNode,
  OnboardingProjectTree,
} from "./types";

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

async function currentEmail(): Promise<string | null> {
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

// Onboarding uses the same admin whitelist as HR (via hr_admins table).
export async function isOnboardingAdmin(email?: string | null): Promise<boolean> {
  return isHrAdmin(email ?? undefined);
}

async function requireOnboardingAdmin(): Promise<string> {
  const email = await currentEmail();
  if (!email) throw new Error("Not signed in");
  if (!(await isOnboardingAdmin(email))) {
    throw new Error("Not authorized — admins only");
  }
  return email;
}

function revalidateOnboarding(id?: string) {
  revalidatePath("/onboarding");
  if (id) revalidatePath(`/onboarding/${id}`);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function listProjects(filters?: {
  status?: OnboardingProjectStatus | "all";
}): Promise<DbOnboardingProject[]> {
  await requireOnboardingAdmin();
  const supabase = await db();
  let query = supabase
    .from("onboarding_projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  const { data } = await query;
  return (data ?? []) as DbOnboardingProject[];
}

/**
 * Project + rollup stats (done/total/blocked/next key date) in one call.
 * Used by the directory page so every card can show progress without N+1.
 */
export type ProjectWithStats = DbOnboardingProject & {
  stats: {
    total: number;
    done: number;
    inProgress: number;
    blocked: number;
    notStarted: number;
    percentComplete: number;
    keyDatesTotal: number;
    keyDatesDone: number;
    nextKeyDate: { title: string; due_date: string } | null;
    overdueKeyDates: number;
    lastActivity: string | null;
  };
};

export async function listProjectsWithStats(): Promise<ProjectWithStats[]> {
  await requireOnboardingAdmin();
  const supabase = await db();
  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase
      .from("onboarding_projects")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("onboarding_tasks")
      .select(
        "id, project_id, title, status, is_key_date, due_date, updated_at",
      ),
  ]);

  const projs = (projects ?? []) as DbOnboardingProject[];
  const ts = (tasks ?? []) as Array<{
    id: string;
    project_id: string;
    title: string;
    status: OnboardingTaskStatus;
    is_key_date: boolean;
    due_date: string | null;
    updated_at: string;
  }>;

  const byProj = new Map<string, typeof ts>();
  for (const t of ts) {
    const arr = byProj.get(t.project_id) ?? [];
    arr.push(t);
    byProj.set(t.project_id, arr);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return projs.map((p) => {
    const all = byProj.get(p.id) ?? [];
    const countable = all.filter((t) => t.status !== "na");
    const done = all.filter((t) => t.status === "done").length;
    const inProgress = all.filter((t) => t.status === "in_progress").length;
    const blocked = all.filter((t) => t.status === "blocked").length;
    const notStarted = all.filter((t) => t.status === "not_started").length;
    const percentComplete =
      countable.length === 0
        ? 0
        : Math.round((done / countable.length) * 100);
    const keyDates = all.filter((t) => t.is_key_date);
    const keyDatesDone = keyDates.filter((t) => t.status === "done").length;

    const upcomingKey = keyDates
      .filter(
        (t) =>
          t.status !== "done" && t.status !== "na" && t.due_date !== null,
      )
      .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))[0];
    const overdueKeyDates = keyDates.filter(
      (t) =>
        t.status !== "done" &&
        t.status !== "na" &&
        t.due_date !== null &&
        new Date(t.due_date!) < today,
    ).length;
    const lastActivity =
      all.length === 0
        ? null
        : all.reduce(
            (acc, t) => (t.updated_at > acc ? t.updated_at : acc),
            all[0].updated_at,
          );

    return {
      ...p,
      stats: {
        total: all.length,
        done,
        inProgress,
        blocked,
        notStarted,
        percentComplete,
        keyDatesTotal: keyDates.length,
        keyDatesDone,
        nextKeyDate: upcomingKey
          ? { title: upcomingKey.title, due_date: upcomingKey.due_date! }
          : null,
        overdueKeyDates,
        lastActivity,
      },
    };
  });
}

export async function getProject(id: string): Promise<DbOnboardingProject | null> {
  await requireOnboardingAdmin();
  const supabase = await db();
  const { data } = await supabase
    .from("onboarding_projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data ?? null) as DbOnboardingProject | null;
}

export async function updateProject(
  id: string,
  input: Partial<{
    property_nickname: string;
    owner_name: string | null;
    owner_email: string | null;
    owner_phone: string | null;
    status: OnboardingProjectStatus;
    start_date: string | null;
    target_open_date: string | null;
    actual_open_date: string | null;
    slack_channel: string | null;
    owner_profile_folder_url: string | null;
    notes: string;
  }>,
): Promise<void> {
  await requireOnboardingAdmin();
  const supabase = await db();
  const { error } = await supabase
    .from("onboarding_projects")
    .update(input)
    .eq("id", id);
  if (error) throw error;
  revalidateOnboarding(id);
}

export async function deleteProject(id: string): Promise<void> {
  await requireOnboardingAdmin();
  const supabase = await db();
  await supabase.from("onboarding_projects").delete().eq("id", id);
  revalidateOnboarding();
}

// ---------------------------------------------------------------------------
// Project creation from template
// ---------------------------------------------------------------------------

export async function createProjectFromTemplate(input: {
  property_nickname: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  start_date?: string;
  target_open_date?: string;
  slack_channel?: string;
  owner_profile_folder_url?: string;
  notes?: string;
}): Promise<DbOnboardingProject> {
  const email = await requireOnboardingAdmin();
  if (!input.property_nickname.trim()) throw new Error("Property nickname is required");

  const supabase = await db();

  // 1) Create the project
  const { data: project, error: projErr } = await supabase
    .from("onboarding_projects")
    .insert({
      property_nickname: input.property_nickname.trim(),
      owner_name: input.owner_name?.trim() || null,
      owner_email: input.owner_email?.trim() || null,
      owner_phone: input.owner_phone?.trim() || null,
      start_date: input.start_date || null,
      target_open_date: input.target_open_date || null,
      slack_channel: input.slack_channel?.trim() || null,
      owner_profile_folder_url: input.owner_profile_folder_url?.trim() || null,
      notes: input.notes ?? "",
      created_by: email,
    })
    .select()
    .single();
  if (projErr) throw projErr;

  // 2) Pull ALL templates and build an id mapping (template_key -> new task id)
  const { data: templates, error: tplErr } = await supabase
    .from("onboarding_task_templates")
    .select("*")
    .order("depth", { ascending: true })
    .order("order_index", { ascending: true });
  if (tplErr) throw tplErr;

  const tpls = (templates ?? []) as DbOnboardingTaskTemplate[];

  // Two-pass: insert depth 0 first, then children at each deeper level, mapping parent keys to ids.
  const keyToId = new Map<string, string>();
  const maxDepth = tpls.reduce((m, t) => Math.max(m, t.depth), 0);

  for (let d = 0; d <= maxDepth; d++) {
    const atDepth = tpls.filter((t) => t.depth === d);
    if (atDepth.length === 0) continue;
    const rows = atDepth.map((t) => ({
      project_id: project.id,
      parent_task_id: t.parent_template_key
        ? keyToId.get(t.parent_template_key) ?? null
        : null,
      template_key: t.template_key,
      title: t.title,
      description: t.description ?? "",
      department: t.department,
      is_key_date: t.is_key_date,
      order_index: t.order_index,
      depth: t.depth,
    }));
    const { data: inserted, error: insErr } = await supabase
      .from("onboarding_tasks")
      .insert(rows)
      .select("id, template_key");
    if (insErr) throw insErr;
    for (const row of inserted ?? []) {
      const r = row as { id: string; template_key: string | null };
      if (r.template_key) keyToId.set(r.template_key, r.id);
    }
  }

  // 3) Create checklist items for any template with has_checklist
  const withChecklists = tpls.filter(
    (t) => t.has_checklist && Array.isArray(t.checklist_items) && t.checklist_items.length > 0,
  );
  for (const t of withChecklists) {
    const taskId = keyToId.get(t.template_key);
    if (!taskId) continue;
    const rows = (t.checklist_items ?? []).map((label, i) => ({
      task_id: taskId,
      label,
      order_index: i,
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from("onboarding_checklist_items").insert(rows);
      if (error) throw error;
    }
  }

  revalidateOnboarding(project.id);
  return project as DbOnboardingProject;
}

// ---------------------------------------------------------------------------
// Project tree fetch (for detail page)
// ---------------------------------------------------------------------------

export async function getProjectTree(id: string): Promise<OnboardingProjectTree | null> {
  await requireOnboardingAdmin();
  const supabase = await db();

  const { data: project } = await supabase
    .from("onboarding_projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!project) return null;

  const { data: tasks } = await supabase
    .from("onboarding_tasks")
    .select("*")
    .eq("project_id", id)
    .order("depth", { ascending: true })
    .order("order_index", { ascending: true });

  const { data: checklist } = await supabase
    .from("onboarding_checklist_items")
    .select("*")
    .in(
      "task_id",
      ((tasks ?? []) as DbOnboardingTask[]).map((t) => t.id),
    )
    .order("order_index", { ascending: true });

  // Build tree
  const flat = (tasks ?? []) as DbOnboardingTask[];
  const cl = (checklist ?? []) as DbOnboardingChecklistItem[];

  const clByTask = new Map<string, DbOnboardingChecklistItem[]>();
  for (const item of cl) {
    const arr = clByTask.get(item.task_id) ?? [];
    arr.push(item);
    clByTask.set(item.task_id, arr);
  }

  const byId = new Map<string, OnboardingTaskNode>();
  for (const t of flat) {
    byId.set(t.id, {
      ...t,
      children: [],
      checklist: clByTask.get(t.id) ?? [],
    });
  }
  const roots: OnboardingTaskNode[] = [];
  for (const t of flat) {
    const node = byId.get(t.id)!;
    if (t.parent_task_id) {
      const parent = byId.get(t.parent_task_id);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }
  // Sort children by order_index within each parent
  const sortRec = (arr: OnboardingTaskNode[]) => {
    arr.sort((a, b) => a.order_index - b.order_index);
    arr.forEach((c) => sortRec(c.children));
  };
  sortRec(roots);

  // Totals
  const countable = flat.filter((t) => t.status !== "na");
  const done = flat.filter((t) => t.status === "done").length;
  const inProgress = flat.filter((t) => t.status === "in_progress").length;
  const blocked = flat.filter((t) => t.status === "blocked").length;
  const notStarted = flat.filter((t) => t.status === "not_started").length;
  const na = flat.filter((t) => t.status === "na").length;
  const percentComplete =
    countable.length === 0 ? 0 : Math.round((done / countable.length) * 100);
  const keyDates = flat.filter((t) => t.is_key_date);
  const keyDatesDone = keyDates.filter((t) => t.status === "done").length;

  return {
    project: project as DbOnboardingProject,
    tasks: roots,
    totals: {
      total: flat.length,
      done,
      inProgress,
      blocked,
      notStarted,
      na,
      percentComplete,
      keyDatesTotal: keyDates.length,
      keyDatesDone,
    },
  };
}

// ---------------------------------------------------------------------------
// Task mutations
// ---------------------------------------------------------------------------

export async function updateTaskStatus(
  taskId: string,
  status: OnboardingTaskStatus,
): Promise<void> {
  const email = await requireOnboardingAdmin();
  const supabase = await db();
  const patch: Record<string, unknown> = { status };
  if (status === "done") {
    patch.completed_at = new Date().toISOString();
    patch.completed_by = email;
  } else {
    patch.completed_at = null;
    patch.completed_by = null;
  }
  const { data: row, error } = await supabase
    .from("onboarding_tasks")
    .update(patch)
    .eq("id", taskId)
    .select("project_id")
    .single();
  if (error) throw error;
  revalidateOnboarding((row as { project_id: string }).project_id);
}

export async function updateTask(
  taskId: string,
  input: Partial<{
    title: string;
    description: string;
    department: OnboardingDepartment | null;
    is_key_date: boolean;
    due_date: string | null;
    assignee_email: string | null;
    notes: string;
  }>,
): Promise<void> {
  await requireOnboardingAdmin();
  const supabase = await db();
  const { data: row, error } = await supabase
    .from("onboarding_tasks")
    .update(input)
    .eq("id", taskId)
    .select("project_id")
    .single();
  if (error) throw error;
  revalidateOnboarding((row as { project_id: string }).project_id);
}

export async function addAdHocTask(input: {
  project_id: string;
  parent_task_id?: string | null;
  title: string;
  department?: OnboardingDepartment | null;
  is_key_date?: boolean;
}): Promise<void> {
  await requireOnboardingAdmin();
  if (!input.title.trim()) throw new Error("Task title is required");
  const supabase = await db();

  // Determine depth + order_index
  let depth = 0;
  if (input.parent_task_id) {
    const { data: parent } = await supabase
      .from("onboarding_tasks")
      .select("depth")
      .eq("id", input.parent_task_id)
      .maybeSingle();
    if (parent) depth = ((parent as { depth: number }).depth ?? 0) + 1;
  }
  const { data: last } = await supabase
    .from("onboarding_tasks")
    .select("order_index")
    .eq("project_id", input.project_id)
    .eq("parent_task_id", input.parent_task_id ?? null)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const order_index = last ? ((last as { order_index: number }).order_index ?? 0) + 1 : 0;

  const { error } = await supabase.from("onboarding_tasks").insert({
    project_id: input.project_id,
    parent_task_id: input.parent_task_id ?? null,
    title: input.title.trim(),
    department: input.department ?? null,
    is_key_date: input.is_key_date ?? false,
    order_index,
    depth,
  });
  if (error) throw error;
  revalidateOnboarding(input.project_id);
}

export async function deleteTask(taskId: string): Promise<void> {
  await requireOnboardingAdmin();
  const supabase = await db();
  const { data: row } = await supabase
    .from("onboarding_tasks")
    .select("project_id")
    .eq("id", taskId)
    .maybeSingle();
  await supabase.from("onboarding_tasks").delete().eq("id", taskId);
  if (row) revalidateOnboarding((row as { project_id: string }).project_id);
}

// ---------------------------------------------------------------------------
// Checklist mutations
// ---------------------------------------------------------------------------

export async function toggleChecklistItem(
  itemId: string,
  isChecked: boolean,
): Promise<void> {
  const email = await requireOnboardingAdmin();
  const supabase = await db();
  const patch: Record<string, unknown> = { is_checked: isChecked };
  if (isChecked) {
    patch.checked_at = new Date().toISOString();
    patch.checked_by = email;
  } else {
    patch.checked_at = null;
    patch.checked_by = null;
  }
  const { data: row, error } = await supabase
    .from("onboarding_checklist_items")
    .update(patch)
    .eq("id", itemId)
    .select("task_id")
    .single();
  if (error) throw error;
  const { data: task } = await supabase
    .from("onboarding_tasks")
    .select("project_id")
    .eq("id", (row as { task_id: string }).task_id)
    .maybeSingle();
  if (task) revalidateOnboarding((task as { project_id: string }).project_id);
}

export async function addChecklistItem(taskId: string, label: string): Promise<void> {
  await requireOnboardingAdmin();
  if (!label.trim()) throw new Error("Label is required");
  const supabase = await db();
  const { data: last } = await supabase
    .from("onboarding_checklist_items")
    .select("order_index")
    .eq("task_id", taskId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const order_index = last ? ((last as { order_index: number }).order_index ?? 0) + 1 : 0;
  await supabase.from("onboarding_checklist_items").insert({
    task_id: taskId,
    label: label.trim(),
    order_index,
  });
  const { data: task } = await supabase
    .from("onboarding_tasks")
    .select("project_id")
    .eq("id", taskId)
    .maybeSingle();
  if (task) revalidateOnboarding((task as { project_id: string }).project_id);
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  await requireOnboardingAdmin();
  const supabase = await db();
  const { data: row } = await supabase
    .from("onboarding_checklist_items")
    .select("task_id")
    .eq("id", itemId)
    .maybeSingle();
  await supabase.from("onboarding_checklist_items").delete().eq("id", itemId);
  if (row) {
    const { data: task } = await supabase
      .from("onboarding_tasks")
      .select("project_id")
      .eq("id", (row as { task_id: string }).task_id)
      .maybeSingle();
    if (task) revalidateOnboarding((task as { project_id: string }).project_id);
  }
}
