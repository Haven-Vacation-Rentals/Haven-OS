"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Trash2,
  Tag,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { StatusPickerPopover } from "@/components/work/status-picker-popover";
import { StatusPill } from "@/components/work/status-pill";
import {
  updateTask,
  deleteTask,
} from "@/lib/work/actions";
import { toast } from "sonner";
import type { Status, TaskPriority } from "@/lib/work/types";

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "urgent", label: "Urgent", color: "#ef4444" },
  { value: "high", label: "High", color: "#f59e0b" },
  { value: "normal", label: "Normal", color: "#3b82f6" },
  { value: "low", label: "Low", color: "#64748b" },
  { value: "none", label: "None", color: "#a1a1aa" },
];

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  statuses: Status[];
  onClearSelection: () => void;
  onTasksDeleted: (ids: string[]) => void;
  onTasksUpdated: (ids: string[], updates: { status_id?: string; priority?: TaskPriority; due_date?: string | null }) => void;
}

export function BulkActionsBar({
  selectedIds,
  statuses,
  onClearSelection,
  onTasksDeleted,
  onTasksUpdated,
}: BulkActionsBarProps) {
  const [pending, startTransition] = useTransition();
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const count = selectedIds.size;
  const ids = Array.from(selectedIds);

  function handleStatusChange(status: Status) {
    startTransition(async () => {
      try {
        await Promise.all(ids.map((id) => updateTask(id, { status_id: status.id })));
        onTasksUpdated(ids, { status_id: status.id });
        toast.success(`Updated ${count} task${count > 1 ? "s" : ""}`);
      } catch {
        toast.error("Failed to update status");
      }
    });
  }

  function handlePriorityChange(priority: TaskPriority) {
    setShowPriorityPicker(false);
    startTransition(async () => {
      try {
        await Promise.all(ids.map((id) => updateTask(id, { priority })));
        onTasksUpdated(ids, { priority });
        toast.success(`Updated ${count} task${count > 1 ? "s" : ""}`);
      } catch {
        toast.error("Failed to update priority");
      }
    });
  }

  function handleDueDateChange(date: string) {
    setShowDatePicker(false);
    startTransition(async () => {
      try {
        await Promise.all(ids.map((id) => updateTask(id, { due_date: date || null })));
        onTasksUpdated(ids, { due_date: date || null });
        toast.success(`Updated ${count} task${count > 1 ? "s" : ""}`);
      } catch {
        toast.error("Failed to update due date");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete ${count} task${count > 1 ? "s" : ""}? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await Promise.all(ids.map((id) => deleteTask(id)));
        onTasksDeleted(ids);
        onClearSelection();
        toast.success(`Deleted ${count} task${count > 1 ? "s" : ""}`);
      } catch {
        toast.error("Failed to delete tasks");
      }
    });
  }

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 shadow-xl ring-1 ring-black/5">
            {/* Count badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              <span className="text-[12px] font-semibold text-accent">
                {count} selected
              </span>
            </div>

            <div className="h-5 w-px bg-border" />

            {/* Status */}
            <StatusPickerPopover
              statuses={statuses}
              currentStatus={null}
              onSelect={handleStatusChange}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground transition-colors"
              >
                <StatusPill status={statuses[0] ?? null} size="sm" />
                Status
              </button>
            </StatusPickerPopover>

            {/* Priority */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPriorityPicker((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Priority
              </button>
              <AnimatePresence>
                {showPriorityPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-2 left-0 min-w-[120px] rounded-xl border border-border bg-surface p-1 shadow-lg z-50"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handlePriorityChange(p.value)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] hover:bg-surface-alt transition-colors"
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Due date */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground transition-colors"
              >
                <Calendar className="h-3.5 w-3.5" />
                Due date
              </button>
              <AnimatePresence>
                {showDatePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full mb-2 left-0 rounded-xl border border-border bg-surface p-3 shadow-lg z-50"
                  >
                    <input
                      type="date"
                      autoFocus
                      onChange={(e) => handleDueDateChange(e.target.value)}
                      className="block h-8 rounded-md border border-border bg-surface px-2 text-[13px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleDueDateChange("")}
                      className="mt-1.5 text-[11px] text-muted-foreground hover:text-rose-500 w-full text-left"
                    >
                      Clear due date
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Assign (placeholder) */}
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              Assign
            </button>

            {/* Tags (placeholder) */}
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-surface-alt hover:text-foreground transition-colors"
            >
              <Tag className="h-3.5 w-3.5" />
              Tag
            </button>

            <div className="h-5 w-px bg-border" />

            {/* Delete */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>

            {/* Clear selection */}
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-md p-1 text-muted-foreground hover:bg-surface-alt hover:text-foreground transition-colors"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
