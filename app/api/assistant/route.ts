import Anthropic from "@anthropic-ai/sdk";
import { getCurrentUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import {
  getGlobalTasks,
  getTask,
  getSpaceTree,
  getMembers,
  createTask,
  updateTask,
  addComment,
} from "@/lib/work/actions";
import type { TaskPriority } from "@/lib/work/types";
import { getProperties, getProperty } from "@/lib/properties/actions";
import {
  getActiveMonth,
  getMonth,
  listMonths,
  updateRowCell,
} from "@/lib/scorecard/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (_anthropic) return _anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY env var is not set");
  }
  _anthropic = new Anthropic({ apiKey });
  return _anthropic;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Haven Assistant, the AI copilot built into Haven OS — the internal operating system for Haven Vacation Rentals, a short-term rental (STR) company managing a portfolio of vacation properties.

## Your role
You help the Haven team work faster and smarter. You have live access to their data across three areas:

### 1. Northstar Scorecard (KPIs)
Weekly KPI tracking across departments: Evergreen Metrics, Sales, Marketing, Account Management, Guest Experience, Revenue Management, and Accounting/Finance.
- Status meanings: green = on track, yellow = needs attention, red = behind
- Each metric has weekly values, a monthly target, and an actual
- You can read scorecard data AND update individual cell values

### 2. Task Management
Full project management system with spaces, lists, and tasks.
- Spaces are top-level groupings (e.g. "Operations", "Marketing")
- Lists live inside spaces and contain tasks
- Tasks have: title, description, status (todo/in_progress/done), priority (urgent/high/normal/low/none), due date, assignees, subtasks, comments
- You can search, create, and update tasks; add comments

### 3. Property Portfolio
The Haven vacation rental portfolio.
- Statuses: live (currently renting), onboarding, paused, offboarding, offboarded
- Tiers: top, key, normal, junior, low (indicates property value/performance tier)
- Each property has: address, region, bedrooms/bathrooms, max guests, account manager, revenue manager, platform links, access codes, vendor assignments

