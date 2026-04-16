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
        className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-surface-alt/50 hover:text-foreground transition-colors"
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
      className="flex items-center gap-2 border-b border-border/50 px-3 py-2"
    >
      <Plus className="h-4 w-4 text-accent" />
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
        placeholder="Task name — press Enter to add"
        disabled={pending}
        className={cn(
          "flex-1 bg-transparent text-[13.5px] font-medium outline-none",
          "placeholder:text-muted-foreground/60",
        )}
      />
      <span className="haven-kbd">↵</span>
    </form>
  );
}
