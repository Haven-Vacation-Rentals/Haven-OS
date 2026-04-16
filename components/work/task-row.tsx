"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Check,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { updateTask } from "@/lib/work/actions";
import type {
  FlatTask,
  Status,
  TaskPriority,
  CustomFieldDef,
} from "@/lib/work/types";

// ---------------------------------------------------------------------------
// Priority config
// ---------------------------------------------------------------------------

const priorityConfig: Record<
  TaskPriority,
  { label: string; abbr: string; class: string; dot: string }
> = {
  urgent: { label: "Urgent", abbr: "URG", class: "text-rose-600", dot: "bg-rose-500" },
  high: { label: "High", abbr: "HIGH", class: "text-amber-600", dot: "bg-amber-500" },
  normal: { label: "Normal", abbr: "NRM", class: "text-sky-600", dot: "bg-sky-500" },
  low: { label: "Low", abbr: "LOW", class: "text-foreground/50", dot: "bg-foreground/30" },
  none: { label: "", abbr: "", class: "", dot: "" },
};

const priorityOptions: TaskPriority[] = ["urgent", "high", "normal", "low", "none"];

// ---------------------------------------------------------------------------
// TaskRow — the main row component
// ---------------------------------------------------------------------------

export function TaskRow({
  task,
  statuses,
  fieldDefs,
  onSelect,
  isDragging,
  dragHandleProps,
  style,
  isOver,
  isOverAsChild,
}: {
  task: FlatTask;
  statuses: Status[];
  fieldDefs: CustomFieldDef[];
  onSelect: (taskId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  style?: React.CSSProperties;
  isOver?: boolean;
  isOverAsChild?: boolean;
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

  function saveTaskField(field: string, value: unknown) {
    start(async () => {
      await updateTask(task.id, { [field]: value });
    });
  }

  const priority = priorityConfig[task.priority];

  return (
    <div
      className={cn(
        "group flex items-center border-b border-border/50",
        "transition-all duration-150",
        isDragging && "z-50 rounded-md border border-accent/40 bg-surface shadow-lg opacity-95",
        !isDragging && "hover:bg-surface-alt/50",
        isOver && "border-t-2 border-t-accent",
        isOverAsChild && "bg-accent-soft/30",
        pending && "opacity-50 pointer-events-none",
      )}
      style={style}
    >
      {/* Sticky left section: drag handle + indent + status + title */}
      <div
        className="sticky left-0 z-10 flex min-w-0 flex-1 items-center bg-inherit"
        style={{ paddingLeft: task.depth * 24 }}
      >
        {/* Drag handle */}
        <div
          className={cn(
            "flex h-full w-6 shrink-0 cursor-grab items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity",
          )}
          {...(dragHandleProps ?? {})}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
        </div>

        {/* Expand toggle for tasks with children */}
        {task.subtask_count > 0 ? (
          <button
            type="button"
            onClick={() => onSelect(task.id)}
            className="grid h-5 w-5 shrink-0 place-items-center"
          >
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* Status toggle */}
        <button
          type="button"
          onClick={cycleStatus}
          className="shrink-0 p-0.5 transition-transform hover:scale-110"
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

        {/* Title — click to open detail, double-click to edit inline */}
        <InlineTitle
          title={task.title}
          isDone={isDone}
          onOpen={() => onSelect(task.id)}
          onSave={(v) => saveTaskField("title", v)}
        />
      </div>

      {/* Scrollable fields strip */}
      <div className="flex shrink-0 items-center">
        {/* Priority */}
        <EditablePriority
          value={task.priority}
          onChange={(v) => saveTaskField("priority", v)}
        />

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
        <EditableDate
          value={task.due_date}
          isDone={isDone}
          onChange={(v) => saveTaskField("due_date", v)}
        />

        {/* Custom field columns */}
        {fieldDefs.map((fd) => (
          <EditableFieldCell
            key={fd.id}
            def={fd}
            value={task.custom_fields[fd.id]}
            onChange={(val) => saveField(fd.id, val)}
          />
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

// ---------------------------------------------------------------------------
// InlineTitle — click to open, double-click to edit in place
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
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
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
// EditablePriority — click to cycle through a dropdown
// ---------------------------------------------------------------------------

function EditablePriority({
  value,
  onChange,
}: {
  value: TaskPriority;
  onChange: (v: TaskPriority) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const priority = priorityConfig[value];

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-full items-center justify-center border-l border-border/30 px-2 py-2 transition-colors",
          "hover:bg-surface-alt cursor-pointer",
        )}
        style={{ width: 72 }}
      >
        {value !== "none" ? (
          <span className={cn("text-[11px] font-bold uppercase", priority.class)}>
            {priority.abbr}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/40">—</span>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-32 animate-slide-up rounded-card border border-border bg-surface py-1 shadow-card-hover">
          {priorityOptions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-[12px] font-medium",
                "hover:bg-surface-alt transition-colors",
                p === value && "bg-accent-soft text-accent",
              )}
            >
              {p !== "none" ? (
                <span className={cn("h-2 w-2 rounded-full", priorityConfig[p].dot)} />
              ) : (
                <span className="h-2 w-2" />
              )}
              {priorityConfig[p].label || "None"}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditableDate — click to reveal date picker inline
// ---------------------------------------------------------------------------

function EditableDate({
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
      <div className="flex items-center border-l border-border/30 px-1 py-1" style={{ width: 88 }}>
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

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center justify-center border-l border-border/30 px-2 py-2 hover:bg-surface-alt transition-colors cursor-pointer"
      style={{ width: 88 }}
    >
      {value ? (
        <span
          className={cn(
            "flex items-center gap-1 text-[11.5px] font-medium",
            isOverdue(value) && !isDone
              ? "text-rose-600"
              : "text-muted-foreground",
          )}
        >
          <Calendar className="h-3 w-3" />
          {formatDueDate(value)}
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground/40">—</span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// EditableFieldCell — wraps InlineFieldValue with click-to-edit
// ---------------------------------------------------------------------------

function EditableFieldCell({
  def,
  value,
  onChange,
}: {
  def: CustomFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const width = fieldCellWidth(def);

  // Checkboxes and selects handle their own editing
  if (def.field_type === "checkbox") {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="flex items-center justify-center border-l border-border/30 px-2 py-2 hover:bg-surface-alt transition-colors cursor-pointer"
        style={{ width }}
      >
        <span
          className={cn(
            "grid h-4 w-4 place-items-center rounded border transition-colors",
            value
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface hover:border-accent/50",
          )}
        >
          {value ? <Check className="h-3 w-3" /> : null}
        </span>
      </button>
    );
  }

  if (def.field_type === "select") {
    return (
      <EditableSelect def={def} value={value as string | null} onChange={onChange} />
    );
  }

  // For text/number/date types — click the cell to edit inline
  if (editing) {
    return (
      <div
        className="flex items-center border-l border-border/30 px-1 py-1"
        style={{ width }}
      >
        <FieldInput
          def={def}
          value={value}
          onChange={(val) => {
            onChange(val);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center justify-center border-l border-border/30 px-2 py-2 hover:bg-surface-alt transition-colors cursor-pointer"
      style={{ width }}
    >
      <InlineFieldDisplay def={def} value={value} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// EditableSelect — click to open dropdown
// ---------------------------------------------------------------------------

function EditableSelect({
  def,
  value,
  onChange,
}: {
  def: CustomFieldDef;
  value: string | null;
  onChange: (val: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const width = fieldCellWidth(def);

  const options = (
    (def.config as Record<string, unknown>)?.options ?? []
  ) as { value: string; label: string; color?: string }[];
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
        style={{ width }}
      >
        {selected ? (
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
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 animate-slide-up rounded-card border border-border bg-surface py-1 shadow-card-hover">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-surface-alt"
          >
            Clear
          </button>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-[12px] font-medium hover:bg-surface-alt",
                o.value === value && "bg-accent-soft",
              )}
            >
              {o.color ? (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: o.color }}
                />
              ) : null}
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldInput — inline editor for text/number/date/currency/etc
// ---------------------------------------------------------------------------

function FieldInput({
  def,
  value,
  onChange,
  onCancel,
}: {
  def: CustomFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const inputType =
    def.field_type === "date"
      ? "date"
      : def.field_type === "number" ||
          def.field_type === "currency" ||
          def.field_type === "percent"
        ? "number"
        : def.field_type === "email"
          ? "email"
          : def.field_type === "url"
            ? "url"
            : "text";

  const defaultVal =
    value != null
      ? String(value)
      : "";

  function handleSubmit(raw: string) {
    if (!raw) {
      onChange(null);
      return;
    }
    if (inputType === "number") {
      onChange(parseFloat(raw));
    } else {
      onChange(raw);
    }
  }

  return (
    <input
      ref={inputRef}
      type={inputType}
      defaultValue={defaultVal}
      onBlur={(e) => handleSubmit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") onCancel();
      }}
      className="h-6 w-full rounded bg-transparent px-1 text-[11.5px] outline-none ring-1 ring-accent/40"
    />
  );
}

// ---------------------------------------------------------------------------
// InlineFieldDisplay — read-only display for a custom field value
// ---------------------------------------------------------------------------

function InlineFieldDisplay({
  def,
  value,
}: {
  def: CustomFieldDef;
  value: unknown;
}) {
  switch (def.field_type) {
    case "checkbox":
      return (
        <span
          className={cn(
            "grid h-4 w-4 place-items-center rounded border",
            value
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface",
          )}
        >
          {value ? <Check className="h-3 w-3" /> : null}
        </span>
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
        return <span className="text-[11px] text-muted-foreground/40">—</span>;
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
      return d ? (
        <span className="text-[11px] text-muted-foreground">{formatDueDate(d)}</span>
      ) : (
        <span className="text-[11px] text-muted-foreground/40">—</span>
      );
    }

    case "text":
    case "url":
    case "email":
    case "phone": {
      const s = value as string | null | undefined;
      return s ? (
        <span className="max-w-full truncate text-[11.5px] text-foreground/80">{s}</span>
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
            <Badge key={v} tone="sage" className="truncate text-[9px]">{v}</Badge>
          ))}
          {arr.length > 2 ? (
            <span className="text-[9px] text-muted-foreground">+{arr.length - 2}</span>
          ) : null}
        </div>
      ) : (
        <span className="text-[11px] text-muted-foreground/40">—</span>
      );
    }

    default:
      return <span className="text-[11px] text-muted-foreground/40">—</span>;
  }
}

// ---------------------------------------------------------------------------
// Field cell wrapper + header components
// ---------------------------------------------------------------------------

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

export function TaskRowHeader({
  fieldDefs,
}: {
  fieldDefs: CustomFieldDef[];
}) {
  return (
    <div className="sticky top-0 z-20 flex items-center border-b border-border bg-surface-alt/60 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      <div className="sticky left-0 z-10 min-w-0 flex-1 bg-inherit px-3 py-1.5">
        Task
      </div>
      <div className="flex shrink-0 items-center">
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

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function fieldCellWidth(def: CustomFieldDef): number {
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
