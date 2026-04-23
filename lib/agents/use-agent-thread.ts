"use client";

import { useCallback, useRef, useState } from "react";
import type { AgentStreamEvent } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentMessageRole = "user" | "assistant";

export type AgentToolCall = {
  id: string;
  name: string;
  input: unknown;
  result?: string;
  isError?: boolean;
};

export type AgentMessage = {
  id: string;
  role: AgentMessageRole;
  text: string;
  toolCalls: AgentToolCall[];
  streaming?: boolean;
  error?: string;
};

export type UseAgentThreadResult = {
  messages: AgentMessage[];
  sessionId: string | null;
  sending: boolean;
  send: (prompt: string) => Promise<void>;
  reset: () => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

/**
 * Manages an in-memory chat thread against a Managed Agent session.
 *
 * - First `send()` creates the session lazily and caches the id.
 * - Follow-up `send()` calls reuse the same session for context.
 * - `reset()` clears history and the session id (next send starts fresh).
 */
export function useAgentThread(): UseAgentThreadResult {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Keep a ref in sync so `send` doesn't need sessionId in deps.
  const sessionRef = useRef<string | null>(null);
  const setSessionBoth = (id: string | null) => {
    sessionRef.current = id;
    setSessionId(id);
  };

  const reset = useCallback(() => {
    setMessages([]);
    setSessionBoth(null);
  }, []);

  const send = useCallback(async (prompt: string) => {
    const clean = prompt.trim();
    if (!clean) return;

    // Build user + assistant placeholder messages up front.
    const userMsg: AgentMessage = {
      id: newId(),
      role: "user",
      text: clean,
      toolCalls: [],
    };
    const assistantId = newId();
    const assistantMsg: AgentMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      toolCalls: [],
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setSending(true);

    const updateAssistant = (fn: (m: AgentMessage) => AgentMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? fn(m) : m)),
      );
    };

    try {
      // 1) Lazily create a session if we don't have one.
      let sid = sessionRef.current;
      if (!sid) {
        const res = await fetch("/api/agents/session", { method: "POST" });
        const data = (await res.json()) as {
          sessionId?: string;
          error?: string;
        };
        if (!res.ok || !data.sessionId) {
          throw new Error(data.error ?? `Session create failed (${res.status})`);
        }
        sid = data.sessionId;
        setSessionBoth(sid);
      }

      // 2) POST the prompt and stream events.
      const res = await fetch(`/api/agents/session/${sid}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: clean }),
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Send failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let pendingToolById = new Map<string, AgentToolCall>();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const dataLines = chunk
            .split("\n")
            .filter((l) => l.startsWith("data: "))
            .map((l) => l.slice(6));
          if (dataLines.length === 0) continue;
          let ev: AgentStreamEvent;
          try {
            ev = JSON.parse(dataLines.join("\n")) as AgentStreamEvent;
          } catch {
            continue;
          }

          switch (ev.type) {
            case "text":
              updateAssistant((m) => ({ ...m, text: m.text + ev.text }));
              break;
            case "tool_use": {
              const call: AgentToolCall = {
                id: newId(),
                name: ev.name,
                input: ev.input,
              };
              pendingToolById.set(call.name, call);
              updateAssistant((m) => ({
                ...m,
                toolCalls: [...m.toolCalls, call],
              }));
              break;
            }
            case "tool_result": {
              // Best-effort: attach to the most recent unfinished tool call.
              updateAssistant((m) => {
                const next = [...m.toolCalls];
                for (let i = next.length - 1; i >= 0; i--) {
                  if (next[i]!.result === undefined) {
                    next[i] = {
                      ...next[i]!,
                      result: ev.output,
                      isError: ev.isError,
                    };
                    break;
                  }
                }
                return { ...m, toolCalls: next };
              });
              break;
            }
            case "error":
              updateAssistant((m) => ({
                ...m,
                streaming: false,
                error: ev.message,
              }));
              break;
            case "status":
            case "done":
              // status is informational; done flips streaming off below.
              break;
          }
        }
      }

      updateAssistant((m) => ({ ...m, streaming: false }));
      pendingToolById.clear();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      updateAssistant((m) => ({
        ...m,
        streaming: false,
        error: message,
      }));
    } finally {
      setSending(false);
    }
  }, []);

  return { messages, sessionId, sending, send, reset };
}