## How to respond
- Always fetch live data with tools rather than guessing
- Be direct and concise — this is a business tool, not a chatbot
- Lead with the most important insight; support with details
- When showing tasks or metrics, highlight what needs action
- For scorecard questions, surface red/yellow statuses first
- When the user asks to do something (create a task, update a value), confirm what you did in one clear sentence
- If you can't do something (e.g. delete data, manage users), say so briefly and suggest what you can do instead`;

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const tools: Anthropic.Tool[] = [
  // ── Scorecard ──────────────────────────────────────────────────────────
  {
    name: "get_active_scorecard",
    description:
      "Fetch the current active month's Northstar Scorecard — all sections, metrics, weekly values, monthly targets, actuals, and statuses (green/yellow/red). Use this for any question about current KPIs or performance.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "list_scorecard_months",
    description: "List all scorecard months (active and archived) with their labels and status. Use to let the user browse history or before fetching a past month.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_scorecard_month",
    description: "Fetch a specific archived or active scorecard month by its ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        month_id: { type: "string", description: "UUID of the scorecard month." },
      },
      required: ["month_id"],
    },
  },
  {
    name: "update_scorecard_cell",
    description:
      "Update a single cell in the scorecard — a weekly value, monthly target, actual, status, owner, source, or notes. Use this when the user asks to record a number or change a status.",
    input_schema: {
      type: "object" as const,
      properties: {
        row_id: { type: "string", description: "UUID of the scorecard row to update." },
        field: {
          type: "string",
          description:
            "Which field to update. One of: week1_value, week2_value, week3_value, week4_value, remainder_value, week1_note, week2_note, week3_note, week4_note, remainder_note, monthly_target, monthly_actual, metric_type, status, metric_owner, metric_source, notes.",
        },
        value: {
          type: "string",
          description: "New value. For status: 'green', 'yellow', or 'red'. Pass null to clear.",
        },
      },
      required: ["row_id", "field", "value"],
    },
  },

  // ── Tasks ───────────────────────────────────────────────────────────────
  {
    name: "search_tasks",
    description:
      "Search and filter tasks across all spaces and lists. Can filter by keyword, priority, due date, assignee, or status category. Returns up to 50 tasks with their list, space, status, priority, due date, and assignees.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: { type: "string", description: "Keyword to search in task titles." },
        due: {
          type: "string",
          enum: ["all", "overdue", "today", "this_week", "none"],
          description: "Filter by due date. 'overdue' = past due, 'none' = no due date set.",
        },
        priorities: {
          type: "array",
          items: { type: "string", enum: ["urgent", "high", "normal", "low", "none"] },
          description: "Only return tasks with these priorities.",
        },
        include_completed: {
          type: "boolean",
          description: "Include completed tasks (default false).",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 25, max 50).",
        },
      },
      required: [],
    },
  },
  {
    name: "get_task",
    description:
      "Get full details for a specific task by ID, including description, status, priority, due date, assignees, subtasks, and comments.",
    input_schema: {
      type: "object" as const,
      properties: {
        task_id: { type: "string", description: "UUID of the task." },
      },
      required: ["task_id"],
    },
  },
  {
    name: "get_my_tasks",
    description:
      "Get tasks assigned to the currently signed-in user. Useful for 'what do I have on my plate?' questions.",
    input_schema: {
      type: "object" as const,
      properties: {
        due: {
          type: "string",
          enum: ["all", "overdue", "today", "this_week"],
          description: "Optionally filter by due date.",
        },
        include_completed: {
          type: "boolean",
          description: "Include completed tasks (default false).",
        },
      },
      required: [],
    },
  },
  {
    name: "list_spaces",
    description:
      "List all spaces (top-level project areas) with their folders and lists. Useful for navigation or before creating tasks in a specific space.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_team_members",
    description: "List all team members with their IDs, names, and emails. Use before assigning tasks.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "create_task",
    description:
      "Create a new task. You must provide a list_id — use list_spaces first to find the right list if you don't have it. Optionally set priority, due date, and description.",
    input_schema: {
      type: "object" as const,
      properties: {
        list_id: { type: "string", description: "UUID of the list to create the task in." },
        title: { type: "string", description: "Task title." },
        description: { type: "string", description: "Optional task description or context." },
        priority: {
          type: "string",
          enum: ["urgent", "high", "normal", "low", "none"],
          description: "Task priority (default: normal).",
        },
        due_date: {
          type: "string",
          description: "ISO 8601 due date, e.g. '2025-05-15'. Optional.",
        },
      },
      required: ["list_id", "title"],
    },
  },
  {
    name: "update_task",
    description:
      "Update an existing task — change its title, priority, due date, or mark it complete. Only include fields you want to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        task_id: { type: "string", description: "UUID of the task to update." },
        title: { type: "string", description: "New title." },
        priority: {
          type: "string",
          enum: ["urgent", "high", "normal", "low", "none"],
          description: "New priority.",
        },
        due_date: {
          type: "string",
          description: "New ISO 8601 due date, or null to clear.",
        },
        completed: {
          type: "boolean",
          description: "Pass true to mark the task complete.",
        },
        description: { type: "string", description: "New description." },
      },
      required: ["task_id"],
    },
  },
  {
    name: "add_task_comment",
    description: "Add a comment to a task. Use this to log notes, updates, or context on behalf of the user.",
    input_schema: {
      type: "object" as const,
      properties: {
        task_id: { type: "string", description: "UUID of the task." },
        body: { type: "string", description: "Comment text." },
      },
      required: ["task_id", "body"],
    },
  },

  // ── Properties ──────────────────────────────────────────────────────────
  {
    name: "list_properties",
    description:
      "List Haven's vacation rental properties. Returns name, status, tier, region, bedroom/bathroom counts, account manager, revenue manager, and Hostaway ID for each.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["live", "onboarding", "paused", "offboarding", "offboarded"],
          description: "Filter by property lifecycle status.",
        },
        tier: {
          type: "string",
          enum: ["top", "key", "normal", "junior", "low"],
          description: "Filter by property tier.",
        },
        search: { type: "string", description: "Filter by name or address keyword." },
        limit: { type: "number", description: "Max results (default 30)." },
      },
      required: [],
    },
  },
  {
    name: "get_property",
    description:
      "Get full details for a single property — address, access codes, vendors, platform links, notes, and all metadata.",
    input_schema: {
      type: "object" as const,
      properties: {
        property_id: { type: "string", description: "UUID of the property." },
      },
      required: ["property_id"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

type ToolInput = Record<string, unknown>;

async function runTool(name: string, input: ToolInput, userId: string | null): Promise<string> {
  const safe = (v: unknown) => JSON.stringify(v ?? null);

  try {
    // ── Scorecard ──────────────────────────────────────────────────────
    if (name === "get_active_scorecard") {
      const month = await getActiveMonth();
      if (!month) return safe({ error: "No active scorecard month found." });
      return safe(month);
    }

    if (name === "list_scorecard_months") {
      return safe(await listMonths());
    }

    if (name === "get_scorecard_month") {
      const month = await getMonth(input.month_id as string);
      if (!month) return safe({ error: "Month not found." });
      return safe(month);
    }

    if (name === "update_scorecard_cell") {
      await updateRowCell(
        input.row_id as string,
        input.field as string,
        (input.value as string | null) ?? null,
      );
      return safe({ ok: true });
    }

    // ── Tasks ──────────────────────────────────────────────────────────
    if (name === "search_tasks") {
      const limit = Math.min((input.limit as number) ?? 25, 50);
      const tasks = await getGlobalTasks({
        search: input.search as string | undefined,
        due: input.due as "all" | "overdue" | "today" | "this_week" | "none" | undefined,
        priorities: input.priorities as TaskPriority[] | undefined,
        include_completed: (input.include_completed as boolean) ?? false,
      });
      return safe(tasks.slice(0, limit).map(summariseTask));
    }

    if (name === "get_task") {
      const task = await getTask(input.task_id as string);
      if (!task) return safe({ error: "Task not found." });
      return safe(task);
    }

    if (name === "get_my_tasks") {
      if (!userId) return safe({ error: "No authenticated user." });
      const tasks = await getGlobalTasks({
        assignee_ids: [userId],
        due: input.due as "all" | "overdue" | "today" | "this_week" | undefined,
        include_completed: (input.include_completed as boolean) ?? false,
      });
      return safe(tasks.map(summariseTask));
    }

    if (name === "list_spaces") {
      return safe(await getSpaceTree());
    }

    if (name === "get_team_members") {
      return safe(await getMembers());
    }

    if (name === "create_task") {
      const task = await createTask({
        list_id: input.list_id as string,
        title: input.title as string,
        description: input.description as string | undefined,
        priority: input.priority as "urgent" | "high" | "normal" | "low" | "none" | undefined,
        due_date: input.due_date as string | undefined,
      });
      return safe({ ok: true, task_id: task.id, title: task.title });
    }

    if (name === "update_task") {
      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.priority !== undefined) patch.priority = input.priority;
      if (input.due_date !== undefined) patch.due_date = input.due_date ?? null;
      if (input.description !== undefined) patch.description = input.description;
      if (input.completed === true) patch.completed_at = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateTask(input.task_id as string, patch as any);
      return safe({ ok: true });
    }

    if (name === "add_task_comment") {
      await addComment(input.task_id as string, input.body as string);
      return safe({ ok: true });
    }

    // ── Properties ─────────────────────────────────────────────────────
    if (name === "list_properties") {
      const props = await getProperties();
      const limit = (input.limit as number) ?? 30;
      let filtered = props;
      if (input.status) filtered = filtered.filter((p) => p.status === input.status);
      if (input.tier) filtered = filtered.filter((p) => p.tier === input.tier);
      if (input.search) {
        const q = (input.search as string).toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.address?.toLowerCase().includes(q) ||
            p.region?.toLowerCase().includes(q),
        );
      }
      return safe(
        filtered.slice(0, limit).map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          tier: p.tier,
          region: p.region,
          address: p.address,
          bedrooms: p.bedroom_count,
          bathrooms: p.bathroom_count_full,
          max_guests: p.max_guests,
          account_manager: p.account_manager,
          revenue_manager: p.revenue_manager,
          hostaway_id: p.hostaway_id,
        })),
      );
    }

    if (name === "get_property") {
      const prop = await getProperty(input.property_id as string);
      if (!prop) return safe({ error: "Property not found." });
      return safe(prop);
    }

    return safe({ error: `Unknown tool: ${name}` });
  } catch (err) {
    return safe({ error: err instanceof Error ? err.message : String(err) });
  }
}

