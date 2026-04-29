/**
 * GET  /api/v1/me/tasks   — tasks assigned to the actor.
 * POST /api/v1/me/tasks   — create a task on the actor's personal list.
 *
 * Filter params for GET:
 *   ?status=open|done|all   (default: open)
 *   ?limit=N                (default 50, max 200)
 */

import { NextResponse } from "next/server";
import {
  clampLimit,
  jsonError,
  readJson,
  withApi,
} from "@/lib/api-tokens/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi({ scope: "tasks:read" }, async (req, ctx) => {
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") ?? "open").toLowerCase();
  const limit = clampLimit(url.searchParams.get("limit"));

  let q = ctx.admin
    .from("tasks")
    .select(
      "id, list_id, status_id, title, description, priority, due_date, start_date, assignee_ids, tags, archived_at, completed_at, created_at, updated_at",
    )
    .contains("assignee_ids", [ctx.actor.id])
    .is("archived_at", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (status === "open") q = q.is("completed_at", null);
  else if (status === "done") q = q.not("completed_at", "is", null);

  const { data, error } = await q;
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ tasks: data ?? [] });
});

interface CreateMeTaskBody {
  title?: string;
  description?: string | null;
  priority?: "urgent" | "high" | "normal" | "low" | "none";
  due_date?: string | null;
  start_date?: string | null;
  tags?: string[];
}

export const POST = withApi({ scope: "tasks:write" }, async (req, ctx) => {
  const body = await readJson<CreateMeTaskBody>(req);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return jsonError(400, "title is required");
  }

  // Find or create the personal list for the actor.
  const { data: existing } = await ctx.admin
    .from("lists")
    .select("id")
    .eq("personal_owner_id", ctx.actor.id)
    .maybeSingle();

  let listId = existing?.id as string | undefined;
  if (!listId) {
    const { data: created, error: createErr } = await ctx.admin
      .from("lists")
      .insert({
        name: "My Tasks",
        type: "private",
        personal_owner_id: ctx.actor.id,
      })
      .select("id")
      .single();
    if (createErr) return jsonError(500, createErr.message);
    listId = created.id as string;
  }

  // Pick the first 'todo' status if any are configured.
  const { data: firstStatus } = await ctx.admin
    .from("statuses")
    .select("id")
    .eq("list_id", listId)
    .eq("category", "todo")
    .order("order")
    .limit(1)
    .maybeSingle();

  const { data: maxOrder } = await ctx.admin
    .from("tasks")
    .select("order")
    .eq("list_id", listId)
    .is("parent_id", null)
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
      tags: body.tags ?? [],
      status_id: firstStatus?.id ?? null,
      order: ((maxOrder?.order as number | undefined) ?? -1) + 1,
      assignee_ids: [ctx.actor.id],
      created_by: ctx.actor.id,
    })
    .select("*")
    .single();
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ task }, { status: 201 });
});
