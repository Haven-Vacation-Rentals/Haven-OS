"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Notification, NotificationKind } from "./types";

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

async function currentUserId(): Promise<string | null> {
  const supabase = await db();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * The signed-in user's most recent notifications. RLS scopes the query
 * to recipient_id = auth.uid() so we don't need an extra filter.
 */
export async function getMyNotifications(
  limit = 50,
): Promise<Notification[]> {
  const supabase = await db();
  const userId = await currentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*, actor:profiles!actor_id(id, full_name, avatar_url)")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function getMyUnreadCount(): Promise<number> {
  const supabase = await db();
  const userId = await currentUserId();
  if (!userId) return 0;
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Mark read / clear
// ---------------------------------------------------------------------------

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = await db();
  const userId = await currentUserId();
  if (!userId) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", userId);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await db();
  const userId = await currentUserId();
  if (!userId) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function deleteNotification(id: string): Promise<void> {
  const supabase = await db();
  const userId = await currentUserId();
  if (!userId) return;
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("recipient_id", userId);
  if (error) throw error;
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Delivery helpers (called from other server actions)
// ---------------------------------------------------------------------------

interface DeliverInput {
  recipientIds: string[];
  actorId: string | null;
  kind: NotificationKind;
  subjectType: "task" | "property" | "system";
  subjectId: string | null;
  subjectUrl: string | null;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Insert one row per recipient. The actor (if also a recipient — e.g.
 * commenting on your own task) is silently skipped so users don't get
 * pinged about their own actions.
 *
 * Failures are logged and swallowed: notifications are best-effort and
 * must never block the underlying action.
 */
export async function deliverNotifications(
  input: DeliverInput,
): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  const recipients = Array.from(
    new Set(input.recipientIds.filter((id) => !!id && id !== input.actorId)),
  );
  if (recipients.length === 0) return;

  const rows = recipients.map((recipient_id) => ({
    recipient_id,
    actor_id: input.actorId,
    kind: input.kind,
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    subject_url: input.subjectUrl,
    title: input.title,
    body: input.body ?? null,
    metadata: input.metadata ?? {},
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) {
    console.error("[notifications] failed to deliver", error);
  }
}

/**
 * Fan-out helper for watcher-based events on a task. Pulls watchers and
 * assignees for the task, then delivers a notification to each.
 */
export async function notifyTaskWatchers(input: {
  taskId: string;
  actorId: string | null;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;

  const [{ data: watchers }, { data: task }] = await Promise.all([
    supabase
      .from("task_watchers")
      .select("profile_id")
      .eq("task_id", input.taskId),
    supabase
      .from("tasks")
      .select("assignee_ids, list_id")
      .eq("id", input.taskId)
      .maybeSingle(),
  ]);

  const recipients = new Set<string>();
  for (const w of watchers ?? []) {
    if (w.profile_id) recipients.add(w.profile_id as string);
  }
  for (const a of (task?.assignee_ids ?? []) as string[]) {
    if (a) recipients.add(a);
  }

  if (recipients.size === 0) return;

  await deliverNotifications({
    recipientIds: [...recipients],
    actorId: input.actorId,
    kind: input.kind,
    subjectType: "task",
    subjectId: input.taskId,
    subjectUrl: `/work/tasks?task=${input.taskId}`,
    title: input.title,
    body: input.body,
    metadata: input.metadata,
  });
}
