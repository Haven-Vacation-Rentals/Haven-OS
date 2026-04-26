"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Send,
  Sparkles,
  Lightbulb,
  Plus,
  ListChecks,
  Search,
  ArrowRight,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addSuggestedTopicToBacklog,
  runStudioChat,
} from "@/lib/content/actions";
import {
  PILLAR_LABELS,
  type ContentPillar,
} from "@/lib/content/types";
import type { TopicIdea } from "@/lib/content/topic-intent";

type ChatTurn =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "agent";
      text: string;
      created?: { topicId: string; title: string };
      ideas?: TopicIdea[];
    };

const URGENCY_TONE: Record<TopicIdea["urgency"], string> = {
  now: "bg-haven-coral/15 text-haven-coral-700 border-haven-coral/40",
  this_quarter:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200",
  evergreen:
    "bg-surface-alt text-muted-foreground border-border",
};

const URGENCY_LABEL: Record<TopicIdea["urgency"], string> = {
  now: "Now",
  this_quarter: "This quarter",
  evergreen: "Evergreen",
};

const IMPACT_LABEL: Record<TopicIdea["impact"], string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
};

export function StudioChat({
  spaceId,
  onAdvancedTopic,
}: {
  spaceId: string;
  onAdvancedTopic: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);

  function appendTurn(turn: ChatTurn) {
    setTurns((prev) => [...prev, turn]);
  }

  function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    const userTurn: ChatTurn = {
      id: cryptoId(),
      role: "user",
      text: trimmed,
    };
    appendTurn(userTurn);
    setInput("");

    startTransition(async () => {
      const result = await runStudioChat({
        space_id: spaceId,
        message: trimmed,
      });
      if (!result.ok) {
        toast.error(result.error);
        appendTurn({
          id: cryptoId(),
          role: "agent",
          text: `I couldn't process that — ${result.error}.`,
        });
        return;
      }

      const out = result.data;
      if (out.kind === "created") {
        appendTurn({
          id: cryptoId(),
          role: "agent",
          text: out.message,
          created: { topicId: out.topic.id, title: out.draft.title },
        });
        toast.success("Topic added to backlog");
        router.refresh();
      } else if (out.kind === "ideas") {
        appendTurn({
          id: cryptoId(),
          role: "agent",
          text: out.message,
          ideas: out.ideas,
        });
      } else {
        appendTurn({
          id: cryptoId(),
          role: "agent",
          text: out.message,
        });
      }
    });
  }

  function addIdea(idea: TopicIdea) {
    startTransition(async () => {
      const result = await addSuggestedTopicToBacklog({
        space_id: spaceId,
        idea,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Added to backlog");
      appendTurn({
        id: cryptoId(),
        role: "agent",
        text: `Added "${result.data.title}" to the backlog. Open it to start the brief.`,
        created: { topicId: result.data.id, title: result.data.title },
      });
      router.refresh();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft/60 text-haven-coral">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Topic agent
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Tell me what to write about, or ask me to research ideas.
              I'll add it to the backlog with a brief and key points.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdvancedTopic}
          className="hidden text-[11.5px] font-semibold text-muted-foreground hover:text-foreground sm:inline"
        >
          Advanced form
          <ArrowRight className="ml-0.5 inline h-3 w-3" />
        </button>
      </header>

      {turns.length > 0 ? (
        <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto rounded-md border border-border bg-surface-alt/30 p-3">
          {turns.map((turn) => (
            <ChatBubble key={turn.id} turn={turn} onAddIdea={addIdea} />
          ))}
        </div>
      ) : (
        <ChatPrimer />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-end gap-2 rounded-md border border-border bg-surface focus-within:border-haven-coral/50 focus-within:shadow-ring">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder='e.g. "write about gap nights in Pigeon Forge" or "research ideas"'
            rows={2}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground"
            disabled={pending}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="m-1.5"
            disabled={pending || !input.trim()}
          >
            <Send className="h-3.5 w-3.5" />
            {pending ? "Working" : "Send"}
          </Button>
        </div>

        <QuickActions
          onAction={(text) => send(text)}
          onAdvanced={onAdvancedTopic}
          disabled={pending}
        />
      </form>
    </section>
  );
}

function ChatPrimer() {
  return (
    <div className="rounded-md border border-dashed border-border/70 bg-surface-alt/20 p-3 text-[12.5px] text-muted-foreground">
      <div className="font-semibold text-foreground">Try one of these:</div>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
        <li>"Write about spring booking pace in Gatlinburg."</li>
        <li>"I want a post on owner tax prep."</li>
        <li>"Add a topic about gap nights in Pigeon Forge."</li>
        <li>"Research ideas for May."</li>
      </ul>
    </div>
  );
}

function ChatBubble({
  turn,
  onAddIdea,
}: {
  turn: ChatTurn;
  onAddIdea: (idea: TopicIdea) => void;
}) {
  if (turn.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-md bg-haven-coral/15 px-3 py-2 text-[13px] text-haven-coral-700">
          {turn.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="max-w-[92%] rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-foreground">
        {turn.text}
        {turn.created ? (
          <div className="mt-2">
            <Link
              href={`/content/${turn.created.topicId}` as never}
              className="inline-flex items-center gap-1 rounded-md border border-haven-coral/40 bg-accent-soft/40 px-2 py-1 text-[12px] font-semibold text-haven-coral-700 hover:bg-accent-soft/60"
            >
              Open {turn.created.title}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : null}
      </div>
      {turn.ideas && turn.ideas.length > 0 ? (
        <IdeaList ideas={turn.ideas} onAdd={onAddIdea} />
      ) : null}
    </div>
  );
}

function IdeaList({
  ideas,
  onAdd,
}: {
  ideas: TopicIdea[];
  onAdd: (idea: TopicIdea) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ideas.map((idea, i) => (
        <article
          key={`${idea.title}-${i}`}
          className="flex flex-col gap-1.5 rounded-md border border-border bg-surface p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[13px] font-bold text-foreground">
              {idea.title}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
                URGENCY_TONE[idea.urgency],
              )}
            >
              {URGENCY_LABEL[idea.urgency]}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[10.5px] text-muted-foreground">
            <span className="rounded bg-surface-alt px-1.5 py-0.5 font-semibold uppercase tracking-wide">
              {PILLAR_LABELS[idea.pillar as ContentPillar]}
            </span>
            <span>·</span>
            <span>{IMPACT_LABEL[idea.impact]}</span>
          </div>
          <p className="text-[12px] text-muted-foreground">{idea.rationale}</p>
          <div className="mt-1 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Keyword:</span>{" "}
            {idea.target_keyword}
          </div>
          <div className="mt-1 flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onAdd(idea)}
            >
              <Plus className="h-3 w-3" />
              Add to backlog
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function QuickActions({
  onAction,
  onAdvanced,
  disabled,
}: {
  onAction: (text: string) => void;
  onAdvanced: () => void;
  disabled: boolean;
}) {
  const chips: { label: string; icon: React.ComponentType<{ className?: string }>; text: string }[] = [
    { label: "Add topic", icon: Plus, text: "Write about " },
    { label: "Research ideas", icon: Lightbulb, text: "Research ideas" },
    { label: "Build outline", icon: ListChecks, text: "Build an outline for the most recent topic" },
    { label: "SEO pass", icon: Search, text: "Run an SEO pass on the most recent draft" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip, i) => {
        const Icon = chip.icon;
        const isPrimary = i < 2;
        return (
          <button
            key={chip.label}
            type="button"
            disabled={disabled}
            onClick={() => onAction(chip.text)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition disabled:opacity-50",
              isPrimary
                ? "border-haven-coral/40 bg-accent-soft/40 text-haven-coral-700 hover:bg-accent-soft/60"
                : "border-border bg-surface-alt/40 text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3 w-3" />
            {chip.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAdvanced}
        disabled={disabled}
        className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-transparent px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <Wand2 className="h-3 w-3" />
        Advanced form
      </button>
    </div>
  );
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
