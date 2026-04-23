import Anthropic from "@anthropic-ai/sdk";
import type { AgentStreamEvent } from "./types";

// ---------------------------------------------------------------------------
// Singleton client
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
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Minimal health check: confirms API key + IDs are valid by retrieving the
 * configured agent. Throws if anything is off.
 */
export async function pingAgent(): Promise<{
  agentId: string;
  name: string;
  model: string;
}> {
  const { agentId } = requireAgentEnv();
  const client = getClient();
  // `agents.retrieve` returns the latest version by default.
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

/**
 * Create a session against the configured agent + environment, send the
 * user's prompt, and stream events back as normalized AgentStreamEvents.
 *
 * The async generator yields small JSON-safe events suitable for forwarding
 * over SSE to the browser.
 */
export async function* runAgentTask(
  prompt: string,
): AsyncGenerator<AgentStreamEvent> {
  const { agentId, environmentId } = requireAgentEnv();
  const client = getClient();

  yield { type: "status", status: "creating_session" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session: any = await (client.beta.sessions as any).create({
    agent: agentId,
    environment_id: environmentId,
  });

  yield { type: "session", sessionId: session.id };
  yield { type: "status", status: "sending_message" };

  // Open the stream FIRST, then send the user message so we don't miss
  // early events.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream: any = await (client.beta.sessions.events as any).stream(
    session.id,
  );

  // Kick off the task. Fire-and-forget — responses come via the stream.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client.beta.sessions.events as any).send(session.id, {
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
      // The shape of events from the Managed Agents API is still in beta.
      // We do a best-effort normalization here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ev: any = raw;
      const t: string = ev?.type ?? "";

      // Streamed text from the assistant.
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

      if (
        t === "session.completed" ||
        t === "session.stopped" ||
        t === "turn.completed" ||
        t === "done"
      ) {
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

      // Surface other status events (e.g. session.status) as a status line.
      if (t) {
        yield { type: "status", status: t };
      }
    }

    yield { type: "done" };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
