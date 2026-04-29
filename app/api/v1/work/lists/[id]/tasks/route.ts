/**
 * GET  /api/v1/work/lists/[id]/tasks   — list tasks in a list (viewer required)
 * POST /api/v1/work/lists/[id]/tasks   — create a task (editor required)
 */

import { NextResponse } from "next/server";
import {
  clampLimit,
  jsonError,
  readJson,
  withApi,
} from "@/lib/api-tokens/route-helpers";
import { hasListAccessFor } from "@/lib/api-tokens/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "tasks:read" }, async (req, ctx, params) => {
  const listId = params.id;
  if (!listId) return jsonError(400, "id required");
  if (!(await hasListAccessFor(ctx.admin, ctx.actor, listId))) {
    return jsonError(404, "List not found");
  }
  const url = new URL(req.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const includeArchived =
    url.searchParams.get("include_archived") === "true";

  let q = ctx.admin
    .from("tasks")
    .select("*")
    .eq("list_id", listId)
    .is("parent_id", null)
    .order("order")
    .limit(limit);
  if (!includeArchived) q = q.is("archived_at", null);

  const { data, error } = await q;
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ tasks: data ?? [] });
});

interface CreateTaskBody {
  title?: string;
  description?: string | null;
  priority?: "urgent" | "high" | "normal" | "low" | "none";
  due_date?: string | null;
  start_date?: string | null;
  status_id?: string | null;
  tags?: string[];
  assignee_ids?: string[];
  parent_id?: string | null;
}

export const POST = withApi({ scope: "tasks:write" }, async (req, ctx, params) => {
  const listId = params.id;
  if (!listId) return jsonError(400, "id required");

  if (!(await hasListAccessFor(ctx.admin, ctx.actor, listId, "editor"))) {
    return jsonError(403, "You don't have edit access to this list");
  }
  const body = await readJson<CreateTaskBody>(req);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return jsonError(400, "title is required");
  }

  let statusId = body.status_id ?? null;
  if (!statusId) {
    const { data: firstStatus } = await ctx.admin
      .from("statuses")
      .select("id")
      .eq("list_id", listId)
      .eq("category", "todo")
      .order("order")
      .limit(1)
      .maybeSingle();
    statusId = firstStatus?.id ?? null;
  }

  const { data: maxOrder } = await ctx.admin
    .from("tasks")
    .select("order")
    .eq("list_id", listId)
    .is("parent_id", body.parent_id ?? null)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: task, error } = await ctx.admin
    .from("tasks")
    .insert({
      list_id: listId,
      title: body.title.trim(),
      description: body.description ?? null,
      priority: body.priority ?? "normal",
      due_date: body.due_date ?? null,
      start_date: body.start_date ?? null,
      status_id: statusId,
      tags: body.tags ?? [],
      assignee_ids: body.assignee_ids ?? [],
      parent_id: body.parent_id ?? null,
      order: ((maxOrder?.order as number | undefined) ?? -1) + 1,
      created_by: ctx.actor.id,
    })
    .select("*")
    .single();
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ task }, { status: 201 });
});
