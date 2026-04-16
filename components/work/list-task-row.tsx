"use client";

/**
 * ListTaskRow — individual task row for the Tendwell-style list view.
 *
 * Supports:
 * - Status toggle (circle → checkmark for done)
 * - Inline title editing (double-click)
 * - Priority dropdown
 * - Assignee avatar stack
 * - Due date display + inline picker
 * - Subtask count indicator ({done}/{total})
 * - Expand/collapse subtasks caret
 * - Right-click context menu trigger
 */

import { useState, useRef, useEffect, useTransition } from "react";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  Calendar,
  UserCircle2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addAssignee, removeAssignee } from "@/lib/work/actions";
import type { Status, TaskPriority } from "@/lib/work/types";
import type { TaskWithSubtasks } from "@/lib/work/actions";

// ---------------------------------------------------------------------------
// Priority config
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; dot: string; text: string; abbr: string }
> = {
  urgent: {
    label: "Urgent",
    dot: "bg-rose-500",
    text: "text-rose-600",
    abbr: "URG",
  },
  high: {
    label: "High",
    dot: "bg-amber-500",
    text: "text-amber-600",
    abbr: "HIGH",
  },
  normal: {
    label: "Normal",
    dot: "bg-sky-500",
    text: "text-sky-600",
    abbr: "NRM",
  },
  low: {
    label: "Low",
    dot: "bg-foreground/30",
    text: "text-foreground/50",
    abbr: "LOW",
  },
  none: { label: "None", dot: "", text: "text-muted-foreground/30", abbr: "" },
};

const PRIORITY_OPTIONS: TaskPriority[] = [
  "urgent",
  "high",
  "normal",
  "low",
  "none",
];

// ---------------------------------------------------------------------------
// ListTaskRow
// ---------------------------------------------------------------------------

