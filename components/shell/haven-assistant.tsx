"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Wrench,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAgentThread,
  type AgentMessage,
  type AgentToolCall,
} from "@/lib/agents/use-agent-thread";

interface HavenAssistantProps {
  open: boolean;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  "What are my open tasks this week?",
  "Which scorecard metrics are red or yellow?",
  "How many live properties do we have?",
];

export function HavenAssistant({ open, onClose }: HavenAssistantProps) {
  const { messages, sessionId, sending, send, reset } = useAgentThread();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSend = (text: string) => {
    const clean = text.trim();
    if (!clean || sending) return;
    setInput("");
    void send(clean);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-4 sm:right-4 z-50 flex flex-col",
          "w-auto sm:w-[440px] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)]",
          "rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20",
          "animate-in slide-in-from-bottom-4 fade-in duration-200",
        )}
        role="dialog"
        aria-label="Haven Assistant"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-foreground">
              Haven Assistant
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {sessionId ? (
                <>
                  HavenOS Agent ·{" "}
                  <span className="font-mono">{sessionId.slice(0, 18)}…</span>
                </>
              ) : (
                "HavenOS Agent"
              )}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              disabled={sending}
              title="New conversation"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-alt hover:text-foreground disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-alt hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          {messages.length === 0 ? (
            <EmptyState onPick={(p) => handleSend(p)} />
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <CompactMessage key={m.id} msg={m} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-alt px-3 py-2 focus-within:border-accent/50">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Haven Assistant…"
              disabled={sending}
              rows={1}
              className={cn(
                "flex-1 resize-none bg-transparent text-[13.5px] text-foreground",
                "placeholder:text-muted-foreground/60",
                "focus:outline-none",
                "max-h-32 overflow-y-auto",
                "disabled:opacity-50",
              )}
              style={{ lineHeight: "1.5" }}
            />
            <button
              type="button"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || sending}
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                "bg-foreground text-background",
                "transition-opacity",
                "disabled:opacity-30",
              )}
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10.5px] text-muted-foreground/50">
            Enter to send · Shift+Enter for new line · Esc to close
          </p>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground">
        <Sparkles className="h-6 w-6 text-accent" />
      </span>
      <div>
        <p className="font-semibold text-foreground">Ask me anything</p>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          I use the HavenOS Agent with tools + web access
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className={cn(
              "w-full rounded-xl border border-border bg-surface-alt px-3 py-2",
              "text-left text-[12.5px] text-foreground/80",
              "hover:bg-accent/5 hover:border-accent/30 hover:text-foreground",
              "transition-colors",
            )}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact message bubble (side panel variant)
// ---------------------------------------------------------------------------

function CompactMessage({ msg }: { msg: AgentMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-full",
          isUser
            ? "bg-foreground text-background"
            : "bg-accent/10 text-accent",
        )}
      >
        {isUser ? (
          <User className="h-3 w-3" />
        ) : (
          <Bot className="h-3 w-3" />
        )}
      </div>
      <div
        className={cn(
          "flex max-w-[88%] flex-col gap-1.5",
          isUser ? "items-end" : "items-start",
        )}
      >
        {msg.toolCalls.length > 0 && (
          <div className="flex w-full flex-col gap-1">
            {msg.toolCalls.map((tc) => (
              <CompactTool key={tc.id} call={tc} />
            ))}
          </div>
        )}
        {(msg.text || msg.streaming) && (
          <div
            className={cn(
              "rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
              isUser
                ? "bg-foreground text-background rounded-br-sm"
                : "bg-surface-alt border border-border text-foreground rounded-bl-sm",
            )}
          >
            {msg.text ? (
              <span className="whitespace-pre-wrap">{msg.text}</span>
            ) : msg.streaming ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking…
              </span>
            ) : null}
          </div>
        )}
        {msg.error && (
          <div className="flex items-center gap-1.5 rounded-md border border-haven-coral-300 bg-haven-coral-50 px-2 py-1 text-[11px] text-haven-coral-900">
            <AlertTriangle className="h-3 w-3" />
            {msg.error}
          </div>
        )}
      </div>
    </div>
  );
}

function CompactTool({ call }: { call: AgentToolCall }) {
  const [open, setOpen] = useState(false);
  const hasResult = call.result !== undefined;
  return (
    <div className="w-full rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-[11px] font-medium text-foreground/70 hover:bg-surface-alt"
      >
        {open ? (
          <ChevronDown className="h-2.5 w-2.5" />
        ) : (
          <ChevronRight className="h-2.5 w-2.5" />
        )}
        <Wrench className="h-2.5 w-2.5" />
        <span className="font-mono">{call.name}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {hasResult ? (call.isError ? "error" : "done") : "…"}
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-2 py-1.5 text-[10.5px]">
          <pre className="max-h-28 overflow-auto whitespace-pre-wrap font-mono">
            {JSON.stringify(call.input, null, 2)}
          </pre>
          {hasResult && (
            <pre
              className={cn(
                "mt-1 max-h-28 overflow-auto whitespace-pre-wrap font-mono",
                call.isError && "text-haven-coral-800",
              )}
            >
              {call.result}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
