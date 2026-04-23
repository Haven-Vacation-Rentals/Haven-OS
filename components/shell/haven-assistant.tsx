"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, X, Send, Loader2, Database, CheckSquare, Building2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const TOOL_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  get_active_scorecard:   { label: "Reading scorecard…",    icon: BarChart3 },
  list_scorecard_months:  { label: "Listing months…",       icon: BarChart3 },
  get_scorecard_month:    { label: "Loading month…",        icon: BarChart3 },
  update_scorecard_cell:  { label: "Updating scorecard…",   icon: BarChart3 },
  search_tasks:           { label: "Searching tasks…",      icon: CheckSquare },
  get_task:               { label: "Loading task…",         icon: CheckSquare },
  get_my_tasks:           { label: "Getting your tasks…",   icon: CheckSquare },
  list_spaces:            { label: "Loading spaces…",       icon: CheckSquare },
  get_team_members:       { label: "Getting team…",         icon: CheckSquare },
  create_task:            { label: "Creating task…",        icon: CheckSquare },
  update_task:            { label: "Updating task…",        icon: CheckSquare },
  add_task_comment:       { label: "Adding comment…",       icon: CheckSquare },
  list_properties:        { label: "Loading properties…",   icon: Building2 },
  get_property:           { label: "Loading property…",     icon: Building2 },
};

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  text: string;
  toolCalls?: string[];
  loading?: boolean;
}

interface HavenAssistantProps {
  open: boolean;
  onClose: () => void;
}

function ToolCallBadge({ names }: { names: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      {names.map((n) => {
        const meta = TOOL_LABELS[n] ?? { label: n.replace(/_/g, " ") + "…", icon: Database };
        const Icon = meta.icon;
        return (
          <span key={n} className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
            <Icon className="h-3 w-3 shrink-0" />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed",
          isUser
            ? "bg-foreground text-background rounded-br-sm"
            : "bg-surface-alt border border-border text-foreground rounded-bl-sm",
        )}
      >
        {msg.loading ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking…
          </span>
        ) : (
          <>
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="mb-2">
                <ToolCallBadge names={msg.toolCalls} />
              </div>
            )}
            <span className="whitespace-pre-wrap">{msg.text}</span>
          </>
        )}
      </div>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  "What are my open tasks this week?",
  "Which scorecard metrics are red or yellow?",
  "How many live properties do we have?",
  "Show me all overdue tasks",
  "Summarize this month's scorecard",
];

export function HavenAssistant({ open, onClose }: HavenAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || streaming) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        text: userText.trim(),
      };
      const loadingMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "",
        loading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setInput("");
      setStreaming(true);

      // Build history for API (exclude the loading placeholder)
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.text,
      }));

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error("Request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        let toolCallNames: string[] = [];
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            const event = JSON.parse(raw) as {
              type: string;
              text?: string;
              tools?: Array<{ name: string }>;
              message?: string;
            };

            if (event.type === "text") {
              assistantText += event.text ?? "";
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === loadingMsg.id
                    ? { ...m, loading: false, text: assistantText, toolCalls: toolCallNames }
                    : m,
                ),
              );
            } else if (event.type === "tool_calls") {
              toolCallNames = (event.tools ?? []).map((t) => t.name);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === loadingMsg.id ? { ...m, toolCalls: toolCallNames } : m,
                ),
              );
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === loadingMsg.id
                    ? { ...m, loading: false, text: `Error: ${event.message}`, toolCalls: [] }
                    : m,
                ),
              );
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? { ...m, loading: false, text: "Something went wrong. Please try again." }
              : m,
          ),
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
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
          "fixed bottom-4 right-4 z-50 flex flex-col",
          "w-[420px] max-h-[calc(100dvh-2rem)]",
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
          <div className="flex-1">
            <p className="text-[13.5px] font-semibold text-foreground">Haven Assistant</p>
            <p className="text-[11px] text-muted-foreground">Powered by Claude</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-alt hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground">
                <Sparkles className="h-6 w-6 text-accent" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Ask me anything</p>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">
                  I can read your scorecard, properties, and more
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
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
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-alt px-3 py-2 focus-within:border-accent/50 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Haven Assistant…"
              disabled={streaming}
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
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                "bg-foreground text-background",
                "transition-opacity",
                "disabled:opacity-30",
              )}
            >
              {streaming ? (
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
