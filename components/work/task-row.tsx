"use client";

import { useTransition } from "react";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  GripVertical,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { updateTask } from "@/lib/work/actions";
import type { TaskWithRelations, Status, TaskPriority } from "@/lib/work/types";

const priorityConfig: Record<
  TaskPriority,
  { label: string; class: string }
> = {
  urgent: { label: "Urgent", class: "text-rose-600" },
  high: { label: "High", class: "text-amber-600" },
  normal: { label: "Normal", class: "text-sky-600" },
  low: { label: "Low", class: "text-foreground/50" },
  none: { label: "", class: "" },
};

export function TaskRow({
  task,
  statuses,
  onSelect,
}: {
  task: TaskWithRelations;
  statuses: Status[];
  onSelect: (taskId: string) => void;
}) {
  const [pending, start] = useTransition();
  const isDone =
    task.status?.category === "done" || task.status?.category === "closed";

  function cycleStatus() {
    const currentIdx = statuses.findIndex((s) => s.id === task.status_id);
    const next = statuses[(currentIdx + 1) % statuses.length];
    if (next) {
      start(async () => {
        await updateTask(task.id, { status_id: next.id });
      });
    }
  }

  const priority = priorityConfig[task.priority];

  return (
    <div
      className={cn(
        "group flex items-center gap-2 border-b border-border/50 px-3 py-2",
        "hover:bg-surface-alt/50 transition-colors",
        pending && "opacity-60",
      )}
    >
      {/* Status toggle */}
      <button
        type="button"
        onClick={cycleStatus}
        className="shrink-0"
        title={task.status?.name ?? "No status"}
      >
        {isDone ? (
          <CheckCircle2
            className="h-4.5 w-4.5"
            style={{ color: task.status?.color }}
          />
        ) : (
          <Circle
            className="h-4.5 w-4.5"
            style={{ color: task.status?.color ?? "#94a3b8" }}
          />
        )}
      </button>

      {/* Title */}
      <button
        type="button"
        onClick={() => onSelect(task.id)}
        className={cn(
          "min-w-0 flex-1 truncate text-left text-[13.5px] font-medium",
          isDone && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </button>

      {/* Priority */}
      {task.priority !== "none" ? (
        <span className={cn("text-[11px] font-bold uppercase", priority.class)}>
          {priority.label}
        </span>
      ) : null}

      {/* Assignees */}
      {task.assignees.length > 0 ? (
        <div className="flex -space-x-1.5">
          {task.assignees.slice(0, 3).map((a) =>
            a.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={a.id}
                src={a.avatar_url}
                alt={a.full_name ?? ""}
                className="h-5 w-5 rounded-full ring-1 ring-background"
              />
            ) : (
              <span
                key={a.id}
                className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[9px] font-bold ring-1 ring-background"
              >
                {(a.full_name ?? "?").slice(0, 1)}
              </span>
            ),
          )}
        </div>
      ) : null}

      {/* Due date */}
      {task.due_date ? (
        <span
          className={cn(
            "flex items-center gap-1 text-[11.5px] font-medium",
            isOverdue(task.due_date) && !isDone
              ? "text-rose-600"
              : "text-muted-foreground",
          )}
        >
          <Calendar className="h-3 w-3" />
          {formatDueDate(task.due_date)}
        </span>
      ) : null}

      {/* Subtask count */}
      {task.subtask_count > 0 ? (
        <Badge tone="neutral" className="text-[10px]">
          {task.subtask_count} sub
        </Badge>
      ) : null}
    </div>
  );
}

function formatDueDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  const diffDays = Math.round(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(iso: string): boolean {
  return new Date(iso + "T23:59:59") < new Date();
}
