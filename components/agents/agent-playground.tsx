"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Play, Wrench, Terminal, Sparkles } from "lucide-react";
import type { AgentStreamEvent } from "@/lib/agents/types";

type PingState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; agentId: string; name: string; model: string }
  | { status: "error"; error: string };

type TranscriptEntry =
  | { kind: "status"; value: string }
  | { kind: "text"; value: string }
  | { kind: "tool_use"; name: string; input: unknown }
  | { kind: "tool_result"; output: string; isError?: boolean }
  | { kind: "error"; message: string };

export default function AgentPlayground() {
  const [prompt, setPrompt] = useState(
    "List the files in the working directory and summarize what you find.",
  );
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [ping, setPing] = useState<PingState>({ status: "idle" });
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new entries.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [transcript]);

  const doPing = useCallback(async () => {
    setPing({ status: "checking" });
    try {
      const res = await fetch("/api/agents/ping", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPing({
          status: "error",
          error: data.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      setPing({
        status: "ok",
        agentId: data.agentId,
        name: data.name,
        model: data.model,
      });
    } catch (err) {
      setPing({
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  useEffect(() => {
    void doPing();
  }, [doPing]);

  const run = useCallback(async () => {
    const clean = prompt.trim();
    if (!clean || running) return;
    setRunning(true);
    setSessionId(null);
    setTranscript([]);
    // Append a single running text entry we'll mutate as deltas arrive.
    let textBuffer = "";
    const appendText = (chunk: string) => {
      textBuffer += chunk;
      setTranscript((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.kind === "text") {
          const next = prev.slice(0, -1);
          next.push({ kind: "text", value: textBuffer });
          return next;
        }
        return [...prev, { kind: "text", value: textBuffer }];
      });
    };
    const resetTextBuffer = () => {
      textBuffer = "";
    };

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: clean }),
      });

      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => "");
        setTranscript((prev) => [
          ...prev,
          {
            kind: "error",
            message: err || `Request failed (${res.status})`,
          },
        ]);
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      // Minimal SSE parser: split on blank lines, take everything after
      // "data: " on each line.
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
          const jsonStr = dataLines.join("\n");
          let ev: AgentStreamEvent;
          try {
            ev = JSON.parse(jsonStr) as AgentStreamEvent;
          } catch {
            continue;
          }
          switch (ev.type) {
            case "session":
              setSessionId(ev.sessionId);
              break;
            case "status":
              setTranscript((prev) => [
                ...prev,
                { kind: "status", value: ev.status },
              ]);
              resetTextBuffer();
              break;
            case "text":
              appendText(ev.text);
              break;
            case "tool_use":
              resetTextBuffer();
              setTranscript((prev) => [
                ...prev,
                { kind: "tool_use", name: ev.name, input: ev.input },
              ]);
              break;
            case "tool_result":
              resetTextBuffer();
              setTranscript((prev) => [
                ...prev,
                {
                  kind: "tool_result",
                  output: ev.output,
                  isError: ev.isError,
                },
              ]);
              break;
            case "error":
              setTranscript((prev) => [
                ...prev,
                { kind: "error", message: ev.message },
              ]);
              break;
            case "done":
              // handled by stream close
              break;
          }
        }
      }
    } catch (err) {
      setTranscript((prev) => [
        ...prev,
        {
          kind: "error",
          message: err instanceof Error ? err.message : String(err),
        },
      ]);
    } finally {
      setRunning(false);
    }
  }, [prompt, running]);

  return (
    <div className="flex flex-col gap-4">
      {/* Ping / status card */}
      <div className="rounded-card border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft">
            <Sparkles className="h-4 w-4 text-haven-coral-700" />
          </div>
          <div className="flex-1 text-sm">
            <div className="font-semibold">Managed Agent status</div>
            {ping.status === "idle" && (
              <div className="text-muted-foreground">Not checked</div>
            )}
            {ping.status === "checking" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking connection…
              </div>
            )}
            {ping.status === "ok" && (
              <div className="text-muted-foreground">
                Connected to{" "}
                <span className="font-semibold text-foreground">
                  {ping.name}
                </span>{" "}
                · model{" "}
                <span className="font-mono text-xs">{ping.model}</span> · id{" "}
                <span className="font-mono text-xs">{ping.agentId}</span>
              </div>
            )}
            {ping.status === "error" && (
              <div className="text-haven-coral-700">
                Error: {ping.error}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={doPing}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Re-check
          </button>
        </div>
      </div>

      {/* Prompt composer */}
      <div className="rounded-card border border-border bg-card p-4">
        <label
          htmlFor="agent-prompt"
          className="mb-2 block text-sm font-semibold"
        >
          Task
        </label>
        <textarea
          id="agent-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          disabled={running}
          placeholder="Describe what you want the agent to do…"
          className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            The agent runs in a cloud container with bash, file ops, and
            web search.
          </div>
          <button
            type="button"
            onClick={run}
            disabled={running || !prompt.trim() || ping.status !== "ok"}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-95 disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {running ? "Running…" : "Run task"}
          </button>
        </div>
      </div>

      {/* Transcript */}
      <div className="rounded-card border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bot className="h-4 w-4 text-haven-coral-700" />
            Transcript
          </div>
          <div className="text-xs text-muted-foreground">
            {sessionId ? (
              <span className="font-mono">{sessionId}</span>
            ) : (
              <span>No session yet</span>
            )}
          </div>
        </div>
        <div
          ref={scrollerRef}
          className="max-h-[520px] overflow-auto px-4 py-3 text-sm"
        >
          {transcript.length === 0 && !running && (
            <div className="py-8 text-center text-muted-foreground">
              Run a task to see the agent's output stream here.
            </div>
          )}
          {transcript.map((entry, i) => (
            <TranscriptRow key={i} entry={entry} />
          ))}
          {running && transcript.length === 0 && (
            <div className="flex items-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Starting…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TranscriptRow({ entry }: { entry: TranscriptEntry }) {
  if (entry.kind === "status") {
    return (
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        · {entry.value}
      </div>
    );
  }
  if (entry.kind === "text") {
    return (
      <div className="mb-3 whitespace-pre-wrap leading-6">{entry.value}</div>
    );
  }
  if (entry.kind === "tool_use") {
    return (
      <div className="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Wrench className="h-3.5 w-3.5" />
          Tool · {entry.name}
        </div>
        <pre className="mt-1 overflow-auto font-mono text-[11px] text-muted-foreground">
          {JSON.stringify(entry.input, null, 2)}
        </pre>
      </div>
    );
  }
  if (entry.kind === "tool_result") {
    return (
      <div
        className={`mb-3 rounded-md border px-3 py-2 ${
          entry.isError
            ? "border-haven-coral-300 bg-haven-coral-50"
            : "border-border bg-muted/20"
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Terminal className="h-3.5 w-3.5" />
          {entry.isError ? "Tool error" : "Tool result"}
        </div>
        <pre className="mt-1 overflow-auto whitespace-pre-wrap font-mono text-[11px]">
          {entry.output}
        </pre>
      </div>
    );
  }
  return (
    <div className="mb-3 rounded-md border border-haven-coral-300 bg-haven-coral-50 px-3 py-2 text-haven-coral-900">
      <div className="text-xs font-semibold">Error</div>
      <div className="mt-1 text-sm">{entry.message}</div>
    </div>
  );
}
