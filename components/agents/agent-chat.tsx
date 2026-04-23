"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  User,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import {
  useAgentThread,
  type AgentMessage,
  type AgentToolCall,
} from "@/lib/agents/use-agent-thread";
import { cn } from "@/lib/utils";

type PingState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; agentId: string; name: string; model: string }
  | { status: "error"; error: string };

const SUGGESTED = [
  "List the files in the working directory and summarize what you find.",
  "Check the Haven OS public site for anything broken.",
  "Search the web for recent Smoky Mountain vacation rental news.",
];

export default function AgentChat() {
  const { messages, sessionId, sending, send, reset } = useAgentThread();
  const [input, setInput] = useState("");
  const [ping, setPing] = useState<PingState>({ status: "idle" });
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

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

  const handleSubmit = useCallback(() => {
    if (!input.trim() || sending || ping.status !== "ok") return;
    const text = input;
    setInput("");
    void send(text);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [input, sending, ping.status, send]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Connection status strip */}
      <div className="flex items-center gap-3 rounded-card border border-border bg-card px-4 py-2.5 text-sm">
        <span
          className={cn(
            "inline-flex h-2 w-2 rounded-full",
            ping.status === "ok" && "bg-green-500",
            ping.status === "error" && "bg-haven-coral-500",
            (ping.status === "checking" || ping.status === "idle") &&
              "bg-muted-foreground",
          )}
        />
        <div className="flex-1 truncate">
          {ping.status === "idle" && (
            <span className="text-muted-foreground">Not connected</span>
          )}
          {ping.status === "checking" && (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking…
            </span>
          )}
          {ping.status === "ok" && (
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">
                {ping.name}
              </span>{" "}
              · {ping.model}
              {sessionId && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-mono text-xs">{sessionId}</span>
                </>
              )}
            </span>
          )}
          {ping.status === "error" && (
            <span className="text-haven-coral-700">{ping.error}</span>
          )}
        </div>
        <button
          type="button"
          onClick={doPing}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
          title="Re-check connection"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={reset}
            disabled={sending}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            New thread
          </button>
        )}
      </div>

      {/* Conversation */}
      <div className="flex flex-col rounded-card border border-border bg-card">
        <div
          ref={scrollerRef}
          className="max-h-[62dvh] min-h-[320px] overflow-auto px-4 py-4"
        >
          {messages.length === 0 ? (
            <EmptyState
              onPick={(p) => {
                setInput(p);
                inputRef.current?.focus();
              }}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-accent/50">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                ping.status === "ok"
                  ? "Ask the HavenOS Agent…"
                  : "Waiting for agent connection…"
              }
              disabled={sending || ping.status !== "ok"}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm focus:outline-none disabled:opacity-50"
              style={{ lineHeight: "1.5", maxHeight: 160 }}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || sending || ping.status !== "ok"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground transition-opacity disabled:opacity-30"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div className="mt-1.5 text-center text-[10.5px] text-muted-foreground/60">
            Enter to send · Shift+Enter for new line · follow-ups reuse the
            same session
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft">
        <Sparkles className="h-6 w-6 text-haven-coral-700" />
      </span>
      <div>
        <p className="font-semibold text-foreground">
          Start a task for the HavenOS Agent
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Runs in a cloud container with bash, files, and web access.
        </p>
      </div>
      <div className="flex w-full max-w-md flex-col gap-2">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-left text-sm text-foreground/80 hover:border-accent/30 hover:bg-accent-soft/40"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: AgentMessage }) {
  const isUser = msg.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full",
          isUser
            ? "bg-foreground text-background"
            : "bg-accent-soft text-haven-coral-700",
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        {msg.toolCalls.length > 0 && (
          <div className="flex w-full flex-col gap-1.5">
            {msg.toolCalls.map((tc) => (
              <ToolCallRow key={tc.id} call={tc} />
            ))}
          </div>
        )}

        {(msg.text || msg.streaming) && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              isUser
                ? "bg-foreground text-background rounded-br-sm"
                : "bg-muted/40 text-foreground rounded-bl-sm",
            )}
          >
            {msg.text ? (
              <span className="whitespace-pre-wrap">{msg.text}</span>
            ) : msg.streaming ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </span>
            ) : null}
          </div>
        )}

        {msg.error && (
          <div className="flex items-center gap-2 rounded-md border border-haven-coral-300 bg-haven-coral-50 px-3 py-2 text-xs text-haven-coral-900">
            <AlertTriangle className="h-3.5 w-3.5" />
            {msg.error}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool call disclosure
// ---------------------------------------------------------------------------

function ToolCallRow({ call }: { call: AgentToolCall }) {
  const [open, setOpen] = useState(false);
  const hasResult = call.result !== undefined;
  return (
    <div className="w-full rounded-md border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] font-medium text-foreground/80 hover:bg-muted/40"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Wrench className="h-3 w-3" />
        <span className="font-mono">{call.name}</span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {hasResult
            ? call.isError
              ? "error"
              : "done"
            : "running…"}
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2 text-[11px]">
          <div className="font-semibold text-muted-foreground">Input</div>
          <pre className="mt-1 overflow-auto whitespace-pre-wrap font-mono">
            {JSON.stringify(call.input, null, 2)}
          </pre>
          {hasResult && (
            <>
              <div className="mt-2 font-semibold text-muted-foreground">
                {call.isError ? "Error" : "Result"}
              </div>
              <pre
                className={cn(
                  "mt-1 overflow-auto whitespace-pre-wrap font-mono",
                  call.isError && "text-haven-coral-800",
                )}
              >
                {call.result}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
