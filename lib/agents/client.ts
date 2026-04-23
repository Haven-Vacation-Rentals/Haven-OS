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
 * Yields a compact typed stream suitable for forwarding over SSE to the
 * browser. Emits a final { type: "done" } when the turn settles.
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

  yield { type: "status", status: "running" };

  try {
    for await (const raw of stream) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ev: any = raw;
      const t: string = ev?.type ?? "";

      // Streamed assistant text deltas.
      if (
        t === "assistant.message.delta" ||
        t === "assistant.text.delta" ||
        t === "message.delta"
      ) {
        const delta = ev.delta ?? ev.content ?? ev;
        const text =
          typeof delta === "string"
            ? delta
            : delta?.text ??
              (Array.isArray(delta?.content)
                ? delta.content
                    .map((c: { text?: string }) => c?.text ?? "")
                    .join("")
                : "");
        if (text) yield { type: "text", text };
        continue;
      }

      // Full assistant message (non-streaming form).
      if (t === "assistant.message" || t === "message") {
        const blocks = ev.content ?? ev.message?.content ?? [];
        if (Array.isArray(blocks)) {
          for (const b of blocks) {
            if (b?.type === "text" && typeof b.text === "string") {
              yield { type: "text", text: b.text };
            } else if (b?.type === "tool_use") {
              yield {
                type: "tool_use",
                name: b.name ?? "(tool)",
                input: b.input ?? {},
              };
            }
          }
        }
        continue;
      }

      if (t === "tool_use" || t === "assistant.tool_use") {
        yield {
          type: "tool_use",
          name: ev.name ?? ev.tool_name ?? "(tool)",
          input: ev.input ?? {},
        };
        continue;
      }

      if (t === "tool_result" || t === "tool.result") {
        const output =
          typeof ev.output === "string"
            ? ev.output
            : JSON.stringify(ev.output ?? ev.content ?? "");
        yield { type: "tool_result", output, isError: !!ev.is_error };
        continue;
      }

      // Terminal events — turn is done, keep the session alive for the
      // next user message.
      if (
        t === "turn.completed" ||
        t === "assistant.turn.completed" ||
        t === "message.completed" ||
        t === "session.idle" ||
        t === "idle"
      ) {
        yield { type: "done" };
        return;
      }

      // Session was torn down (shouldn't happen mid-turn but handle it).
      if (t === "session.completed" || t === "session.stopped") {
        yield { type: "done" };
        return;
      }

      if (t === "error" || t === "session.error") {
        yield {
          type: "error",
          message: ev.message ?? ev.error?.message ?? "Unknown error",
        };
        return;
      }

      // Everything else becomes a status line.
      if (t) {
        yield { type: "status", status: t };
      }
    }

    // Stream ended naturally.
    yield { type: "done" };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
