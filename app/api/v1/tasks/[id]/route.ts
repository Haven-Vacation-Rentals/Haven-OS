/**
 * GET    /api/v1/tasks/[id]   — view a task (requires viewer access on its list).
 * PATCH  /api/v1/tasks/[id]   — update a task (requires editor access on its list).
 */

import { NextResponse } from "next/server";
import {
  jsonError,
  readJson,
  withApi,
} from "@/lib/api-tokens/route-helpers";
import {
  getListAccessLevelFor,
  hasListAccessFor,
} from "@/lib/api-tokens/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "tasks:read" }, async (_req, ctx, params) => {
  const id = params.id;
  if (!id) return jsonError(400, "id required");

  const { data: task, error } = await ctx.admin
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return jsonError(500, error.message);
  if (!task) return jsonError(404, "Task not found");

  const lvl = await getListAccessLevelFor(ctx.admin, ctx.actor, task.list_id);
  if (!lvl) return jsonError(404, "Task not found");
  return NextResponse.json({ task });
});

interface PatchTaskBody {
  title?: string;
  description?: string | null;
  priority?: "urgent" | "high" | "normal" | "low" | "none";
  due_date?: string | null;
  start_date?: string | null;
  status_id?: string | null;
  tags?: string[];
  assignee_ids?: string[];
  /** Convenience flag — if true, sets completed_at to now(). */
  completed?: boolean;
}

export const PATCH = withApi({ scope: "tasks:write" }, async (req, ctx, params) => {
  const id = params.id;
  if (!id) return jsonError(400, "id required");

  const body = await readJson<PatchTaskBody>(req);
  if (!body) return jsonError(400, "Invalid JSON body");

  const { data: existing } = await ctx.admin
    .from("tasks")
    .select("list_id, status_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return jsonError(404, "Task not found");

  if (!(await hasListAccessFor(ctx.admin, ctx.actor, existing.list_id, "editor"))) {
    return jsonError(403, "You don't have edit access to this task's list");
  }

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.priority !== undefined) update.priority = body.priority;
  if (body.due_date !== undefined) update.due_date = body.due_date;
  if (body.start_date !== undefined) update.start_date = body.start_date;
  if (body.status_id !== undefined) update.status_id = body.status_id;
  if (body.tags !== undefined) update.tags = body.tags;
  if (body.assignee_ids !== undefined) update.assignee_ids = body.assignee_ids;

  if (body.completed === true) {
    update.completed_at = new Date().toISOString();
  } else if (body.completed === false) {
    update.completed_at = null;
  } else if (body.status_id) {
    const { data: status } = await ctx.admin
      .from("statuses")
      .select("category")
      .eq("id", body.status_id)
      .maybeSingle();
    if (status?.category === "done" || status?.category === "closed") {
      update.completed_at = new Date().toISOString();
    } else if (status?.category) {
      update.completed_at = null;
    }
  }

  const { data, error } = await ctx.admin
    .from("tasks")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ task: data });
});
