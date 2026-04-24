import Anthropic from "@anthropic-ai/sdk";
import type { AgentStreamEvent } from "./types";

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

/**
 * Create a fresh session against the configured agent + environment.
 * Returns the session id — store it client-side to reuse across turns.
 */
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

/**
 * Send a user message to an existing session and stream normalized events.
 *
 * Event type names come from the Anthropic Managed Agents SDK (v0.91+):
 *   agent.message, agent.thinking, agent.tool_use, agent.tool_result,
 *   agent.custom_tool_use, agent.mcp_tool_use, agent.mcp_tool_result,
 *   session.status_running, session.status_idle, session.status_terminated,
 *   session.error
 *
 * Yields a compact typed stream suitable for forwarding over SSE.
 * Emits a final { type: "done" } when the turn settles (session.status_idle).
 */
export async function* streamSend(
  sessionId: string,
  prompt: string,
): AsyncGenerator<AgentStreamEvent> {
  const client = getClient();

  // Open the stream BEFORE sending the user message so we don't miss
  // early events.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream: any = await (client.beta.sessions.events as any).stream(
    sessionId,
  );

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client.beta.sessions.events as any).send(sessionId, {
      events: [
        {
          type: "user.message",
          content: [{ type: "text", text: prompt }],
        },
      ],
    });
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    };
    return;
  }

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
        // Idle can mean "waiting for user tool confirmation" OR "end of turn".
        // The SDK surfaces this via the inner `reason` object.
        const reason = ev.reason?.type ?? ev.reason;
        if (
          reason === "end_turn" ||
          reason === "retries_exhausted" ||
          typeof reason === "undefined"
        ) {
          yield { type: "done" };
          return;
        }
        if (reason === "requires_action") {
          yield {
            type: "status",
            status: "Waiting for user confirmation",
          };
          // Don't return — stream may continue after user responds.
          continue;
        }
        yield { type: "status", status: `idle: ${String(reason)}` };
        continue;
      }

      if (t === "session.status_terminated" || t === "session.deleted") {
        yield { type: "done" };
        return;
      }

      // ------- Agent output -------
      if (t === "agent.message") {
        // Full text response (not delta). `content` is an array of text blocks.
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

      if (
        t === "agent.tool_use" ||
        t === "agent.custom_tool_use" ||
        t === "agent.mcp_tool_use"
      ) {
        yield {
          type: "tool_use",
          name: ev.name ?? "(tool)",
          input: ev.input ?? {},
        };
        continue;
      }

      if (t === "agent.tool_result" || t === "agent.mcp_tool_result") {
        const blocks = Array.isArray(ev.content) ? ev.content : [];
        const text = blocks
          .map((b: { type?: string; text?: string }) =>
            b?.type === "text" ? b.text ?? "" : "",
          )
          .join("");
        const output = text || JSON.stringify(blocks);
        yield {
          type: "tool_result",
          output,
          isError: !!ev.is_error,
        };
        continue;
      }

      // ------- Errors -------
      if (t === "session.error") {
        const msg =
          ev.error?.message ??
          ev.message ??
          (typeof ev.error === "string" ? ev.error : "Unknown session error");
        yield { type: "error", message: String(msg) };
        // Session-level error is terminal for this turn.
        return;
      }

      // ------- Everything else — skip silently to avoid noise -------
      // (span.model_request_start/end, agent.thread_context_compacted, etc.)
    }

    // Stream ended naturally without a terminal event.
    yield { type: "done" };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
