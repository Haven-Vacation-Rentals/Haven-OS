/**
 * Tool registry for the Haven OS MCP server.
 *
 * Every tool reuses the existing /api/v1 plumbing: PAT auth resolves to a
 * Haven user, scopes restrict what the token can call, and Supabase access
 * helpers ensure the token's actor only sees what they can see in the app.
 *
 * No tool runs raw SQL. Each one wraps a curated, bounded operation.
 */

import { canonicalUrl } from "@/lib/canonical-url";
import { createCaseRaw, updateCaseRaw } from "@/lib/lost-items/actions";
import {
  LOST_ITEM_STATUSES,
  type LostItemStatus,
} from "@/lib/lost-items/types";
import { hasListAccessFor } from "@/lib/api-tokens/access";
import type { McpTool, McpToolCallResult } from "./types";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function ok(data: unknown, text?: string): McpToolCallResult {
  return { data, text };
}

function err(message: string): McpToolCallResult {
  return { isError: true, text: message, data: { error: message } };
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((s): s is string => typeof s === "string");
  return out;
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

function asPosInt(v: unknown, fallback: number, max: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const listTasksTool: McpTool = {
  name: "list_tasks",
  title: "List tasks",
  description:
    "List tasks assigned to the authenticated Haven user. By default returns open (incomplete) tasks ordered by due date. Use the `status` argument to include completed work or to view both.",
  scope: "tasks:read",
  inputSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["open", "done", "all"],
        description:
          "Filter by completion: 'open' = not yet completed (default), 'done' = completed, 'all' = both.",
        default: "open",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 200,
        default: 50,
        description: "Maximum number of tasks to return (1-200, default 50).",
      },
    },
    additionalProperties: false,
  },
  async handler(args, ctx) {
    const status = (asString(args.status) ?? "open").toLowerCase();
    const limit = asPosInt(args.limit, 50, 200);

    let q = ctx.admin
      .from("tasks")
      .select(
        "id, list_id, status_id, title, description, priority, due_date, start_date, assignee_ids, tags, completed_at, created_at, updated_at",
      )
      .contains("assignee_ids", [ctx.actor.id])
      .is("archived_at", null)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(limit);
    if (status === "open") q = q.is("completed_at", null);
    else if (status === "done") q = q.not("completed_at", "is", null);

    const { data, error } = await q;
    if (error) return err(error.message);
    const tasks = data ?? [];
    const summary = tasks.length
      ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} (${status}).`
      : `No ${status} tasks.`;
    return ok({ tasks }, summary);
  },
};

const createTaskTool: McpTool = {
  name: "create_task",
  title: "Create task",
  description:
    "Create a new task on the authenticated user's personal task list (\"My Tasks\"). The task is auto-assigned to the caller. Use this for personal todos surfaced from Claude.",
  scope: "tasks:write",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, description: "Required. Task title." },
      description: { type: "string", description: "Optional longer-form notes." },
      priority: {
        type: "string",
        enum: ["urgent", "high", "normal", "low", "none"],
        default: "normal",
      },
      due_date: {
        type: "string",
        format: "date",
        description: "Optional ISO date (YYYY-MM-DD).",
      },
      start_date: {
        type: "string",
        format: "date",
      },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["title"],
    additionalProperties: false,
  },
  async handler(args, ctx) {
    const title = asString(args.title)?.trim();
    if (!title) return err("title is required");

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
      if (createErr) return err(createErr.message);
      listId = created.id as string;
    }

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
        title,
        description: asString(args.description) ?? null,
        priority: asString(args.priority) ?? "normal",
        due_date: asString(args.due_date) ?? null,
        start_date: asString(args.start_date) ?? null,
        tags: asStringArray(args.tags) ?? [],
        status_id: firstStatus?.id ?? null,
        order: ((maxOrder?.order as number | undefined) ?? -1) + 1,
        assignee_ids: [ctx.actor.id],
        created_by: ctx.actor.id,
      })
      .select("*")
      .single();
    if (error) return err(error.message);
    return ok({ task }, `Created task “${title}”.`);
  },
};

const updateTaskStatusTool: McpTool = {
  name: "update_task_status",
  title: "Update task status",
  description:
    "Update a task: mark complete/incomplete, change priority, set the due date, or move to a specific status_id. Requires editor access on the task's list (the caller's app-level permissions apply).",
  scope: "tasks:write",
  inputSchema: {
    type: "object",
    properties: {
      task_id: { type: "string", description: "The task uuid." },
      completed: {
        type: "boolean",
        description:
          "If true, mark the task as completed (sets completed_at). If false, reopen it.",
      },
      status_id: {
        type: "string",
        description:
          "Optional. Move the task to this status_id (use list_tasks to discover ids).",
      },
      priority: {
        type: "string",
        enum: ["urgent", "high", "normal", "low", "none"],
      },
      due_date: { type: "string", format: "date" },
      title: { type: "string" },
      description: { type: "string" },
    },
    required: ["task_id"],
    additionalProperties: false,
  },
  async handler(args, ctx) {
    const taskId = asString(args.task_id);
    if (!taskId) return err("task_id is required");

    const { data: existing } = await ctx.admin
      .from("tasks")
      .select("list_id")
      .eq("id", taskId)
      .maybeSingle();
    if (!existing) return err("Task not found");

    if (!(await hasListAccessFor(ctx.admin, ctx.actor, existing.list_id as string, "editor"))) {
      return err("You don't have edit access to this task's list");
    }

    const update: Record<string, unknown> = {};
    if (asString(args.title) !== undefined) update.title = asString(args.title);
    if (typeof args.description === "string") update.description = args.description;
    if (asString(args.priority) !== undefined) update.priority = asString(args.priority);
    if (typeof args.due_date !== "undefined")
      update.due_date = asString(args.due_date) ?? null;
    if (asString(args.status_id) !== undefined) update.status_id = asString(args.status_id);

    const completed = asBool(args.completed);
    if (completed === true) update.completed_at = new Date().toISOString();
    else if (completed === false) update.completed_at = null;

    if (Object.keys(update).length === 0) {
      return err("No fields to update — supply at least one of completed/status_id/title/description/priority/due_date.");
    }

    const { data, error } = await ctx.admin
      .from("tasks")
      .update(update)
      .eq("id", taskId)
      .select("*")
      .single();
    if (error) return err(error.message);
    return ok({ task: data }, `Updated task ${taskId}.`);
  },
};

// ---------------------------------------------------------------------------
// Lost Items
// ---------------------------------------------------------------------------

const listLostItemsTool: McpTool = {
  name: "list_lost_items",
  title: "List Lost Items cases",
  description:
    "List Lost Items (guest left-behind item) cases, optionally filtered by status. Default returns the 50 most recent. Statuses: pending_pickup, picked_up, delivered, failed, completed.",
  scope: "lost-items:read",
  inputSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: [...LOST_ITEM_STATUSES],
        description: "Optional status filter.",
      },
      limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
    },
    additionalProperties: false,
  },
  async handler(args, ctx) {
    const status = asString(args.status);
    const limit = asPosInt(args.limit, 50, 200);

    let q = ctx.admin
      .from("lost_items")
      .select(
        "id, case_number, status, item_description, property_name, guest_name, guest_email, follow_up_date, assigned_to, source, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return err(error.message);
    const cases = data ?? [];
    return ok(
      { cases },
      `${cases.length} case${cases.length === 1 ? "" : "s"}${status ? ` (${status})` : ""}.`,
    );
  },
};

const createLostItemTool: McpTool = {
  name: "create_lost_item_case",
  title: "Create Lost Items case",
  description:
    "Open a new Lost Items case for an item left at a property. Requires at minimum item_description. Returns the case (with auto-generated case_number) and a link to it.",
  scope: "lost-items:write",
  inputSchema: {
    type: "object",
    properties: {
      item_description: {
        type: "string",
        minLength: 1,
        description: "What was found (e.g. 'Blue Patagonia jacket, size M').",
      },
      found_location: {
        type: "string",
        description: "Where in the property the item was found.",
      },
      property_id: {
        type: "string",
        description: "Optional Haven property uuid. If unknown, pass property_name instead.",
      },
      property_name: {
        type: "string",
        description: "Property name (used to look up id when property_id is omitted).",
      },
      guest_name: { type: "string" },
      guest_email: { type: "string", format: "email" },
      guest_phone: { type: "string" },
      photo_urls: {
        type: "array",
        items: { type: "string", format: "uri" },
        description: "Photos of the item.",
      },
      notes: { type: "string" },
      cleaning_vendor: { type: "string" },
      follow_up_date: { type: "string", format: "date" },
    },
    required: ["item_description"],
    additionalProperties: false,
  },
  async handler(args, ctx) {
    const description = asString(args.item_description)?.trim();
    if (!description) return err("item_description is required");

    const result = await createCaseRaw(
      {
        item_description: description,
        found_location: asString(args.found_location) ?? null,
        property_id: asString(args.property_id) ?? null,
        property_name: asString(args.property_name) ?? null,
        guest_name: asString(args.guest_name) ?? null,
        guest_email: asString(args.guest_email) ?? null,
        guest_phone: asString(args.guest_phone) ?? null,
        photo_urls: asStringArray(args.photo_urls) ?? [],
        notes: asString(args.notes) ?? null,
        cleaning_vendor: asString(args.cleaning_vendor) ?? null,
        follow_up_date: asString(args.follow_up_date) ?? null,
        source: "external_agent",
        created_by: ctx.actor.id,
      },
      ctx.admin,
    );
    if (!result.ok) return err(result.error);
    const url = canonicalUrl(`/operations/lost-items/${result.data.id}`);
    return ok(
      { case: result.data, url },
      `Opened case ${result.data.case_number}: ${result.data.item_description}.`,
    );
  },
};

const updateLostItemStatusTool: McpTool = {
  name: "update_lost_item_status",
  title: "Update Lost Items status",
  description:
    "Move a Lost Items case to a new status, or update tracking / shipping / notes fields. Accepts either the uuid or case_number (e.g. 'LI-0042').",
  scope: "lost-items:write",
  inputSchema: {
    type: "object",
    properties: {
      case_id: {
        type: "string",
        description: "Case uuid or case_number (e.g. 'LI-0042').",
      },
      status: { type: "string", enum: [...LOST_ITEM_STATUSES] },
      assigned_to: {
        type: "string",
        description: "Profile uuid of the Haven user taking ownership (null to clear).",
      },
      return_method: {
        type: "string",
        enum: ["shipped", "guest_pickup", "in_person", "other"],
      },
      shipping_carrier: { type: "string" },
      shipping_tracking: { type: "string" },
      follow_up_date: { type: "string", format: "date" },
      notes: { type: "string" },
    },
    required: ["case_id"],
    additionalProperties: false,
  },
  async handler(args, ctx) {
    const idOrNumber = asString(args.case_id);
    if (!idOrNumber) return err("case_id is required");

    // Resolve to uuid (mirrors /api/v1/lost-items/[id] route).
    let resolvedId: string | null = null;
    if (/^[0-9a-f-]{36}$/i.test(idOrNumber)) {
      const { data } = await ctx.admin
        .from("lost_items")
        .select("id")
        .eq("id", idOrNumber)
        .maybeSingle();
      if (data) resolvedId = data.id as string;
    }
    if (!resolvedId) {
      const { data } = await ctx.admin
        .from("lost_items")
        .select("id")
        .eq("case_number", idOrNumber)
        .maybeSingle();
      if (data) resolvedId = data.id as string;
    }
    if (!resolvedId) return err("Case not found");

    const patch: Record<string, unknown> = {};
    if (asString(args.status) !== undefined) patch.status = asString(args.status) as LostItemStatus;
    if (typeof args.assigned_to !== "undefined")
      patch.assigned_to = asString(args.assigned_to) ?? null;
    if (asString(args.return_method) !== undefined)
      patch.return_method = asString(args.return_method);
    if (asString(args.shipping_carrier) !== undefined)
      patch.shipping_carrier = asString(args.shipping_carrier);
    if (asString(args.shipping_tracking) !== undefined)
      patch.shipping_tracking = asString(args.shipping_tracking);
    if (typeof args.follow_up_date !== "undefined")
      patch.follow_up_date = asString(args.follow_up_date) ?? null;
    if (typeof args.notes !== "undefined") patch.notes = asString(args.notes) ?? null;

    if (Object.keys(patch).length === 0) {
      return err("No fields to update.");
    }

    const result = await updateCaseRaw(
      resolvedId,
      patch,
      { actor_id: ctx.actor.id },
      ctx.admin,
    );
    if (!result.ok) return err(result.error);
    return ok(
      { case: result.data },
      `Updated case ${result.data.case_number}.`,
    );
  },
};

// ---------------------------------------------------------------------------
// Content Studio (GTM content tracker)
// ---------------------------------------------------------------------------

const CONTENT_STAGES = ["idea", "in_progress", "draft", "complete", "archived"] as const;

const listContentIdeasTool: McpTool = {
  name: "list_content_ideas",
  title: "List Content Studio topics",
  description:
    "List Content Studio topics (the GTM/blog content pipeline). Optionally filter by space_id or stage. Stages: idea → in_progress → draft → complete (plus archived).",
  scope: "content:read",
  inputSchema: {
    type: "object",
    properties: {
      space_id: { type: "string", description: "Filter by Content Studio space uuid." },
      stage: { type: "string", enum: [...CONTENT_STAGES] },
      limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
    },
    additionalProperties: false,
  },
  async handler(args, ctx) {
    const limit = asPosInt(args.limit, 50, 200);
    let q = ctx.admin
      .from("content_topics")
      .select(
        "id, space_id, title, working_title, pillar, stage, priority, target_keyword, due_date, owner_id, created_at, updated_at",
      )
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(limit);
    if (asString(args.space_id)) q = q.eq("space_id", asString(args.space_id));
    if (asString(args.stage)) q = q.eq("stage", asString(args.stage));

    const { data, error } = await q;
    if (error) return err(error.message);
    const topics = data ?? [];
    return ok({ topics }, `${topics.length} topic${topics.length === 1 ? "" : "s"}.`);
  },
};

const createContentIdeaTool: McpTool = {
  name: "create_content_idea",
  title: "Create Content Studio topic",
  description:
    "Add a new topic to a Content Studio space. Defaults to stage='idea'. Use list_content_ideas without filters first to discover space_ids if you don't know one.",
  scope: "content:write",
  inputSchema: {
    type: "object",
    properties: {
      space_id: { type: "string", description: "Required. Content Studio space uuid." },
      title: { type: "string", minLength: 1 },
      pillar: {
        type: "string",
        enum: [
          "market_data",
          "revenue_strategy",
          "operations",
          "industry_insights",
          "haven_performance",
        ],
        description: "Optional content pillar / theme.",
      },
      priority: {
        type: "string",
        enum: ["urgent", "high", "medium", "low"],
      },
      target_keyword: { type: "string" },
      secondary_keywords: { type: "array", items: { type: "string" } },
      due_date: { type: "string", format: "date" },
      angle: { type: "string", description: "Optional editorial angle." },
      hypothesis: { type: "string", description: "Optional hypothesis to test." },
    },
    required: ["space_id", "title"],
    additionalProperties: false,
  },
  async handler(args, ctx) {
    const spaceId = asString(args.space_id);
    const title = asString(args.title)?.trim();
    if (!spaceId) return err("space_id is required");
    if (!title) return err("title is required");

    const insert: Record<string, unknown> = {
      space_id: spaceId,
      title,
      target_keyword: asString(args.target_keyword) ?? null,
      secondary_keywords: asStringArray(args.secondary_keywords) ?? [],
      due_date: asString(args.due_date) ?? null,
      created_by: ctx.actor.id,
    };
    if (asString(args.pillar)) insert.pillar = asString(args.pillar);
    if (asString(args.priority)) insert.priority = asString(args.priority);
    if (asString(args.angle)) insert.angle = asString(args.angle);
    if (asString(args.hypothesis)) insert.hypothesis = asString(args.hypothesis);

    const { data, error } = await ctx.admin
      .from("content_topics")
      .insert(insert)
      .select("*")
      .single();
    if (error) return err(error.message);
    return ok({ topic: data }, `Created content topic “${title}”.`);
  },
};

const updateContentStatusTool: McpTool = {
  name: "update_content_status",
  title: "Update Content Studio topic status",
  description:
    "Update a content topic — most commonly its stage in the pipeline. Stage transitions: idea → in_progress → draft → complete, plus archived. Also accepts due_date, priority, and brief updates.",
  scope: "content:write",
  inputSchema: {
    type: "object",
    properties: {
      topic_id: { type: "string" },
      stage: { type: "string", enum: [...CONTENT_STAGES] },
      priority: {
        type: "string",
        enum: ["urgent", "high", "medium", "low"],
      },
      due_date: { type: "string", format: "date" },
      title: { type: "string" },
      angle: { type: "string" },
      target_keyword: { type: "string" },
    },
    required: ["topic_id"],
    additionalProperties: false,
  },
  async handler(args, ctx) {
    const topicId = asString(args.topic_id);
    if (!topicId) return err("topic_id is required");

    const update: Record<string, unknown> = {};
    if (asString(args.stage)) update.stage = asString(args.stage);
    if (asString(args.priority)) update.priority = asString(args.priority);
    if (typeof args.due_date !== "undefined") update.due_date = asString(args.due_date) ?? null;
    if (asString(args.title)) update.title = asString(args.title);
    if (typeof args.angle !== "undefined") update.angle = asString(args.angle) ?? null;
    if (asString(args.target_keyword)) update.target_keyword = asString(args.target_keyword);

    if (Object.keys(update).length === 0) {
      return err("No fields to update.");
    }

    const { data, error } = await ctx.admin
      .from("content_topics")
      .update(update)
      .eq("id", topicId)
      .select("*")
      .single();
    if (error) return err(error.message);
    return ok({ topic: data }, `Updated content topic ${topicId}.`);
  },
};

// ---------------------------------------------------------------------------
// Profile (helpful for Claude to know who it's acting as)
// ---------------------------------------------------------------------------

const getMeTool: McpTool = {
  name: "get_me",
  title: "Who am I",
  description:
    "Return the authenticated Haven user's profile (id, name, email, role) and the token's effective scopes. Useful for Claude to confirm identity before acting.",
  scope: "me:read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  async handler(_args, ctx) {
    return ok(
      {
        actor: ctx.actor,
        scopes: ctx.scopes,
      },
      `Authenticated as ${ctx.actor.full_name ?? ctx.actor.email ?? ctx.actor.id} (${ctx.actor.role}).`,
    );
  },
};

// Quick lookup helper so Claude can find the right space without trying ids.
const listContentSpacesTool: McpTool = {
  name: "list_content_spaces",
  title: "List Content Studio spaces",
  description: "List Content Studio spaces (used as parent containers for topics).",
  scope: "content:read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  async handler(_args, ctx) {
    const { data, error } = await ctx.admin
      .from("content_spaces")
      .select("id, name, description, created_at")
      .order("created_at", { ascending: true });
    if (error) return err(error.message);
    return ok({ spaces: data ?? [] }, `${(data ?? []).length} space(s).`);
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const MCP_TOOLS: McpTool[] = [
  getMeTool,
  listTasksTool,
  createTaskTool,
  updateTaskStatusTool,
  listLostItemsTool,
  createLostItemTool,
  updateLostItemStatusTool,
  listContentSpacesTool,
  listContentIdeasTool,
  createContentIdeaTool,
  updateContentStatusTool,
];

export const MCP_TOOLS_BY_NAME: Record<string, McpTool> = Object.fromEntries(
  MCP_TOOLS.map((t) => [t.name, t]),
);
