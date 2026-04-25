/**
 * Haven OS Agent Tool Registry
 * ---------------------------------------------------------------------------
 * Single source of truth for all tools exposed to the HavenOS Managed Agent.
 *
 * Each tool has:
 *   - name: exact name the Anthropic agent will emit in agent.custom_tool_use
 *   - description: human-readable, shown to the agent
 *   - input_schema: JSON Schema the agent must match
 *   - execute(input, ctx): actual handler that runs against Supabase / modules
 *
 * The same registry is consumed by:
 *   - scripts/sync-agent-tools.ts (pushes tool defs to the Anthropic console)
 *   - lib/agents/client.ts         (handles agent.custom_tool_use mid-stream)
 */

import * as work from "@/lib/work/actions";
import * as props from "@/lib/properties/actions";
import * as scorecard from "@/lib/scorecard/actions";
import * as hr from "@/lib/hr/actions";
import * as onb from "@/lib/onboarding/actions";
import * as hostaway from "@/lib/hostaway/actions";
import * as admin from "@/lib/admin/actions";
import * as sales from "@/lib/sales/actions";
import { extractListing } from "@/lib/sales/listing-extractor";
import {
  getPermissions,
  requireHrAccess,
  type HavenUserRole,
} from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/user";
import type {
  TaskPriority,
  AssigneeRole,
  ListType,
} from "@/lib/work/types";
import type { PropertyUpdateInput } from "@/lib/properties/types";
import type {
  OnboardingProjectStatus,
  OnboardingTaskStatus,
  OnboardingDepartment,
} from "@/lib/onboarding/types";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type ToolInput = Record<string, unknown>;

export type ToolContext = {
  userId: string | null;
  userEmail: string | null;
};

