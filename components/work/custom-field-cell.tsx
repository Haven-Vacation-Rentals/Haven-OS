"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Check, ExternalLink, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { setTaskFieldValue } from "@/lib/work/actions";
import { toast } from "sonner";
import type { CustomFieldDef } from "@/lib/work/types";

interface CustomFieldCellProps {
  taskId: string;
  fieldDef: CustomFieldDef;
  value: unknown;
  onValueChange?: (val: unknown) => void;
  compact?: boolean;
}

/**
 * Dispatches rendering by field_type.
 * All mutations call setTaskFieldValue server action.
 */
export function CustomFieldCell({
  taskId,
  fieldDef,
  value,
  onValueChange,
  compact = true,
}: CustomFieldCellProps) {
  async function commit(newVal: unknown) {
    try {
      await setTaskFieldValue(taskId, fieldDef.id, newVal);
      onValueChange?.(newVal);
    } catch {
      toast.error("Failed to save field");
    }
  }

  switch (fieldDef.field_type) {
    case "text":
      return <TextCell value={value as string | null} onCommit={commit} compact={compact} />;
    case "url":
      return <UrlCell value={value as string | null} onCommit={commit} compact={compact} />;
    case "email":
      return <EmailCell value={value as string | null} onCommit={commit} compact={compact} />;
    case "phone":
      return <PhoneCell value={value as string | null} onCommit={commit} compact={compact} />;
    case "number":
      return <NumberCell value={value as number | null} onCommit={commit} suffix="" compact={compact} />;
    case "currency":
      return <NumberCell value={value as number | null} onCommit={commit} prefix="$" compact={compact} />;
    case "percent":
      return <NumberCell value={value as number | null} onCommit={commit} suffix="%" compact={compact} />;
    case "date":
      return <DateCell value={value as string | null} onCommit={commit} compact={compact} />;
    case "checkbox":
      return <CheckboxCell value={Boolean(value)} onCommit={commit} />;
    case "select":
      return <SelectCell fieldDef={fieldDef} value={value as string | null} onCommit={commit} compact={compact} />;
    case "multi_select":
      return <MultiSelectCell fieldDef={fieldDef} value={value as string[] | null} onCommit={commit} compact={compact} />;
    case "labels":
      return <LabelsCell value={value as string[] | null} onCommit={commit} compact={compact} />;
    case "people":
      return <PeopleCell value={value as string | null} compact={compact} />;
    default:
      return (
        <span className="text-[12px] text-muted-foreground/50">
          {String(value ?? "—")}
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// Text / URL / Email / Phone
// ---------------------------------------------------------------------------

function TextCell({
  value,
  onCommit,
  compact,
}: {
  value: string | null;
  onCommit: (v: string | null) => void;
  compact: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onCommit(draft.trim() || null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
        className={cn(
          "w-full bg-transparent outline-none border-b border-accent text-foreground",
          compact ? "text-[12px]" : "text-[13px] py-0.5",
        )}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "w-full text-left truncate",
        compact ? "text-[12px]" : "text-[13px]",
        value ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground",
      )}
    >
      {value ?? (compact ? "—" : "Click to edit")}
    </button>
  );
}

function UrlCell({
  value,
  onCommit,
  compact,
}: {
  value: string | null;
  onCommit: (v: string | null) => void;
  compact: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  if (editing) {
    return (
      <input
        autoFocus
        type="url"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onCommit(draft.trim() || null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
        className={cn(
          "w-full bg-transparent outline-none border-b border-accent",
          compact ? "text-[12px]" : "text-[13px] py-0.5",
        )}
      />
    );
  }
  return value ? (
    <div className="flex items-center gap-1">
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "truncate text-accent hover:underline",
          compact ? "text-[12px]" : "text-[13px]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {value.replace(/^https?:\/\//, "")}
      </a>
      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/50" />
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="ml-1 text-muted-foreground/30 hover:text-muted-foreground"
      >
        ✎
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "text-left text-muted-foreground/40 hover:text-muted-foreground",
        compact ? "text-[12px]" : "text-[13px]",
      )}
    >
      {compact ? "—" : "Add URL"}
    </button>
  );
}

function EmailCell({
  value,
  onCommit,
  compact,
}: {
  value: string | null;
  onCommit: (v: string | null) => void;
  compact: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  if (editing) {
    return (
      <input
        autoFocus
        type="email"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onCommit(draft.trim() || null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
        className={cn(
          "w-full bg-transparent outline-none border-b border-accent",
          compact ? "text-[12px]" : "text-[13px] py-0.5",
        )}
      />
    );
  }
  return value ? (
    <a
      href={`mailto:${value}`}
      className={cn(
        "truncate text-accent hover:underline",
        compact ? "text-[12px]" : "text-[13px]",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {value}
    </a>
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "text-left text-muted-foreground/40 hover:text-muted-foreground",
        compact ? "text-[12px]" : "text-[13px]",
      )}
    >
      {compact ? "—" : "Add email"}
    </button>
  );
}

function PhoneCell({
  value,
  onCommit,
  compact,
}: {
  value: string | null;
  onCommit: (v: string | null) => void;
  compact: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  if (editing) {
    return (
      <input
        autoFocus
        type="tel"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onCommit(draft.trim() || null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
        className={cn(
          "w-full bg-transparent outline-none border-b border-accent",
          compact ? "text-[12px]" : "text-[13px] py-0.5",
        )}
      />
    );
  }
  return value ? (
    <a
      href={`tel:${value}`}
      className={cn(
        "truncate text-foreground hover:text-accent",
        compact ? "text-[12px]" : "text-[13px]",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {value}
    </a>
  ) : (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "text-left text-muted-foreground/40 hover:text-muted-foreground",
        compact ? "text-[12px]" : "text-[13px]",
      )}
    >
      {compact ? "—" : "Add phone"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Numeric (number / currency / percent)
// ---------------------------------------------------------------------------

function NumberCell({
  value,
  onCommit,
  prefix = "",
  suffix = "",
  compact,
}: {
  value: number | null;
  onCommit: (v: number | null) => void;
  prefix?: string;
  suffix?: string;
  compact: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? "");

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onCommit(draft.trim() ? parseFloat(draft) : null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(value?.toString() ?? "");
            setEditing(false);
          }
        }}
        className={cn(
          "w-full bg-transparent outline-none border-b border-accent",
          compact ? "text-[12px]" : "text-[13px] py-0.5",
        )}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "text-left tabular-nums",
        compact ? "text-[12px]" : "text-[13px]",
        value != null ? "text-foreground" : "text-muted-foreground/40",
      )}
    >
      {value != null ? `${prefix}${value.toLocaleString()}${suffix}` : (compact ? "—" : "Add value")}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

function DateCell({
  value,
  onCommit,
  compact,
}: {
  value: string | null;
  onCommit: (v: string | null) => void;
  compact: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onCommit(e.target.value || null)}
        className={cn(
          "absolute inset-0 opacity-0 cursor-pointer",
        )}
      />
      <span
        className={cn(
          "pointer-events-none",
          compact ? "text-[12px]" : "text-[13px]",
          value ? "text-foreground" : "text-muted-foreground/40",
        )}
      >
        {value ? format(new Date(value), "MMM d, yyyy") : (compact ? "—" : "Set date")}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

function CheckboxCell({
  value,
  onCommit,
}: {
  value: boolean;
  onCommit: (v: boolean) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onCommit(!value)}
      animate={{ scale: 1 }}
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "h-4 w-4 rounded border transition-colors",
        value
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface",
      )}
    >
      {value && <Check className="h-3 w-3 m-auto" />}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

function SelectCell({
  fieldDef,
  value,
  onCommit,
  compact,
}: {
  fieldDef: CustomFieldDef;
  value: string | null;
  onCommit: (v: string | null) => void;
  compact: boolean;
}) {
  const options = ((fieldDef.config as Record<string, unknown>)?.options ?? []) as {
    value: string;
    label: string;
    color?: string;
  }[];

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onCommit(e.target.value || null)}
        className={cn(
          "absolute inset-0 opacity-0 cursor-pointer w-full",
        )}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span
        className={cn(
          "pointer-events-none",
          compact ? "text-[12px]" : "text-[13px]",
          selected ? "text-foreground" : "text-muted-foreground/40",
        )}
        style={selected?.color ? { color: selected.color } : {}}
      >
        {selected?.label ?? (compact ? "—" : "Select…")}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi-select
// ---------------------------------------------------------------------------

function MultiSelectCell({
  fieldDef,
  value,
  onCommit,
  compact,
}: {
  fieldDef: CustomFieldDef;
  value: string[] | null;
  onCommit: (v: string[] | null) => void;
  compact: boolean;
}) {
  const options = ((fieldDef.config as Record<string, unknown>)?.options ?? []) as {
    value: string;
    label: string;
    color?: string;
  }[];
  const selected = value ?? [];

  function toggle(optVal: string) {
    const next = selected.includes(optVal)
      ? selected.filter((v) => v !== optVal)
      : [...selected, optVal];
    onCommit(next.length > 0 ? next : null);
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-0.5">
        {selected.length === 0 ? (
          <span className="text-[12px] text-muted-foreground/40">—</span>
        ) : (
          selected.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <span
                key={v}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium border"
                style={
                  opt?.color
                    ? { backgroundColor: `${opt.color}22`, color: opt.color, borderColor: `${opt.color}44` }
                    : {}
                }
              >
                {opt?.label ?? v}
              </span>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className="flex items-center gap-2 text-[13px] hover:text-foreground"
        >
          <span
            className={cn(
              "h-3.5 w-3.5 rounded border transition-colors",
              selected.includes(opt.value) ? "bg-accent border-accent" : "border-border",
            )}
          />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

function LabelsCell({
  value,
  onCommit,
  compact,
}: {
  value: string[] | null;
  onCommit: (v: string[] | null) => void;
  compact: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const labels = value ?? [];

  function addLabel() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    const next = [...labels, trimmed];
    onCommit(next);
    setDraft("");
    setAdding(false);
  }

  function removeLabel(label: string) {
    const next = labels.filter((l) => l !== label);
    onCommit(next.length > 0 ? next : null);
  }

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <span
          key={label}
          className="flex items-center gap-0.5 rounded-full border border-border bg-surface-alt px-1.5 py-0.5 text-[11px] font-medium"
        >
          {label}
          {!compact && (
            <button
              type="button"
              onClick={() => removeLabel(label)}
              className="text-muted-foreground/50 hover:text-rose-500"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </span>
      ))}
      {!compact && (
        adding ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={addLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") addLabel();
              if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            placeholder="Label name"
            className="h-5 w-20 rounded-full border border-accent bg-surface px-2 text-[11px] outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-0.5 rounded-full border border-dashed border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:border-accent hover:text-accent"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// People (read-only display, no picker for now)
// ---------------------------------------------------------------------------

function PeopleCell({ value, compact }: { value: string | null; compact: boolean }) {
  return (
    <span
      className={cn(
        compact ? "text-[12px]" : "text-[13px]",
        value ? "text-foreground" : "text-muted-foreground/40",
      )}
    >
      {value ?? (compact ? "—" : "Unassigned")}
    </span>
  );
}
