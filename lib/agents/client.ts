import Anthropic from "@anthropic-ai/sdk";
import type { AgentStreamEvent } from "./types";
import { getToolByName, type ToolContext, type ToolInput } from "./tools";
import { getCurrentUser } from "@/lib/auth/user";

// ---------------------------------------------------------------------------
// Singleton Anthropic client
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY env var is not set");
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

function requireAgentEnv(): { agentId: string; environmentId: string } {
  const agentId = process.env.ANTHROPIC_AGENT_ID?.trim();
  const environmentId = process.env.ANTHROPIC_ENVIRONMENT_ID?.trim();
  if (!agentId) throw new Error("ANTHROPIC_AGENT_ID env var is not set");
  if (!environmentId)
    throw new Error("ANTHROPIC_ENVIRONMENT_ID env var is not set");
  return { agentId, environmentId };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function pingAgent(): Promise<{
  agentId: string;
  name: string;
  model: string;
}> {
  const { agentId } = requireAgentEnv();
  const client = getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent: any = await (client.beta.agents as any).retrieve(agentId);
  return {
    agentId: agent.id,
    name: agent.name ?? "(unnamed)",
    model:
      typeof agent.model === "string"
        ? agent.model
        : agent.model?.id ?? "unknown",
  };
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

export async function createSession(): Promise<string> {
  const { agentId, environmentId } = requireAgentEnv();
  const client = getClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session: any = await (client.beta.sessions as any).create({
    agent: agentId,
    environment_id: environmentId,
  });
  return session.id as string;
}

// ---------------------------------------------------------------------------
// Custom tool execution helper
// ---------------------------------------------------------------------------

type PendingCustomTool = {
  id: string; // the event id; used as custom_tool_use_id
  name: string;
  input: ToolInput;
};

async function executeCustomTool(
  call: PendingCustomTool,
  ctx: ToolContext,
): Promise<{ output: string; isError: boolean }> {
  const tool = getToolByName(call.name);
  if (!tool) {
    return {
      output: JSON.stringify({
        error: `Unknown tool: ${call.name}`,
      }),
      isError: true,
    };
  }
  try {
    const result = await tool.execute(call.input, ctx);
    return { output: JSON.stringify(result ?? null), isError: false };
  } catch (err) {
    return {
      output: JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      isError: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Streaming send
// ---------------------------------------------------------------------------

/**
 * Send a user prompt to a session and stream normalized events back.
 *
 * Handles the full "requires_action" loop: when the agent emits
 * agent.custom_tool_use + session.status_idle(requires_action), we
 * execute the tool locally, send user.custom_tool_result back into
 * the session, and continue streaming until end_turn.
 */
export async function* streamSend(
  sessionId: string,
  prompt: string,
): AsyncGenerator<AgentStreamEvent> {
  const client = getClient();

  // Resolve current user ONCE per turn for tool handlers.
  const user = await getCurrentUser();
  const ctx: ToolContext = {
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
  };

  // Open event stream BEFORE sending the prompt so we don't miss early events.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stream: any = await (client.beta.sessions.events as any).stream(
    sessionId,
  );

  const sendUserMessage = async (text: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client.beta.sessions.events as any).send(sessionId, {
      events: [
        {
          type: "user.message",
          content: [{ type: "text", text }],
        },
      ],
    });
  };

  const sendToolResults = async (
    results: Array<{
      custom_tool_use_id: string;
      output: string;
      isError: boolean;
    }>,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client.beta.sessions.events as any).send(sessionId, {
      events: results.map((r) => ({
        type: "user.custom_tool_result",
        custom_tool_use_id: r.custom_tool_use_id,
        content: [{ type: "text", text: r.output }],
        is_error: r.isError,
      })),
    });
  };

  try {
    await sendUserMessage(prompt);
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    };
    return;
  }

  const pendingTools = new Map<string, PendingCustomTool>();

  // Outer loop so we can re-open the stream after sending tool results if
  // the first stream ended.
  while (true) {
    let resolvedThisLoop = false;

    try {
      for await (const raw of stream) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ev: any = raw;
        const t: string = ev?.type ?? "";

        // ------- Session status -------
        if (t === "session.status_running") {
          yield { type: "status", status: "running" };
          continue;
        }

        if (t === "session.status_idle") {
          const reasonType = ev.reason?.type ?? ev.reason;

          // End of turn: we're done.
          if (reasonType === "end_turn" || typeof reasonType === "undefined") {
            yield { type: "done" };
            return;
          }

          if (reasonType === "retries_exhausted") {
            yield {
              type: "error",
              message: "Agent exhausted its retry budget on this turn.",
            };
            return;
          }

          // Agent is blocked waiting for tool results OR user confirmation.
          if (reasonType === "requires_action") {
            const eventIds: string[] = ev.reason?.event_ids ?? [];

            // Resolve only tools we're actually tracking.
            const toResolve: PendingCustomTool[] = [];
            for (const id of eventIds) {
              const p = pendingTools.get(id);
              if (p) toResolve.push(p);
            }

            if (toResolve.length === 0) {
              // Either a tool confirmation (not a custom_tool_use) or unknown —
              // we can't resolve it. Surface as error.
              yield {
                type: "error",
                message:
                  "Session is blocked on an event we can't handle automatically.",
              };
              return;
            }

            // Execute all pending tools in parallel.
            const results = await Promise.all(
              toResolve.map(async (p) => {
                const { output, isError } = await executeCustomTool(p, ctx);
                return {
                  custom_tool_use_id: p.id,
                  output,
                  isError,
                  name: p.name,
                };
              }),
            );

            // Emit tool_result events to the UI.
            for (const r of results) {
              yield {
                type: "tool_result",
                output: r.output,
                isError: r.isError,
              };
              pendingTools.delete(r.custom_tool_use_id);
            }

            // Send results into the session. This re-triggers the agent and
            // the existing stream SHOULD pick up new events.
            await sendToolResults(
              results.map((r) => ({
                custom_tool_use_id: r.custom_tool_use_id,
                output: r.output,
                isError: r.isError,
              })),
            );

            resolvedThisLoop = true;
            // Continue the inner loop — more events should flow.
            continue;
          }

          // Unknown idle reason — treat as end of turn.
          yield { type: "done" };
          return;
        }

        if (t === "session.status_terminated" || t === "session.deleted") {
          yield { type: "done" };
          return;
        }

        // ------- Agent output -------
        if (t === "agent.message") {
          const blocks = Array.isArray(ev.content) ? ev.content : [];
          const text = blocks
            .map((b: { type?: string; text?: string }) =>
              b?.type === "text" ? b.text ?? "" : "",
            )
            .join("");
          if (text) yield { type: "text", text };
          continue;
        }

        if (t === "agent.thinking") {
          yield { type: "status", status: "Thinking…" };
          continue;
        }

        // Built-in tool use (bash, text_editor, web_search, etc.)
        if (t === "agent.tool_use" || t === "agent.mcp_tool_use") {
          yield {
            type: "tool_use",
            name: ev.name ?? "(tool)",
            input: ev.input ?? {},
          };
          continue;
        }

        // Custom tool use — agent is asking US to run a tool.
        if (t === "agent.custom_tool_use") {
          const pending: PendingCustomTool = {
            id: ev.id,
            name: ev.name ?? "(tool)",
            input: (ev.input ?? {}) as ToolInput,
          };
          pendingTools.set(ev.id, pending);
          yield {
            type: "tool_use",
            name: pending.name,
            input: pending.input,
          };
          // Don't execute here — execute when session.status_idle arrives
          // with requires_action (we need ALL tool calls for this turn).
          continue;
        }

        // Built-in tool result (from agent's own tools, not ours)
        if (t === "agent.tool_result" || t === "agent.mcp_tool_result") {
          const blocks = Array.isArray(ev.content) ? ev.content : [];
          const text = blocks
            .map((b: { type?: string; text?: string }) =>
              b?.type === "text" ? b.text ?? "" : "",
            )
            .join("");
          yield {
            type: "tool_result",
            output: text || JSON.stringify(blocks),
            isError: !!ev.is_error,
          };
          continue;
        }

        // ------- Errors -------
        if (t === "session.error") {
          const msg =
            ev.error?.message ??
            ev.message ??
            (typeof ev.error === "string"
              ? ev.error
              : "Unknown session error");
          yield { type: "error", message: String(msg) };
          return;
        }

        // Everything else (span events, thread context compaction, etc.) —
        // skip silently.
      }
    } catch (err) {
      yield {
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      };
      return;
    }

    // Stream ended. If we resolved tools in this loop, open a fresh stream
    // and continue — the agent will produce more output.
    if (resolvedThisLoop) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stream = await (client.beta.sessions.events as any).stream(sessionId);
      continue;
    }

    // Clean end.
    yield { type: "done" };
    return;
  }
}