export function ListTaskRow({
  task,
  statuses,
  members,
  depth,
  expandedSubtasks,
  onToggleSubtasks,
  onSelect,
  onToggleDone,
  onUpdate,
  onContextMenu,
}: {
  task: TaskWithSubtasks;
  statuses: Status[];
  members: { id: string; full_name: string | null; avatar_url: string | null }[];
  depth: number;
  expandedSubtasks: Set<string>;
  onToggleSubtasks: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleDone: (task: TaskWithSubtasks) => void;
  onUpdate: (id: string, updates: Partial<TaskWithSubtasks>) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string) => void;
}) {
  const isDone =
    task.status?.category === "done" || task.status?.category === "closed";
  const hasSubtasks = (task.subtask_count ?? 0) > 0;
  const isExpanded = expandedSubtasks.has(task.id);

  // Sub-task done fraction
  const subsDone = (task as TaskWithSubtasks).subtasks_done ?? 0;
  const subsTot = task.subtask_count ?? 0;

  return (
    <div
      className={cn(
        "group flex items-center border-b border-border/50 transition-all duration-100",
        "hover:bg-surface-alt/40",
        isDone && "opacity-70",
      )}
      onContextMenu={(e) => onContextMenu(e, task.id)}
      style={{ paddingLeft: depth * 20 }}
    >
      {/* ── Left sticky section ───────────────────────────────────────── */}
      <div className="sticky left-0 z-10 flex min-w-0 flex-1 items-center bg-inherit">
        {/* Drag handle (visual only for now) */}
        <span
          className={cn(
            "flex h-full w-5 shrink-0 cursor-grab items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity",
          )}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground/40" />
        </span>

        {/* Expand/collapse subtasks caret */}
        {hasSubtasks ? (
          <button
            type="button"
            onClick={() => onToggleSubtasks(task.id)}
            className="grid h-5 w-5 shrink-0 place-items-center transition-transform"
            title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* Status toggle (circle / check) */}
        <button
          type="button"
          onClick={() => onToggleDone(task)}
          className="shrink-0 p-0.5 transition-transform hover:scale-110"
          title={isDone ? "Mark as To Do" : "Mark as Done"}
        >
          {isDone ? (
            <CheckCircle2
              className="h-[18px] w-[18px]"
              style={{ color: task.status?.color ?? "#22c55e" }}
            />
          ) : (
            <Circle
              className="h-[18px] w-[18px]"
              style={{ color: task.status?.color ?? "#94a3b8" }}
            />
          )}
        </button>

        {/* Title */}
        <InlineTitle
          title={task.title}
          isDone={isDone}
          onOpen={() => onSelect(task.id)}
          onSave={(v) => onUpdate(task.id, { title: v })}
        />
      </div>

      {/* ── Right fields strip ────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center">
        {/* Priority */}
        <PriorityCell
          value={task.priority}
          onChange={(v) => onUpdate(task.id, { priority: v })}
        />

        {/* Assignees */}
        <AssigneeCell
          taskId={task.id}
          assignees={task.assignees}
          allMembers={members}
        />

        {/* Due date */}
        <DueDateCell
          value={task.due_date}
          isDone={isDone}
          onChange={(v) => onUpdate(task.id, { due_date: v })}
        />

        {/* Subtask count */}
        <div
          className="flex items-center justify-center border-l border-border/30 px-2 py-2"
          style={{ width: 56 }}
        >
          {subsTot > 0 ? (
            <button
              type="button"
              onClick={() => onToggleSubtasks(task.id)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums transition-colors",
                subsDone === subsTot
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "bg-surface-alt text-muted-foreground hover:bg-muted",
              )}
              title="Subtasks"
            >
              {subsDone}/{subsTot}
            </button>
          ) : (
            <span className="text-[11px] text-muted-foreground/30">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InlineTitle
// ---------------------------------------------------------------------------

function InlineTitle({
  title,
  isDone,
  onOpen,
  onSave,
}: {
  title: string;
  isDone: boolean;
  onOpen: () => void;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(title);
  }, [title]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const v = value.trim();
          if (v && v !== title) onSave(v);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
        className="mx-1.5 min-w-0 flex-1 bg-transparent text-[13.5px] font-medium outline-none ring-1 ring-accent/40 rounded px-1 py-0.5"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setValue(title);
        setEditing(true);
      }}
      className={cn(
        "mx-1.5 min-w-0 flex-1 truncate text-left text-[13.5px] font-medium",
        "rounded px-1 py-0.5 transition-colors hover:bg-surface-alt",
        isDone && "text-muted-foreground line-through",
      )}
      title="Click to view · Double-click to edit"
    >
      {title}
    </button>
  );
}

// ---------------------------------------------------------------------------
// PriorityCell
// ---------------------------------------------------------------------------

function PriorityCell({
  value,
  onChange,
}: {
  value: TaskPriority;
  onChange: (v: TaskPriority) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const p = PRIORITY_CONFIG[value];

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center border-l border-border/30 px-2 py-2 hover:bg-surface-alt transition-colors cursor-pointer"
        style={{ width: 80 }}
        title={p.label || "Priority"}
      >
        {value !== "none" ? (
          <span className={cn("flex items-center gap-1 text-[11px] font-bold uppercase", p.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", p.dot)} />
            {p.abbr}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/30">—</span>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-card border border-border bg-surface py-1 shadow-card-hover animate-slide-up">
          {PRIORITY_OPTIONS.map((opt) => {
            const cfg = PRIORITY_CONFIG[opt];
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-[12px] font-medium hover:bg-surface-alt transition-colors",
                  opt === value && "bg-accent-soft text-accent",
                )}
              >
                {opt !== "none" ? (
                  <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot)} />
                ) : (
                  <span className="h-2 w-2" />
                )}
                {cfg.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AssigneeCell
// ---------------------------------------------------------------------------

function AssigneeCell({
  taskId,
  assignees,
  allMembers,
}: {
  taskId: string;
  assignees: { id: string; full_name: string | null; avatar_url: string | null }[];
  allMembers: { id: string; full_name: string | null; avatar_url: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const assigneeIds = new Set(assignees.map((a) => a.id));

  function toggle(memberId: string) {
    start(async () => {
      if (assigneeIds.has(memberId)) {
        await removeAssignee(taskId, memberId);
      } else {
        await addAssignee(taskId, memberId);
      }
    });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center border-l border-border/30 px-2 py-2 hover:bg-surface-alt transition-colors cursor-pointer"
        style={{ width: 72 }}
        title="Assignees"
      >
        {assignees.length > 0 ? (
          <div className="flex -space-x-1.5">
            {assignees.slice(0, 3).map((a) =>
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
                  className="grid h-5 w-5 place-items-center rounded-full bg-accent/20 text-[9px] font-bold ring-1 ring-background"
                  title={a.full_name ?? ""}
                >
                  {(a.full_name ?? "?").slice(0, 1)}
                </span>
              ),
            )}
          </div>
        ) : (
          <UserCircle2 className="h-4 w-4 text-muted-foreground/30" />
        )}
      </button>

      {open && allMembers.length > 0 ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-card border border-border bg-surface py-1 shadow-card-hover animate-slide-up max-h-64 overflow-y-auto">
          {allMembers.map((m) => {
            const isAssigned = assigneeIds.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-[12px] font-medium hover:bg-surface-alt transition-colors",
                  isAssigned && "bg-accent-soft",
                )}
              >
                {m.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.avatar_url}
                    alt={m.full_name ?? ""}
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[9px] font-bold">
                    {(m.full_name ?? "?").slice(0, 1)}
                  </span>
                )}
                <span className="truncate">{m.full_name ?? m.id.slice(0, 8)}</span>
                {isAssigned ? (
                  <span className="ml-auto text-accent">✓</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DueDateCell
// ---------------------------------------------------------------------------

function DueDateCell({
  value,
  isDone,
  onChange,
}: {
  value: string | null;
  isDone: boolean;
  onChange: (v: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.showPicker?.();
    }
  }, [editing]);

  if (editing) {
    return (
      <div
        className="flex items-center border-l border-border/30 px-1 py-1"
        style={{ width: 96 }}
      >
        <input
          ref={inputRef}
          type="date"
          defaultValue={value ?? ""}
          autoFocus
          onChange={(e) => {
            onChange(e.target.value || null);
            setEditing(false);
          }}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-6 w-full rounded border-none bg-transparent text-[11px] outline-none"
        />
      </div>
    );
  }

  const { label, cls } = formatDueDate(value);

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center justify-center border-l border-border/30 px-2 py-2 hover:bg-surface-alt transition-colors cursor-pointer"
      style={{ width: 96 }}
      title="Due date"
    >
      {value ? (
        <span
          className={cn(
            "flex items-center gap-1 text-[11.5px] font-medium",
            isDone ? "text-muted-foreground" : cls,
          )}
        >
          <Calendar className="h-3 w-3 shrink-0" />
          {label}
        </span>
      ) : (
        <Calendar className="h-3.5 w-3.5 text-muted-foreground/25" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatDueDate(dateStr: string | null): { label: string; cls: string } {
  if (!dateStr) return { label: "", cls: "" };
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const isOverdue = d < todayStart;
  const isToday = d >= todayStart && d <= todayEnd;

  let label: string;
  const diffDays = Math.round((d.getTime() - todayStart.getTime()) / 86400000);

  if (isToday) {
    label = "Today";
  } else if (diffDays === 1) {
    label = "Tomorrow";
  } else if (diffDays === -1) {
    label = "Yesterday";
  } else if (isOverdue) {
    label = `${Math.abs(diffDays)}d overdue`;
  } else if (diffDays <= 7) {
    label = `${diffDays}d`;
  } else {
    label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const cls = isOverdue
    ? "text-rose-600 dark:text-rose-400"
    : isToday
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";

  return { label, cls };
}
