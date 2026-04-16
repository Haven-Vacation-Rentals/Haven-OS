"use client";

import { useState, useTransition, useRef } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTask } from "@/lib/work/actions";

export function AddTaskRow({ listId }: { listId: string }) {
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const t = title.trim();
    if (!t) return;
    start(async () => {
      await createTask({ list_id: listId, title: t });
      setTitle("");
      inputRef.current?.focus();
    });
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => {
          setActive(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={cn(
          "flex w-full items-center gap-2 py-2.5 text-[13px] font-medium",
          "text-muted-foreground hover:bg-surface-alt/50 hover:text-foreground transition-colors",
          /* Align with the task title: drag-handle(24) + expand(20) + status(22) + margin */
          "pl-[72px]",
        )}
      >
        <Plus className="h-4 w-4" />
        Add task
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2 border-b border-border/50 py-2 pl-[72px] pr-3"
    >
      <Plus className="h-4 w-4 text-accent shrink-0" />
      <input
        ref={inputRef}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (!title.trim()) setActive(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setTitle("");
            setActive(false);
          }
        }}
        placeholder="Task name — press Enter to add, Esc to cancel"
        disabled={pending}
        className={cn(
          "flex-1 bg-transparent text-[13.5px] font-medium outline-none",
          "placeholder:text-muted-foreground/50",
          pending && "opacity-50",
        )}
      />
      <span className="haven-kbd text-[9px]">Enter</span>
    </form>
  );
}