export type ToolDef = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (input: ToolInput, ctx: ToolContext) => Promise<unknown>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function s(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function sOrNull(v: unknown): string | null | undefined {
  if (v === null) return null;
  if (typeof v === "string") return v;
  return undefined;
}
function n(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
function b(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}
function arr<T = unknown>(v: unknown): T[] | undefined {
  return Array.isArray(v) ? (v as T[]) : undefined;
}

/**
 * Scoped HR access check: throws unless the caller is super_admin or has at
 * least one HR access grant. Individual row-level filtering still happens
 * inside each hr.* action via visibleEmployeeIds / canAccessEmployee.
 */
async function requireHr(_ctx: ToolContext): Promise<void> {
  await requireHrAccess();
}

/** Condense a task for search results. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function summariseTask(t: any) {
  return {
    id: t.id,
    title: t.title,
    priority: t.priority,
    due_date: t.due_date,
    completed: !!t.completed_at,
    list: t.list ? { id: t.list.id, name: t.list.name } : null,
    space: t.space ? { id: t.space.id, name: t.space.name } : null,
    assignees: (t.assignees ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => ({
        profile_id: a.profile_id,
        role: a.role,
        name: a.profile?.full_name ?? a.profile?.email ?? "(unknown)",
      }),
    ),
    status: t.status?.name ?? null,
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const TOOLS: ToolDef[] = [
  // =========================================================================
  // TEAM & CURRENT USER
  // =========================================================================
  {
    name: "get_current_user",
    description:
      "Return the signed-in user (id, email, full name) and whether they are an HR admin or onboarding admin. Always call this first when the user says 'me', 'my', or 'I'.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async (_, ctx) => {
      const u = await getCurrentUser();
      const perm = await getPermissions();
      const isOnbAdmin = await onb.isOnboardingAdmin(ctx.userEmail);
      return {
        id: u?.id ?? null,
        email: u?.email ?? null,
        full_name: u?.name ?? null,
        role: perm.role,
        is_super_admin: perm.is_super_admin,
        is_admin_or_above: perm.is_admin_or_above,
        has_hr_access: perm.has_any_hr_access,
        is_onboarding_admin: isOnbAdmin,
      };
    },
  },
  {
    name: "list_team_members",
    description:
      "List all team members (profiles) with id, full name, email, and avatar. Use before assigning tasks or adding list/space members.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async () => work.getMembers(),
  },

  // =========================================================================
  // WORK — SPACES / FOLDERS / LISTS
  // =========================================================================
  {
    name: "list_spaces",
    description:
      "Return the full space tree — every space with its folders and lists. Use for navigation, or before creating a task when you need a list_id.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async () => work.getSpaceTree(),
  },
  {
    name: "create_space",
    description:
      "Create a new top-level Space (e.g. 'Operations', 'Marketing'). Returns the new space id.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        color: { type: "string", description: "Hex color, e.g. #6366f1" },
        icon: { type: "string" },
      },
      required: ["name"],
    },
    execute: async (input) =>
      work.createSpace({
        name: s(input.name)!,
        description: s(input.description),
        color: s(input.color),
        icon: s(input.icon),
      }),
  },
  {
    name: "create_folder",
    description:
      "Create a folder inside a space. Folders group related lists.",
    input_schema: {
      type: "object",
      properties: {
        space_id: { type: "string" },
        name: { type: "string" },
      },
      required: ["space_id", "name"],
    },
    execute: async (input) =>
      work.createFolder({
        space_id: s(input.space_id)!,
        name: s(input.name)!,
      }),
  },
  {
    name: "create_list",
    description:
      "Create a list inside a space (optionally nested under a folder). List type controls visibility: private (owner only), shared (list members only), public (anyone in space).",
    input_schema: {
      type: "object",
      properties: {
        space_id: { type: "string" },
        name: { type: "string" },
        folder_id: {
          type: "string",
          description: "Optional parent folder id.",
        },
        description: { type: "string" },
        type: {
          type: "string",
          enum: ["private", "shared", "public"],
          description: "Default shared.",
        },
      },
      required: ["space_id", "name"],
    },
    execute: async (input) =>
      work.createList({
        space_id: s(input.space_id)!,
        name: s(input.name)!,
        folder_id: s(input.folder_id),
        description: s(input.description),
        type: s(input.type) as ListType | undefined,
      }),
  },

  // =========================================================================
  // WORK — TASKS
  // =========================================================================
  {
    name: "list_tasks",
    description:
      "Global task search across all spaces/lists. Filter by keyword, priority, due range, assignees, list ids, space ids, status category. Returns up to `limit` tasks (default 25, max 100) with list + space + assignees summarised.",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string" },
        due: {
          type: "string",
          enum: ["all", "overdue", "today", "this_week", "none"],
        },
        priorities: {
          type: "array",
          items: {
            type: "string",
            enum: ["urgent", "high", "normal", "low", "none"],
          },
        },
        assignee_ids: { type: "array", items: { type: "string" } },
        list_ids: { type: "array", items: { type: "string" } },
        space_ids: { type: "array", items: { type: "string" } },
        include_completed: { type: "boolean" },
        include_archived: { type: "boolean" },
        limit: { type: "number" },
      },
      required: [],
    },
    execute: async (input) => {
      const limit = Math.min(n(input.limit) ?? 25, 100);
      const tasks = await work.getGlobalTasks({
        search: s(input.search),
        due: s(input.due) as
          | "all"
          | "overdue"
          | "today"
          | "this_week"
          | "none"
          | undefined,
        priorities: arr<TaskPriority>(input.priorities),
        assignee_ids: arr<string>(input.assignee_ids),
        list_ids: arr<string>(input.list_ids),
        space_ids: arr<string>(input.space_ids),
        include_completed: b(input.include_completed) ?? false,
        include_archived: b(input.include_archived) ?? false,
      });
      return tasks.slice(0, limit).map(summariseTask);
    },
  },
  {
    name: "get_my_tasks",
    description:
      "Tasks assigned to the signed-in user. Useful for 'what do I have on my plate?' questions.",
    input_schema: {
      type: "object",
      properties: {
        due: {
          type: "string",
          enum: ["all", "overdue", "today", "this_week"],
        },
        include_completed: { type: "boolean" },
      },
      required: [],
    },
    execute: async (input, ctx) => {
      if (!ctx.userId) throw new Error("Not signed in.");
      const tasks = await work.getGlobalTasks({
        assignee_ids: [ctx.userId],
        due: s(input.due) as
          | "all"
          | "overdue"
          | "today"
          | "this_week"
          | undefined,
        include_completed: b(input.include_completed) ?? false,
      });
      return tasks.map(summariseTask);
    },
  },
  {
    name: "get_task",
    description:
      "Full details for a single task: description, status, priority, due date, assignees, subtasks, comments.",
    input_schema: {
      type: "object",
      properties: { task_id: { type: "string" } },
      required: ["task_id"],
    },
    execute: async (input) => work.getTask(s(input.task_id)!),
  },
  {
    name: "create_task",
    description:
      "Create a new task in a list. You MUST have a list_id — use list_spaces first if unsure.",
    input_schema: {
      type: "object",
      properties: {
        list_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        priority: {
          type: "string",
          enum: ["urgent", "high", "normal", "low", "none"],
        },
        due_date: { type: "string", description: "ISO 8601, e.g. 2025-05-15" },
        start_date: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        parent_id: {
          type: "string",
          description: "Parent task id to create a subtask.",
        },
      },
      required: ["list_id", "title"],
    },
    execute: async (input) =>
      work.createTask({
        list_id: s(input.list_id)!,
        title: s(input.title)!,
        description: s(input.description),
        priority: s(input.priority) as TaskPriority | undefined,
        due_date: s(input.due_date),
        start_date: s(input.start_date),
        tags: arr<string>(input.tags),
        parent_id: s(input.parent_id),
      }),
  },
  {
    name: "update_task",
    description:
      "Update fields on an existing task. Only include fields you want to change. Pass completed=true to mark complete (sets completed_at), completed=false to reopen.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        priority: {
          type: "string",
          enum: ["urgent", "high", "normal", "low", "none"],
        },
        due_date: { type: "string" },
        start_date: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        completed: { type: "boolean" },
      },
      required: ["task_id"],
    },
    execute: async (input) => {
      const patch: Record<string, unknown> = {};
      if (s(input.title) !== undefined) patch.title = s(input.title);
      if (s(input.description) !== undefined)
        patch.description = s(input.description);
      if (s(input.priority) !== undefined) patch.priority = s(input.priority);
      if (sOrNull(input.due_date) !== undefined)
        patch.due_date = sOrNull(input.due_date);
      if (sOrNull(input.start_date) !== undefined)
        patch.start_date = sOrNull(input.start_date);
      if (arr<string>(input.tags) !== undefined) patch.tags = input.tags;
      if (b(input.completed) === true)
        patch.completed_at = new Date().toISOString();
      if (b(input.completed) === false) patch.completed_at = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await work.updateTask(s(input.task_id)!, patch as any);
      return { ok: true };
    },
  },
  {
    name: "delete_task",
    description:
      "Permanently delete a task. IRREVERSIBLE — confirm with the user first unless they have already explicitly asked to delete.",
    input_schema: {
      type: "object",
      properties: { task_id: { type: "string" } },
      required: ["task_id"],
    },
    execute: async (input) => {
      await work.deleteTask(s(input.task_id)!);
      return { ok: true };
    },
  },
  {
    name: "duplicate_task",
    description: "Duplicate a task (title + all fields).",
    input_schema: {
      type: "object",
      properties: { task_id: { type: "string" } },
      required: ["task_id"],
    },
    execute: async (input) => work.duplicateTask(s(input.task_id)!),
  },
  {
    name: "add_task_comment",
    description: "Add a comment / note to a task.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        body: { type: "string" },
      },
      required: ["task_id", "body"],
    },
    execute: async (input) => {
      await work.addComment(s(input.task_id)!, s(input.body)!);
      return { ok: true };
    },
  },
  {
    name: "assign_task",
    description:
      "Assign a team member to a task. role='primary' makes them the primary owner (demotes any existing primary to secondary); role='secondary' (default) adds them as an additional assignee.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        profile_id: { type: "string" },
        role: { type: "string", enum: ["primary", "secondary"] },
      },
      required: ["task_id", "profile_id"],
    },
    execute: async (input) => {
      const taskId = s(input.task_id)!;
      const profileId = s(input.profile_id)!;
      const role = (s(input.role) as AssigneeRole | undefined) ?? "secondary";
      if (role === "primary") {
        await work.setPrimaryAssignee(taskId, profileId);
      } else {
        await work.addAssignee(taskId, profileId, role);
      }
      return { ok: true };
    },
  },
  {
    name: "unassign_task",
    description: "Remove a team member from a task's assignees.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        profile_id: { type: "string" },
      },
      required: ["task_id", "profile_id"],
    },
    execute: async (input) => {
      await work.removeAssignee(s(input.task_id)!, s(input.profile_id)!);
      return { ok: true };
    },
  },

  // =========================================================================
  // PROPERTIES (PDM)
  // =========================================================================
  {
    name: "list_properties",
    description:
      "List vacation rental properties with filters. Default returns up to 50.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["live", "onboarding", "paused", "offboarding", "offboarded"],
        },
        tier: {
          type: "string",
          enum: ["top", "key", "normal", "junior", "low"],
        },
        search: { type: "string", description: "Match on name or address." },
        limit: { type: "number" },
      },
      required: [],
    },
    execute: async (input) => {
      const all = await props.getProperties();
      const status = s(input.status);
      const tier = s(input.tier);
      const search = s(input.search)?.toLowerCase();
      const limit = Math.min(n(input.limit) ?? 50, 200);
      let filtered = all;
      if (status) filtered = filtered.filter((p) => p.status === status);
      if (tier) filtered = filtered.filter((p) => p.tier === tier);
      if (search) {
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(search) ||
            (p.address?.toLowerCase().includes(search) ?? false),
        );
      }
      return filtered.slice(0, limit);
    },
  },
  {
    name: "get_property",
    description:
      "Full detail for one property — address, access codes, vendors, platform links, team, notes.",
    input_schema: {
      type: "object",
      properties: { property_id: { type: "string" } },
      required: ["property_id"],
    },
    execute: async (input) => props.getProperty(s(input.property_id)!),
  },
  {
    name: "update_property",
    description:
      "Update any field on a property — status, tier, AM/RM, access codes, platform links, notes, bed counts, etc. Pass only the fields you want to change. The `fields` object accepts any column from the Property type.",
    input_schema: {
      type: "object",
      properties: {
        property_id: { type: "string" },
        fields: {
          type: "object",
          description:
            "Partial Property. Common keys: name, status, tier, priority, account_manager, revenue_manager, address, region, bedroom_count, bathroom_count_full, bathroom_count_half, king_beds, queen_beds, full_beds, notes, currently_hosting (bool), sales_status. Dates: YYYY-MM-DD. Set null to clear.",
          additionalProperties: true,
        },
      },
      required: ["property_id", "fields"],
    },
    execute: async (input) => {
      const propId = s(input.property_id)!;
      const fields = (input.fields ?? {}) as PropertyUpdateInput;
      return props.updateProperty(propId, fields);
    },
  },
  {
    name: "archive_property",
    description:
      "Archive a property (soft delete — sets archived flag). IRREVERSIBLE through the UI — confirm with the user first.",
    input_schema: {
      type: "object",
      properties: { property_id: { type: "string" } },
      required: ["property_id"],
    },
    execute: async (input) => {
      await props.archiveProperty(s(input.property_id)!);
      return { ok: true };
    },
  },
  {
    name: "get_property_facets",
    description:
      "Return the distinct values available for property filters: account managers, revenue managers, regions, airbnb accounts. Useful when the agent needs to know the valid options before filtering or updating.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async () => props.getPropertyFacets(),
  },

  // =========================================================================
  // SCORECARD
  // =========================================================================
  {
    name: "get_active_scorecard",
    description:
      "Current active month's Northstar scorecard — all sections, metrics, weekly values, targets, actuals, and red/yellow/green statuses.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async () => scorecard.getActiveMonth(),
  },
  {
    name: "list_scorecard_months",
    description: "List all scorecard months (active + archived) with labels.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async () => scorecard.listMonths(),
  },
  {
    name: "get_scorecard_month",
    description: "Fetch a specific scorecard month by id.",
    input_schema: {
      type: "object",
      properties: { month_id: { type: "string" } },
      required: ["month_id"],
    },
    execute: async (input) => scorecard.getMonth(s(input.month_id)!),
  },
  {
    name: "update_scorecard_cell",
    description:
      "Update a single cell in a scorecard row — weekly value, note, monthly target/actual, status (green/yellow/red), metric owner, source, or notes. Pass null as value to clear.",
    input_schema: {
      type: "object",
      properties: {
        row_id: { type: "string" },
        field: {
          type: "string",
          enum: [
            "week1_value",
            "week2_value",
            "week3_value",
            "week4_value",
            "remainder_value",
            "week1_note",
            "week2_note",
            "week3_note",
            "week4_note",
            "remainder_note",
            "monthly_target",
            "monthly_actual",
            "metric_type",
            "status",
            "metric_owner",
            "metric_source",
            "notes",
          ],
        },
        value: {
          type: ["string", "null"],
          description:
            "New value as string. For status use 'green' | 'yellow' | 'red'. Pass null to clear.",
        },
      },
      required: ["row_id", "field"],
    },
    execute: async (input) => {
      await scorecard.updateRowCell(
        s(input.row_id)!,
        s(input.field)!,
        sOrNull(input.value) ?? null,
      );
      return { ok: true };
    },
  },
  {
    name: "seed_active_scorecard",
    description:
      "Seed the current month's scorecard from the template if none exists. No-op if one is already active.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async () => scorecard.seedActiveMonth(),
  },
  {
    name: "archive_active_scorecard",
    description:
      "Archive the currently active scorecard month (closes it). Use at month-end. Confirm with the user first.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async () => scorecard.archiveActiveMonth(),
  },

  // =========================================================================
  // ONBOARDING
  // =========================================================================
  {
    name: "list_onboarding_projects",
    description:
      "List property onboarding projects, optionally filtered by status.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: [
            "onboarding",
            "owner_relations_onboarding",
            "ready_to_pass",
            "done",
            "no_longer_onboarding",
            "on_hold",
          ],
        },
        search: { type: "string" },
      },
      required: [],
    },
    execute: async (input) => {
      const all = await onb.listProjects({
        status: s(input.status) as OnboardingProjectStatus | undefined,
      });
      const search = s(input.search)?.toLowerCase();
      if (!search) return all;
      return all.filter(
        (p) =>
          p.property_nickname.toLowerCase().includes(search) ||
          (p.owner_name?.toLowerCase().includes(search) ?? false) ||
          (p.owner_email?.toLowerCase().includes(search) ?? false),
      );
    },
  },
  {
    name: "get_onboarding_project",
    description:
      "Get a single onboarding project summary by id. Use get_onboarding_tree for the full tree with tasks + checklists.",
    input_schema: {
      type: "object",
      properties: { project_id: { type: "string" } },
      required: ["project_id"],
    },
    execute: async (input) => onb.getProject(s(input.project_id)!),
  },
  {
    name: "get_onboarding_tree",
    description:
      "Full onboarding project tree — all tasks, subtasks, and checklist items with current status. Use this to find specific task_ids before updating them.",
    input_schema: {
      type: "object",
      properties: { project_id: { type: "string" } },
      required: ["project_id"],
    },
    execute: async (input) => onb.getProjectTree(s(input.project_id)!),
  },
  {
    name: "create_onboarding_project",
    description:
      "Kick off a new onboarding project from the default template. Returns the new project id. Requires onboarding admin.",
    input_schema: {
      type: "object",
      properties: {
        property_nickname: { type: "string" },
        owner_name: { type: "string" },
        owner_email: { type: "string" },
        owner_phone: { type: "string" },
        start_date: { type: "string" },
      },
      required: ["property_nickname"],
    },
    execute: async (input) =>
      onb.createProjectFromTemplate({
        property_nickname: s(input.property_nickname)!,
        owner_name: s(input.owner_name),
        owner_email: s(input.owner_email),
        owner_phone: s(input.owner_phone),
        start_date: s(input.start_date),
      }),
  },
  {
    name: "update_onboarding_project",
    description:
      "Update top-level fields on an onboarding project. Can change status, owner info, key dates, slack channel, folder URL, and notes.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        fields: {
          type: "object",
          description:
            "Partial project. Keys: property_nickname, status (onboarding|owner_relations_onboarding|ready_to_pass|done|no_longer_onboarding|on_hold), owner_name, owner_email, owner_phone, start_date, target_open_date, actual_open_date, slack_channel, owner_profile_folder_url, notes.",
          additionalProperties: true,
        },
      },
      required: ["project_id", "fields"],
    },
    execute: async (input) => {
      const fields = (input.fields ?? {}) as Parameters<
        typeof onb.updateProject
      >[1];
      await onb.updateProject(s(input.project_id)!, fields);
      return { ok: true };
    },
  },
  {
    name: "set_onboarding_task_status",
    description:
      "Set the status of an onboarding task (not_started / in_progress / blocked / done / na).",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        status: {
          type: "string",
          enum: ["not_started", "in_progress", "blocked", "done", "na"],
        },
      },
      required: ["task_id", "status"],
    },
    execute: async (input) => {
      await onb.updateTaskStatus(
        s(input.task_id)!,
        s(input.status) as OnboardingTaskStatus,
      );
      return { ok: true };
    },
  },
  {
    name: "toggle_onboarding_checklist_item",
    description:
      "Check or uncheck a single checklist item within an onboarding task.",
    input_schema: {
      type: "object",
      properties: {
        item_id: { type: "string" },
        is_checked: { type: "boolean" },
      },
      required: ["item_id", "is_checked"],
    },
    execute: async (input) => {
      await onb.toggleChecklistItem(s(input.item_id)!, !!input.is_checked);
      return { ok: true };
    },
  },
  {
    name: "add_onboarding_checklist_item",
    description: "Add a new checklist item under an onboarding task.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        label: { type: "string" },
      },
      required: ["task_id", "label"],
    },
    execute: async (input) => {
      await onb.addChecklistItem(s(input.task_id)!, s(input.label)!);
      return { ok: true };
    },
  },
  {
    name: "add_onboarding_task",
    description:
      "Add an ad-hoc task to an onboarding project (not part of the template).",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        title: { type: "string" },
        parent_task_id: {
          type: "string",
          description: "Optional parent task to nest under.",
        },
        department: {
          type: "string",
          enum: [
            "onboarding",
            "owner_relations",
            "revenue",
            "cleaning",
            "guest_comms",
            "finance",
            "dispatch",
            "sales",
            "maintenance",
            "runner",
            "leadership",
            "haven",
            "tendwell",
            "stillwater",
          ],
        },
        is_key_date: { type: "boolean" },
      },
      required: ["project_id", "title"],
    },
    execute: async (input) => {
      await onb.addAdHocTask({
        project_id: s(input.project_id)!,
        title: s(input.title)!,
        parent_task_id: sOrNull(input.parent_task_id) ?? null,
        department: s(input.department) as OnboardingDepartment | undefined,
        is_key_date: b(input.is_key_date),
      });
      return { ok: true };
    },
  },
  {
    name: "update_onboarding_task",
    description:
      "Update any editable field on an onboarding task — title, description, department, due date, assignee email, key-date flag, or notes. Use set_onboarding_task_status for status changes.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        fields: {
          type: "object",
          additionalProperties: true,
          description:
            "Partial task. Keys: title, description, department (onboarding|owner_relations|revenue|cleaning|guest_comms|finance|dispatch|sales|maintenance|runner|leadership|haven|tendwell|stillwater or null), due_date (YYYY-MM-DD or null), assignee_email, is_key_date (boolean), notes.",
        },
      },
      required: ["task_id", "fields"],
    },
    execute: async (input) => {
      const fields = (input.fields ?? {}) as Parameters<typeof onb.updateTask>[1];
      await onb.updateTask(s(input.task_id)!, fields);
      return { ok: true };
    },
  },
  {
    name: "delete_onboarding_task",
    description:
      "Permanently delete an onboarding task (and all its children + checklist items). IRREVERSIBLE — confirm with the user before calling.",
    input_schema: {
      type: "object",
      properties: { task_id: { type: "string" } },
      required: ["task_id"],
    },
    execute: async (input) => {
      await onb.deleteTask(s(input.task_id)!);
      return { ok: true };
    },
  },
  {
    name: "delete_onboarding_checklist_item",
    description: "Delete a single checklist item from an onboarding task.",
    input_schema: {
      type: "object",
      properties: { item_id: { type: "string" } },
      required: ["item_id"],
    },
    execute: async (input) => {
      await onb.deleteChecklistItem(s(input.item_id)!);
      return { ok: true };
    },
  },
  {
    name: "delete_onboarding_project",
    description:
      "Permanently delete an entire onboarding project along with all its tasks and checklist items. IRREVERSIBLE — always confirm with the user first. Prefer update_onboarding_project with status='no_longer_onboarding' for soft-archive.",
    input_schema: {
      type: "object",
      properties: { project_id: { type: "string" } },
      required: ["project_id"],
    },
    execute: async (input) => {
      await onb.deleteProject(s(input.project_id)!);
      return { ok: true };
    },
  },
  {
    name: "list_onboarding_projects_with_stats",
    description:
      "List every onboarding project with rollup stats embedded (percentComplete, done/inProgress/blocked/notStarted counts, next upcoming key date, overdueKeyDates, lastActivity). Use this to answer questions like 'which properties are behind?', 'what's blocking us?', 'whose target open date is closest?'.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async () => onb.listProjectsWithStats(),
  },

  // =========================================================================
  // HR — EMPLOYEES (admin only)
  // =========================================================================
  {
    name: "list_employees",
    description: "List all employees. HR admin only.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async (_, ctx) => {
      await requireHr(ctx);
      return hr.listEmployees();
    },
  },
  {
    name: "get_employee",
    description:
      "Full employee detail. HR admin only. Use list_reviews/list_issues for sub-data.",
    input_schema: {
      type: "object",
      properties: { employee_id: { type: "string" } },
      required: ["employee_id"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      return hr.getEmployee(s(input.employee_id)!);
    },
  },
  {
    name: "create_employee",
    description: "Create a new employee record. HR admin only.",
    input_schema: {
      type: "object",
      properties: {
        full_name: { type: "string" },
        email: { type: "string" },
        role_title: { type: "string" },
        department: { type: "string" },
        start_date: { type: "string" },
        status: { type: "string" },
        notes: { type: "string" },
      },
      required: ["full_name"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      return hr.createEmployee({
        full_name: s(input.full_name)!,
        email: s(input.email),
        role_title: s(input.role_title),
        department: s(input.department),
        start_date: s(input.start_date),
        status: s(input.status),
        notes: s(input.notes),
      });
    },
  },
  {
    name: "update_employee",
    description: "Update fields on an employee record. HR admin only.",
    input_schema: {
      type: "object",
      properties: {
        employee_id: { type: "string" },
        fields: {
          type: "object",
          additionalProperties: true,
          description:
            "Partial: full_name, email, role_title, department, start_date, status, notes, avatar_url.",
        },
      },
      required: ["employee_id", "fields"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      await hr.updateEmployee(
        s(input.employee_id)!,
        (input.fields ?? {}) as Parameters<typeof hr.updateEmployee>[1],
      );
      return { ok: true };
    },
  },
  {
    name: "delete_employee",
    description:
      "Permanently delete an employee record. HR admin only. IRREVERSIBLE — confirm with user first.",
    input_schema: {
      type: "object",
      properties: { employee_id: { type: "string" } },
      required: ["employee_id"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      await hr.deleteEmployee(s(input.employee_id)!);
      return { ok: true };
    },
  },

  // ---- Reviews ----------------------------------------------------------
  {
    name: "list_employee_reviews",
    description: "List performance reviews for an employee. HR admin only.",
    input_schema: {
      type: "object",
      properties: { employee_id: { type: "string" } },
      required: ["employee_id"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      return hr.listReviews(s(input.employee_id)!);
    },
  },
  {
    name: "create_employee_review",
    description: "Create a new performance review. HR admin only.",
    input_schema: {
      type: "object",
      properties: {
        employee_id: { type: "string" },
        review_date: { type: "string" },
        rating: { type: "string" },
        summary: { type: "string" },
        goals: { type: "string" },
      },
      required: ["employee_id"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      await hr.createReview({
        employee_id: s(input.employee_id)!,
        review_date: s(input.review_date),
        rating: s(input.rating),
        summary: s(input.summary),
        goals: s(input.goals),
      });
      return { ok: true };
    },
  },

  // ---- Issues / write-ups ----------------------------------------------
  {
    name: "list_employee_issues",
    description:
      "List issues (write-ups, commendations, PIPs) for an employee. HR admin only.",
    input_schema: {
      type: "object",
      properties: { employee_id: { type: "string" } },
      required: ["employee_id"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      return hr.listIssues(s(input.employee_id)!);
    },
  },
  {
    name: "create_employee_issue",
    description:
      "Log an issue (write-up, commendation, etc.) against an employee. HR admin only.",
    input_schema: {
      type: "object",
      properties: {
        employee_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
        severity: { type: "string" },
        status: { type: "string" },
        reported_date: { type: "string" },
      },
      required: ["employee_id", "title"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      await hr.createIssue({
        employee_id: s(input.employee_id)!,
        title: s(input.title)!,
        description: s(input.description),
        category: s(input.category),
        severity: s(input.severity),
        status: s(input.status),
        reported_date: s(input.reported_date),
      });
      return { ok: true };
    },
  },

  // ---- Hiring: roles + candidates --------------------------------------
  {
    name: "list_roles",
    description: "List open/closed roles (hiring pipeline). HR admin only.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async (_, ctx) => {
      await requireHr(ctx);
      return hr.listRoles();
    },
  },
  {
    name: "create_role",
    description: "Create a new open role. HR admin only.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        department: { type: "string" },
        location: { type: "string" },
        employment_type: { type: "string" },
        description: { type: "string" },
        responsibilities: { type: "string" },
        perks: { type: "string" },
        status: { type: "string" },
      },
      required: ["title"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      await hr.createRole({
        title: s(input.title)!,
        department: s(input.department),
        location: s(input.location),
        employment_type: s(input.employment_type),
        description: s(input.description),
        responsibilities: s(input.responsibilities),
        perks: s(input.perks),
        status: s(input.status),
      });
      return { ok: true };
    },
  },
  {
    name: "list_candidates",
    description: "List candidates for a role. HR admin only.",
    input_schema: {
      type: "object",
      properties: { role_id: { type: "string" } },
      required: ["role_id"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      return hr.listCandidates(s(input.role_id)!);
    },
  },
  {
    name: "create_candidate",
    description: "Add a candidate to a role. HR admin only.",
    input_schema: {
      type: "object",
      properties: {
        role_id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        resume_url: { type: "string" },
        cover_letter: { type: "string" },
        source: { type: "string" },
        stage: { type: "string" },
      },
      required: ["role_id", "name"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      await hr.createCandidate({
        role_id: s(input.role_id)!,
        name: s(input.name)!,
        email: s(input.email),
        phone: s(input.phone),
        resume_url: s(input.resume_url),
        cover_letter: s(input.cover_letter),
        source: s(input.source),
        stage: s(input.stage),
      });
      return { ok: true };
    },
  },
  {
    name: "update_candidate_stage",
    description:
      "Move a candidate to a different hiring stage. HR admin only.",
    input_schema: {
      type: "object",
      properties: {
        candidate_id: { type: "string" },
        stage: { type: "string" },
        role_id: { type: "string" },
      },
      required: ["candidate_id", "stage", "role_id"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      await hr.updateCandidateStage(
        s(input.candidate_id)!,
        s(input.stage)!,
        s(input.role_id)!,
      );
      return { ok: true };
    },
  },

  // ---- HR Docs ---------------------------------------------------------
  {
    name: "list_hr_docs",
    description: "List HR policy or procedure docs. HR admin only.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["policy", "procedure"] },
      },
      required: ["kind"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      return hr.listDocs(s(input.kind) as "policy" | "procedure");
    },
  },
  {
    name: "create_hr_doc",
    description: "Create a policy or procedure doc. HR admin only.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["policy", "procedure"] },
        title: { type: "string" },
        body: { type: "string" },
      },
      required: ["kind", "title"],
    },
    execute: async (input, ctx) => {
      await requireHr(ctx);
      await hr.createDoc({
        kind: s(input.kind) as "policy" | "procedure",
        title: s(input.title)!,
        body: s(input.body),
      });
      return { ok: true };
    },
  },

  // =========================================================================
  // ADMIN — users, roles, departments, HR grants (super admin only)
  // =========================================================================
  {
    name: "list_users",
    description:
      "List all Haven OS users with their id, email, full name, and role (user / admin / super_admin). Super-admin only.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async () => admin.listUsers(),
  },
  {
    name: "set_user_role",
    description:
      "Change a user's role. Valid roles: 'user' (Work/Properties/Onboarding), 'admin' (everything except HR & user management), 'super_admin' (full access). You cannot demote yourself. Super-admin only.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
        role: { type: "string", enum: ["user", "admin", "super_admin"] },
      },
      required: ["user_id", "role"],
    },
    execute: async (input) => {
      await admin.setUserRole(s(input.user_id)!, s(input.role) as HavenUserRole);
      return { ok: true };
    },
  },
  {
    name: "create_user",
    description:
      "Add a new Haven OS user. Two modes: 'invite' (default) sends a Supabase magic-link email so the new user confirms and sets their own password \u2014 the typical onboarding path; 'direct' creates the account immediately with a provided password (for service accounts or when email isn't desired). Role defaults to 'user' if not specified. Super-admin only. Returns the created user record.",
    input_schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "User's email address.",
        },
        full_name: {
          type: "string",
          description: "Optional. The user's full display name.",
        },
        role: {
          type: "string",
          enum: ["user", "admin", "super_admin"],
          description: "Defaults to 'user'.",
        },
        mode: {
          type: "string",
          enum: ["invite", "direct"],
          description:
            "Defaults to 'invite'. Use 'direct' only when the user explicitly asks to skip email and provides a password.",
        },
        password: {
          type: "string",
          description:
            "Required when mode='direct'. Must be at least 8 characters.",
        },
      },
      required: ["email"],
    },
    execute: async (input) => {
      return admin.createUserOrThrow({
        email: s(input.email)!,
        full_name: s(input.full_name),
        role: s(input.role) as HavenUserRole | undefined,
        mode: s(input.mode) as "invite" | "direct" | undefined,
        password: s(input.password),
      });
    },
  },
  {
    name: "delete_user",
    description:
      "Permanently delete a Haven OS user (auth account + profile). IRREVERSIBLE \u2014 confirm with the user before calling. You cannot delete yourself. Super-admin only.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
      },
      required: ["user_id"],
    },
    execute: async (input) => {
      await admin.deleteUser(s(input.user_id)!);
      return { ok: true };
    },
  },
  {
    name: "list_departments",
    description:
      "List all departments (id, name, slug, archived). Available to any signed-in user.",
    input_schema: {
      type: "object",
      properties: {
        include_archived: { type: "boolean" },
      },
      required: [],
    },
    execute: async (input) => admin.listDepartments(b(input.include_archived) ?? false),
  },
  {
    name: "create_department",
    description: "Create a new department. Super-admin only.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
      required: ["name"],
    },
    execute: async (input) =>
      admin.createDepartment({
        name: s(input.name)!,
        description: s(input.description),
      }),
  },
  {
    name: "update_department",
    description: "Rename, archive, or change sort order of a department. Super-admin only.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        archived: { type: "boolean" },
        sort_order: { type: "number" },
      },
      required: ["id"],
    },
    execute: async (input) => {
      await admin.updateDepartment(s(input.id)!, {
        name: s(input.name),
        description: sOrNull(input.description) ?? undefined,
        archived: b(input.archived),
        sort_order: n(input.sort_order),
      });
      return { ok: true };
    },
  },
  {
    name: "list_hr_access_grants",
    description:
      "List all HR access grants (who can see whose HR records). Optionally filter by grantee user id. Super-admin only.",
    input_schema: {
      type: "object",
      properties: {
        grantee_id: { type: "string" },
      },
      required: [],
    },
    execute: async (input) =>
      admin.listHrAccessGrants({ grantee_id: s(input.grantee_id) }),
  },
  {
    name: "grant_hr_access",
    description:
      "Give a user HR access. scope='all' grants access to every employee; scope='department' requires department_id; scope='employee' requires employee_id. Super-admin only.",
    input_schema: {
      type: "object",
      properties: {
        grantee_id: { type: "string" },
        scope: { type: "string", enum: ["all", "department", "employee"] },
        department_id: { type: "string" },
        employee_id: { type: "string" },
        note: { type: "string" },
      },
      required: ["grantee_id", "scope"],
    },
    execute: async (input) => {
      await admin.grantHrAccess({
        grantee_id: s(input.grantee_id)!,
        scope: s(input.scope) as "all" | "department" | "employee",
        department_id: s(input.department_id),
        employee_id: s(input.employee_id),
        note: s(input.note),
      });
      return { ok: true };
    },
  },
  {
    name: "revoke_hr_access",
    description: "Revoke a specific HR access grant by id. Super-admin only.",
    input_schema: {
      type: "object",
      properties: {
        grant_id: { type: "string" },
      },
      required: ["grant_id"],
    },
    execute: async (input) => {
      await admin.revokeHrAccess(s(input.grant_id)!);
      return { ok: true };
    },
  },

  // =========================================================================
  // SALES — PROPERTY PITCHES
  // =========================================================================
  {
    name: "extract_listing_details",
    description:
      "Fetch a Zillow / Airbnb / VRBO / Booking listing URL and extract address, beds, baths, sleeps, and a hero photo. Use this BEFORE create_sales_pitch when the user gives you a listing URL so you can pre-fill what we know. Returns ok=false (with reason) if the site blocked the fetch — in that case ask the user for the missing fields.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Public listing URL." },
      },
      required: ["url"],
    },
    execute: async (input) => extractListing(s(input.url)!),
  },
  {
    name: "create_sales_pitch",
    description:
      "Create a new Haven property pitch — a personalized one-pager at /pitch/<slug> that we send to a prospective property owner. The pitch expires 30 days after creation. Required: owner_name, property_address, projection_low, projection_high (annual gross revenue range, USD). All other fields are optional but a listing_url + hero_image_url makes the pitch much better. Returns the new pitch with its public URL slug.",
    input_schema: {
      type: "object",
      properties: {
        owner_name: { type: "string" },
        owner_email: { type: "string" },
        property_address: { type: "string" },
        listing_url: { type: "string" },
        listing_source: {
          type: "string",
          enum: ["zillow", "airbnb", "vrbo", "booking", "other"],
        },
        beds: { type: "number" },
        baths: { type: "number" },
        sleeps: { type: "number" },
        hero_image_url: { type: "string" },
        projection_low: { type: "number", description: "Annual gross revenue, low end, USD" },
        projection_high: { type: "number", description: "Annual gross revenue, high end, USD" },
        projection_note: { type: "string" },
      },
      required: ["owner_name", "property_address", "projection_low", "projection_high"],
    },
    execute: async (input) =>
      sales.createPitchOrThrow({
        owner_name: s(input.owner_name)!,
        owner_email: s(input.owner_email),
        property_address: s(input.property_address)!,
        listing_url: s(input.listing_url),
        listing_source: s(input.listing_source) as
          | sales.SalesListingSource
          | undefined,
        beds: n(input.beds),
        baths: n(input.baths),
        sleeps: n(input.sleeps),
        hero_image_url: s(input.hero_image_url),
        projection_low: n(input.projection_low)!,
        projection_high: n(input.projection_high)!,
        projection_note: s(input.projection_note),
      }),
  },
  {
    name: "list_sales_pitches",
    description:
      "List Haven sales pitches. By default returns active pitches (not archived). Pass include_archived=true to include archived ones too.",
    input_schema: {
      type: "object",
      properties: {
        include_archived: { type: "boolean" },
      },
      required: [],
    },
    execute: async (input) =>
      sales.listPitches({ includeArchived: !!b(input.include_archived) }),
  },
  {
    name: "get_sales_pitch",
    description: "Get a single sales pitch by id.",
    input_schema: {
      type: "object",
      properties: { pitch_id: { type: "string" } },
      required: ["pitch_id"],
    },
    execute: async (input) => sales.getPitch(s(input.pitch_id)!),
  },
  {
    name: "update_sales_pitch",
    description:
      "Update fields on an existing sales pitch. You can change owner / property fields, projection range, hero image, listing URL, status (active|archived), or expires_at (ISO timestamp — useful if the user wants to extend the pitch).",
    input_schema: {
      type: "object",
      properties: {
        pitch_id: { type: "string" },
        owner_name: { type: "string" },
        owner_email: { type: "string" },
        property_address: { type: "string" },
        listing_url: { type: "string" },
        listing_source: {
          type: "string",
          enum: ["zillow", "airbnb", "vrbo", "booking", "other"],
        },
        beds: { type: "number" },
        baths: { type: "number" },
        sleeps: { type: "number" },
        hero_image_url: { type: "string" },
        projection_low: { type: "number" },
        projection_high: { type: "number" },
        projection_note: { type: "string" },
        status: { type: "string", enum: ["active", "archived"] },
        expires_at: { type: "string", description: "ISO timestamp" },
      },
      required: ["pitch_id"],
    },
    execute: async (input) => {
      const patch: sales.UpdatePitchInput = {};
      if (s(input.owner_name) !== undefined) patch.owner_name = s(input.owner_name);
      if (s(input.owner_email) !== undefined) patch.owner_email = s(input.owner_email);
      if (s(input.property_address) !== undefined)
        patch.property_address = s(input.property_address);
      if (s(input.listing_url) !== undefined) patch.listing_url = s(input.listing_url);
      if (s(input.listing_source) !== undefined)
        patch.listing_source = s(input.listing_source) as sales.SalesListingSource;
      if (n(input.beds) !== undefined) patch.beds = n(input.beds);
      if (n(input.baths) !== undefined) patch.baths = n(input.baths);
      if (n(input.sleeps) !== undefined) patch.sleeps = n(input.sleeps);
      if (s(input.hero_image_url) !== undefined)
        patch.hero_image_url = s(input.hero_image_url);
      if (n(input.projection_low) !== undefined)
        patch.projection_low = n(input.projection_low);
      if (n(input.projection_high) !== undefined)
        patch.projection_high = n(input.projection_high);
      if (s(input.projection_note) !== undefined)
        patch.projection_note = s(input.projection_note);
      if (s(input.status) !== undefined)
        patch.status = s(input.status) as sales.SalesPitchStatus;
      if (s(input.expires_at) !== undefined) patch.expires_at = s(input.expires_at);
      return sales.updatePitchOrThrow(s(input.pitch_id)!, patch);
    },
  },
  {
    name: "archive_sales_pitch",
    description:
      "Archive a sales pitch. The public URL will start showing the 'expired — contact Jack' page. Reversible via update_sales_pitch with status='active'.",
    input_schema: {
      type: "object",
      properties: { pitch_id: { type: "string" } },
      required: ["pitch_id"],
    },
    execute: async (input) => sales.archivePitchOrThrow(s(input.pitch_id)!),
  },
  {
    name: "delete_sales_pitch",
    description:
      "Permanently delete a sales pitch. Use only when the user explicitly says delete — otherwise prefer archive_sales_pitch.",
    input_schema: {
      type: "object",
      properties: { pitch_id: { type: "string" } },
      required: ["pitch_id"],
    },
    execute: async (input) => sales.deletePitchOrThrow(s(input.pitch_id)!),
  },

  // =========================================================================
  // SYSTEM
  // =========================================================================
  {
    name: "test_hostaway_connection",
    description:
      "Verify that the Hostaway PMS integration is reachable and authenticated.",
    input_schema: { type: "object", properties: {}, required: [] },
    execute: async () => hostaway.testHostawayConnection(),
  },
];

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

export function getToolByName(name: string): ToolDef | undefined {
  return TOOLS.find((t) => t.name === name);
}

/**
 * Exported in a shape ready for the Anthropic Managed Agents API
 * (custom tool definitions). Strips the execute() handler.
 */
export function toolSchemasForAnthropic(): Array<{
  name: string;
  description: string;
  input_schema: ToolDef["input_schema"];
}> {
  return TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

export const HAVEN_OS_SYSTEM_PROMPT = `You are **Haven Assistant**, the AI copilot inside Haven OS — the internal operating system for Haven Vacation Rentals, a short-term rental (STR) management company in the Great Smoky Mountains. The primary operator is Jack Zoppa.

## Who uses you
The Haven team uses you through a chat UI inside Haven OS. When they ask about "my tasks", "my employees", etc., they mean the signed-in user — always call \`get_current_user\` first to resolve identity.

## What you can do
You have tools that give you live read + write access across the entire Haven OS:

- **Tasks / Work module** — spaces, folders, lists, tasks, comments, assignees. Full CRUD. Default view for "what am I working on" is \`get_my_tasks\`.
- **Properties (PDM)** — the property master database. You can list, read, update any field (status, tier, account manager, access codes, etc.), and archive properties.
- **Scorecard** — the Northstar weekly KPI tracker. You can read current + historical months, update cell values/targets/status (green/yellow/red), seed new months, and archive closed months.
- **Onboarding** — property onboarding projects with templated tasks + checklists. Full control: create or delete projects; update every project field (status, owner info, target/actual open dates, slack channel, folder URL, notes); add / update / delete / restatus tasks; edit any task field (title, description, department, due date, assignee, key-date flag); add / toggle / delete checklist items. Use \`list_onboarding_projects_with_stats\` for rollup views (progress, blockers, next key date, overdue) and \`get_onboarding_tree\` when you need specific task_ids to update.
- **HR** (permission-gated) — employees, performance reviews, issues/write-ups, roles, candidates, policy/procedure docs. Each call is row-level filtered by the caller's HR access grants.
- **Admin** (super-admin only) — list users; create users (default invite-by-email, optionally direct-create with password); change roles (user / admin / super_admin); delete users; grant or revoke HR access; manage departments. When the user asks to "add" or "invite" someone, default to invite mode (email-based) unless they say otherwise.
- **Sales / Property Pitches** (admin or super_admin) — generate a personalized one-pager that gets sent to a prospective property owner, hosted at \`/pitch/<slug>\`. Workflow: when the user gives you a Zillow / Airbnb / VRBO / Booking link, call \`extract_listing_details\` first to auto-fill address, beds/baths/sleeps, and a hero photo. Then call \`create_sales_pitch\` with the owner's name and a projection range (annual gross revenue, low + high in USD). The pitch expires 30 days after creation; you can extend it via \`update_sales_pitch\` with a new \`expires_at\`. Use \`archive_sales_pitch\` to retire a pitch (the public URL flips to a friendly contact page); only use \`delete_sales_pitch\` when the user explicitly says delete. After creating, surface the public URL — it's \`<site>/pitch/<slug>\`.
- **System** — test Hostaway connection, list team members.

## How to work
1. **Always fetch live data** via tools — never invent IDs, statuses, or values.
2. **Call \`get_current_user\` first** whenever the user says "me", "my", "I", or anything scoped to themselves.
3. **Resolve names → IDs** before writes. If a user says "assign the pool task to Sarah", call \`list_team_members\` + \`list_tasks\` to find IDs first.
4. **Confirm destructive actions.** Before deleting a task, archiving a property, deleting an employee, or archiving the scorecard, ask the user "Just to confirm — delete X? (yes/no)" and wait for their response, unless their prompt explicitly said "delete X" in which case you can proceed.
5. **Be concise.** This is a business tool. Lead with the answer. If you're reporting data, prioritise what needs action (red scorecard metrics, overdue tasks, etc.).
6. **On HR access denied:** if you hit "HR access required" or "You don't have access to this employee's HR record", tell the user their account doesn't have HR access for that employee and that a Super Admin can grant access at /settings/users.
7. **Three roles:** 'user' (Work/Properties/Onboarding), 'admin' (everything except HR & user management), 'super_admin' (full). HR access can be granted to any user scoped to all employees, a department, or a single employee.
8. **When in doubt about a column on Property or Employee,** use \`get_property\` / \`get_employee\` first to see what's available — then call the update tool with the exact field names.
9. **Format lists** as short markdown — either a table or bullets. Never paste raw JSON at the user.

## Style
- Plain, direct, operator tone.
- No emojis.
- No filler ("Sure!", "Of course!", "Great question!"). Get to the answer.
- When you've done something, say what you did in one clear sentence: "Done — created task 'Call vendor Y' in Operations, due tomorrow."

You are running inside the HavenOS Managed Agent. The Haven OS app executes your custom tools and returns results. The environment gives you shell + web_search + text_editor + web_fetch as fallbacks, but prefer Haven OS tools for anything involving Haven OS data.`;
