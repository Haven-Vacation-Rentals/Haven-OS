import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAnthropicClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to Vercel → Settings → Environment Variables (Production + Preview) and redeploy.",
    );
  }
  return new Anthropic({ apiKey: key });
}

const SYSTEM_PROMPT = `You are Haven Assistant, the AI copilot for Haven Vacation Rentals' internal operating system (Haven OS).

Haven Vacation Rentals is a short-term rental company managing a portfolio of vacation properties. You help the team with:
- Querying and understanding KPI data from the Northstar Scorecard (weekly metrics across Sales, Marketing, Account Management, Guest Experience, Revenue Management, and Accounting)
- Looking up property information
- Answering operational questions
- Summarizing performance trends

You have access to tools that let you read live data from Haven OS. Always use the tools to fetch current data rather than guessing. Be concise, direct, and business-focused. Use numbers and specifics when available.

When presenting scorecard data, highlight what's on track (green), needs attention (yellow), or is behind (red). Focus on insights, not just raw data.`;

const tools: Anthropic.Tool[] = [
  {
    name: "get_active_scorecard",
    description:
      "Fetches the current active month's Northstar Scorecard, including all sections, metrics, weekly values, targets, and statuses.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_scorecard_months",
    description: "Lists all available scorecard months (active and archived) with their labels and status.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_scorecard_month",
    description: "Fetches a specific scorecard month by its ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        month_id: {
          type: "string",
          description: "The UUID of the scorecard month to fetch.",
        },
      },
      required: ["month_id"],
    },
  },
  {
    name: "list_properties",
    description: "Lists all properties in the Haven portfolio with their key details.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of properties to return (default 20).",
        },
      },
      required: [],
    },
  },
];

type ToolInput = Record<string, unknown>;

async function runTool(name: string, input: ToolInput): Promise<string> {
  const supabase = await createClient();
  if (!supabase) return JSON.stringify({ error: "Database not configured" });

  if (name === "get_active_scorecard") {
    const { data: monthData } = await supabase
      .from("scorecard_months")
      .select("id, label, year, month, week_labels, status")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!monthData) return JSON.stringify({ error: "No active scorecard month found" });

    const [{ data: sections }, { data: rows }] = await Promise.all([
      supabase.from("scorecard_sections").select("*").eq("month_id", monthData.id).order("order_index"),
      supabase.from("scorecard_rows").select("*").eq("month_id", monthData.id).order("order_index"),
    ]);

    return JSON.stringify({ month: monthData, sections: sections ?? [], rows: rows ?? [] });
  }

  if (name === "list_scorecard_months") {
    const { data } = await supabase
      .from("scorecard_months")
      .select("id, label, year, month, status, archived_at, created_at")
      .order("year", { ascending: false })
      .order("month", { ascending: false });
    return JSON.stringify(data ?? []);
  }

  if (name === "get_scorecard_month") {
    const monthId = input.month_id as string;
    const [{ data: monthData }, { data: sections }, { data: rows }] = await Promise.all([
      supabase.from("scorecard_months").select("*").eq("id", monthId).single(),
      supabase.from("scorecard_sections").select("*").eq("month_id", monthId).order("order_index"),
      supabase.from("scorecard_rows").select("*").eq("month_id", monthId).order("order_index"),
    ]);
    if (!monthData) return JSON.stringify({ error: "Month not found" });
    return JSON.stringify({ month: monthData, sections: sections ?? [], rows: rows ?? [] });
  }

  if (name === "list_properties") {
    const limit = (input.limit as number) ?? 20;
    const { data } = await supabase
      .from("properties")
      .select("id, name, address, status, bedrooms, bathrooms, max_guests")
      .limit(limit);
    return JSON.stringify(data ?? []);
  }

  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const anthropic = getAnthropicClient();
        let currentMessages: Anthropic.MessageParam[] = messages;

        // Agentic loop — keep going until no more tool calls
        while (true) {
          const response = await anthropic.messages.create({
            model: "claude-opus-4-7",
            max_tokens: 4096,
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
          let currentToolUse: { id: string; name: string; inputJson: string } | null = null;
          let stopReason = "";

          for await (const event of response) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "text") {
                // text block starting
              } else if (event.content_block.type === "tool_use") {
                currentToolUse = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  inputJson: "",
                };
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                assistantText += event.delta.text;
                send({ type: "text", text: event.delta.text });
              } else if (event.delta.type === "input_json_delta" && currentToolUse) {
                currentToolUse.inputJson += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop") {
              if (currentToolUse) {
                const parsed = JSON.parse(currentToolUse.inputJson || "{}") as ToolInput;
                toolUses.push({
                  id: currentToolUse.id,
                  name: currentToolUse.name,
                  input: parsed,
                });
                currentToolUse = null;
              }
            } else if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason ?? "";
            }
          }

          // Build assistant message for history
          const assistantContent: Anthropic.ContentBlockParam[] = [];
          if (assistantText) {
            assistantContent.push({ type: "text", text: assistantText });
          }
          for (const tu of toolUses) {
            assistantContent.push({ type: "tool_use", id: tu.id, name: tu.name, input: tu.input });
          }

          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: assistantContent },
          ];

          if (stopReason !== "tool_use" || toolUses.length === 0) break;

          // Execute tools and feed results back
          send({ type: "tool_calls", tools: toolUses.map((t) => ({ name: t.name })) });

          const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
            toolUses.map(async (tu) => ({
              type: "tool_result" as const,
              tool_use_id: tu.id,
              content: await runTool(tu.name, tu.input),
            })),
          );

          currentMessages = [
            ...currentMessages,
            { role: "user", content: toolResults },
          ];
        }

        send({ type: "done" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        send({ type: "error", message: msg });
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
