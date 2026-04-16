"use client";

/**
 * ListAddRow — inline "Add task" row for the Tendwell-style list view.
 *
 * - Shows a "+ Add task" prompt button
 * - On click (or 'n' key from parent), opens an input
 * - Enter = save (fires createTask, keeps input focused for rapid entry)
 * - Esc = cancel
 * - Blur with empty = cancel
 */

import { useState, useRef, useTransition } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTask } from "@/lib/work/actions";
import type { TaskWithSubtasks } from "@/lib/work/actions";

export function ListAddRow({
  listId,
  statusId,
  parentId,
  depth = 0,
  onAdded,
}: {
  listId: string;
  statusId: string | null;
  parentId?: string;
  depth?: number;
  onAdded?: (task: TaskWithSubtasks) => void;
}) {
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function activate() {
    setActive(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function submit() {
    const t = title.trim();
    if (!t) return;
    start(async () => {
      const task = await createTask({
        list_id: listId,
        title: t,
        ...(statusId ? { status_id: statusId } : {}),
        ...(parentId ? { parent_id: parentId } : {}),
      });
      setTitle("");
      inputRef.current?.focus();
      // Notify parent of new task (minimal shape — revalidatePath will refresh server data)
      onAdded?.({
        ...task,
        status: null,
        subtask_count: 0,
        subtask_list: [],
        subtasks_done: 0,
        assignees: [],
      } as TaskWithSubtasks);
    });
  }

  if (!active) {
    return (
      <button
        type="button"
        data-add-task-trigger
        onClick={activate}
        style={{ paddingLeft: `${(depth * 20) + 68}px` }}
        className={cn(
          "flex w-full items-center gap-2 py-2 text-[13px] font-medium",
          "text-muted-foreground hover:bg-surface-alt/50 hover:text-foreground transition-colors",
          "border-b border-border/30",
        )}
      >
        <Plus className="h-3.5 w-3.5 shrink-0" />
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
      style={{ paddingLeft: `${(depth * 20) + 56}px` }}
      className="flex items-center gap-2 border-b border-border/50 py-2 pr-3"
    >
      <Plus className="h-3.5 w-3.5 text-accent shrink-0" />
      <input
        ref={inputRef}
        data-add-task-input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (!title.trim()) {
            setActive(false);
          }
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
