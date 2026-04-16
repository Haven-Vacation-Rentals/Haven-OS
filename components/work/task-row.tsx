"use client";

import { useTransition } from "react";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { updateTask } from "@/lib/work/actions";
import type {
  TaskWithRelations,
  Status,
  TaskPriority,
  CustomFieldDef,
} from "@/lib/work/types";

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
  fieldDefs,
  onSelect,
}: {
  task: TaskWithRelations;
  statuses: Status[];
  fieldDefs: CustomFieldDef[];
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

  function saveField(fieldId: string, value: unknown) {
    start(async () => {
      await updateTask(task.id, {
        custom_fields: { ...task.custom_fields, [fieldId]: value },
      });
    });
  }

  const priority = priorityConfig[task.priority];

  return (
    <div
      className={cn(
        "group flex items-center border-b border-border/50",
        "hover:bg-surface-alt/50 transition-colors",
        pending && "opacity-60",
      )}
    >
      {/* Left: status + title (flexible) */}
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
        {/* Status toggle */}
        <button
          type="button"
          onClick={cycleStatus}
          className="shrink-0"
          title={task.status?.name ?? "No status"}
        >
          {isDone ? (
            <CheckCircle2
              className="h-[18px] w-[18px]"
              style={{ color: task.status?.color }}
            />
          ) : (
            <Circle
              className="h-[18px] w-[18px]"
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
      </div>

      {/* Right: fields strip — priority, assignees, custom fields, due date */}
      <div className="flex shrink-0 items-center gap-px">
        {/* Priority */}
        <FieldCell width={72}>
          {task.priority !== "none" ? (
            <span
              className={cn("text-[11px] font-bold uppercase", priority.class)}
            >
              {priority.label}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/40">—</span>
          )}
        </FieldCell>

        {/* Assignees */}
        <FieldCell width={64}>
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
          ) : (
            <span className="text-[11px] text-muted-foreground/40">—</span>
          )}
        </FieldCell>

        {/* Due date */}
        <FieldCell width={88}>
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
          ) : (
            <span className="text-[11px] text-muted-foreground/40">—</span>
          )}
        </FieldCell>

        {/* Custom field columns */}
        {fieldDefs.map((fd) => (
          <FieldCell key={fd.id} width={fieldCellWidth(fd)}>
            <InlineFieldValue
              def={fd}
              value={task.custom_fields[fd.id]}
              onChange={(val) => saveField(fd.id, val)}
            />
          </FieldCell>
        ))}

        {/* Subtask count */}
        <FieldCell width={48}>
          {task.subtask_count > 0 ? (
            <Badge tone="neutral" className="text-[10px]">
              {task.subtask_count}
            </Badge>
          ) : null}
        </FieldCell>
      </div>
    </div>
  );
}

// --- Field cell wrapper (fixed-width column) ---------------------------------

function FieldCell({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-center border-l border-border/30 px-2 py-2"
      style={{ width }}
    >
      {children}
    </div>
  );
}

// --- Column header row -------------------------------------------------------

export function TaskRowHeader({
  fieldDefs,
}: {
  fieldDefs: CustomFieldDef[];
}) {
  return (
    <div className="flex items-center border-b border-border bg-surface-alt/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      <div className="min-w-0 flex-1 px-3 py-1.5">Task</div>
      <div className="flex shrink-0 items-center gap-px">
        <HeaderCell width={72}>Priority</HeaderCell>
        <HeaderCell width={64}>Assignee</HeaderCell>
        <HeaderCell width={88}>Due Date</HeaderCell>
        {fieldDefs.map((fd) => (
          <HeaderCell key={fd.id} width={fieldCellWidth(fd)}>
            {fd.name}
          </HeaderCell>
        ))}
        <HeaderCell width={48}>Sub</HeaderCell>
      </div>
    </div>
  );
}

function HeaderCell({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-center border-l border-border/30 px-2 py-1.5"
      style={{ width }}
    >
      {children}
    </div>
  );
}

// --- Inline custom field value (editable in-row) -----------------------------

function InlineFieldValue({
  def,
  value,
  onChange,
}: {
  def: CustomFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  switch (def.field_type) {
    case "checkbox":
      return (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={cn(
            "grid h-4 w-4 place-items-center rounded border",
            value
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface",
          )}
        >
          {value ? <Check className="h-3 w-3" /> : null}
        </button>
      );

    case "select": {
      const options = (
        (def.config as Record<string, unknown>)?.options ?? []
      ) as { value: string; label: string; color?: string }[];
      const selected = options.find((o) => o.value === value);
      return selected ? (
        <Badge
          tone="sage"
          className="max-w-full truncate text-[10px]"
          style={
            selected.color
              ? { backgroundColor: selected.color + "20", color: selected.color }
              : undefined
          }
        >
          {selected.label}
        </Badge>
      ) : (
        <span className="text-[11px] text-muted-foreground/40">—</span>
      );
    }

    case "currency":
    case "number":
    case "percent": {
      const num = value as number | null | undefined;
      if (num == null) {
        return (
          <span className="text-[11px] text-muted-foreground/40">—</span>
        );
      }
      let display = String(num);
      if (def.field_type === "currency") display = `$${num.toLocaleString()}`;
      if (def.field_type === "percent") display = `${num}%`;
      return (
        <span className="text-[11.5px] font-medium text-foreground/80 tabular-nums">
          {display}
        </span>
      );
    }

    case "date": {
      const d = value as string | null | undefined;
      if (!d) {
        return (
          <span className="text-[11px] text-muted-foreground/40">—</span>
        );
      }
      return (
        <span className="text-[11px] text-muted-foreground">
          {formatDueDate(d)}
        </span>
      );
    }

    case "text":
    case "url":
    case "email":
    case "phone": {
      const s = value as string | null | undefined;
      return s ? (
        <span className="max-w-full truncate text-[11.5px] text-foreground/80">
          {s}
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground/40">—</span>
      );
    }

    case "labels":
    case "multi_select": {
      const arr = (value ?? []) as string[];
      return arr.length > 0 ? (
        <div className="flex gap-0.5 overflow-hidden">
          {arr.slice(0, 2).map((v) => (
            <Badge key={v} tone="sage" className="truncate text-[9px]">
              {v}
            </Badge>
          ))}
          {arr.length > 2 ? (
            <span className="text-[9px] text-muted-foreground">
              +{arr.length - 2}
            </span>
          ) : null}
        </div>
      ) : (
        <span className="text-[11px] text-muted-foreground/40">—</span>
      );
    }

    default:
      return (
        <span className="text-[11px] text-muted-foreground/40">—</span>
      );
  }
}

// --- Utilities ---------------------------------------------------------------

function fieldCellWidth(def: CustomFieldDef): number {
  switch (def.field_type) {
    case "checkbox":
      return 48;
    case "number":
    case "currency":
    case "percent":
      return 72;
    case "date":
      return 88;
    case "select":
    case "multi_select":
    case "labels":
      return 100;
    default:
      return 96;
  }
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