// Strip heavy fields from task results to keep context window lean
function summariseTask(t: unknown) {
  const task = t as Record<string, unknown>;
  return {
    id: task.id,
    title: task.title,
    priority: task.priority,
    due_date: task.due_date,
    completed_at: task.completed_at,
    status: (task.status as Record<string, unknown> | null)?.name,
    status_category: (task.status as Record<string, unknown> | null)?.category,
    list: (task.list as Record<string, unknown> | null)?.name,
    space: (task.space as Record<string, unknown> | null)?.name,
    subtask_count: task.subtask_count,
    assignees: task.assignees,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Anthropic.MessageParam[] };

  // Identify the caller for user-scoped tools (best-effort; not a hard auth gate)
  const user = await getCurrentUser();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        let currentMessages = messages;

        // Agentic loop — keep going until the model stops calling tools
        while (true) {
          const response = await getAnthropicClient().messages.create({
            model: "claude-opus-4-7",
            max_tokens: 8096,
            // @ts-expect-error — "adaptive" is valid at runtime; SDK 0.54 types only know "enabled"/"disabled"
            thinking: { type: "adaptive" },
            system: [
              {
                type: "text",
                text: SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
              },
            ],
            tools,
            messages: currentMessages,
            stream: true,
          });

          let assistantText = "";
          const toolUses: Array<{ id: string; name: string; input: ToolInput }> = [];
          let currentTU: { id: string; name: string; inputJson: string } | null = null;
          let stopReason = "";

          for await (const event of response) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                currentTU = { id: event.content_block.id, name: event.content_block.name, inputJson: "" };
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                assistantText += event.delta.text;
                send({ type: "text", text: event.delta.text });
              } else if (event.delta.type === "input_json_delta" && currentTU) {
                currentTU.inputJson += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop") {
              if (currentTU) {
                toolUses.push({
                  id: currentTU.id,
                  name: currentTU.name,
                  input: JSON.parse(currentTU.inputJson || "{}") as ToolInput,
                });
                currentTU = null;
              }
            } else if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason ?? "";
            }
          }

          // Append assistant turn to history
          const assistantContent: Anthropic.ContentBlockParam[] = [];
          if (assistantText) assistantContent.push({ type: "text", text: assistantText });
          for (const tu of toolUses) {
            assistantContent.push({ type: "tool_use", id: tu.id, name: tu.name, input: tu.input });
          }
          currentMessages = [...currentMessages, { role: "assistant", content: assistantContent }];

          if (stopReason !== "tool_use" || toolUses.length === 0) break;

          // Let the client know which tools are running
          send({ type: "tool_calls", tools: toolUses.map((t) => ({ name: t.name })) });

          // Execute tools in parallel
          const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
            toolUses.map(async (tu) => ({
              type: "tool_result" as const,
              tool_use_id: tu.id,
              content: await runTool(tu.name, tu.input, user?.id ?? null),
            })),
          );

          currentMessages = [...currentMessages, { role: "user", content: toolResults }];
        }

        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
