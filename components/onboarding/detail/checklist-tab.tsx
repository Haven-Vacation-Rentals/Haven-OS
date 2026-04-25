"use client";

/**
 * ChecklistTab — nested task tree with one-click checkbox UX.
 *
 * Design:
 *  - Big circular checkbox on the left = primary action (toggle done).
 *  - Title + meta is a button that opens the Task Drawer.
 *  - Status pill on the right is small/secondary, for non-binary states.
 *  - Department badge only shows when it differs from the parent's (so a
 *    section full of "Onboarding" tasks doesn't repeat the badge).
 *  - Trash is gone — replaced by a quiet ⋯ menu that appears on row hover.
 *  - Parent rows show "X/Y done" progress and a Mark all done button.
 *  - Embedded checklist items reuse the same one-click checkbox vibe and
 *    can be toggled by clicking anywhere on the row.
 *  - Keyboard: Space = toggle, Enter = open drawer.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Star,
  Calendar,
  CheckCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskStatusMenu } from "@/components/onboarding/status-menu";
import { TaskCheckbox } from "@/components/onboarding/task-checkbox";
import { TaskRowMenu } from "@/components/onboarding/task-row-menu";
import type {
  OnboardingTaskNode,
  OnboardingTaskStatus,
  OnboardingDepartment,
  DbOnboardingChecklistItem,
} from "@/lib/onboarding/types";
import { DEPARTMENT_LABELS } from "@/lib/onboarding/types";
import {
  DEPARTMENT_TONE,
  formatDateShort,
  isOverdue,
} from "@/lib/onboarding/utils";
import {
  addAdHocTask,
  updateTaskStatus,
  deleteTask,
  toggleChecklistItem,
} from "@/lib/onboarding/actions";

export function ChecklistTab({
  projectId,
  tasks,
  onOpenTask,
}: {
  projectId: string;
  tasks: OnboardingTaskNode[];
  onOpenTask: (t: OnboardingTaskNode) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const addTop = () => {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      try {
        await addAdHocTask({ project_id: projectId, title: newTitle });
        toast.success("Task added");
        setNewTitle("");
        setAdding(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          node={t}
          parentDept={null}
          onOpenTask={onOpenTask}
        />
      ))}

      {adding ? (
        <div className="haven-card rounded-card p-3 flex gap-2">
          <Input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New top-level task title"
            onKeyDown={(e) => {
              if (e.key === "Enter") addTop();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <Button
            variant="primary"
            onClick={addTop}
            disabled={pending || !newTitle.trim()}
          >
            Add
          </Button>
          <Button variant="outline" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-card border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors w-fit"
        >
          <Plus className="h-4 w-4" />
          Add top-level task
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task row
// ---------------------------------------------------------------------------

/**
 * Recursively counts done/total within a task subtree, treating "na" as
 * neither and rolling up nested children + checklist items.
 */
function rollupProgress(node: OnboardingTaskNode): { done: number; total: number } {
  let done = 0;
  let total = 0;

  // The task itself counts unless N/A.
  if (node.status !== "na") {
    total += 1;
    if (node.status === "done") done += 1;
  }

  // Children recursively
  for (const c of node.children) {
    const r = rollupProgress(c);
    done += r.done;
    total += r.total;
  }

  // Checklist items count as 1 each toward the parent's progress
  for (const it of node.checklist) {
    total += 1;
    if (it.is_checked) done += 1;
  }

  return { done, total };
}

function TaskRow({
  node,
  parentDept,
  onOpenTask,
}: {
  node: OnboardingTaskNode;
  parentDept: OnboardingDepartment | null;
  onOpenTask: (t: OnboardingTaskNode) => void;
}) {
  const [open, setOpen] = useState(node.depth === 0);
  const [pending, startTransition] = useTransition();
  const hasChildren = node.children.length > 0;
  const hasChecklist = node.checklist.length > 0;
  const expandable = hasChildren || hasChecklist;

  const onStatus = (status: OnboardingTaskStatus) => {
    startTransition(async () => {
      try {
        await updateTaskStatus(node.id, status);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  };

  const onDelete = () => {
    if (!confirm(`Delete "${node.title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteTask(node.id);
        toast.success("Task deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  };

  // Mark every incomplete descendant + checklist item as done.
  const onMarkAllDone = () => {
    startTransition(async () => {
      try {
        const ops: Promise<unknown>[] = [];
        const walk = (n: OnboardingTaskNode) => {
          if (n.status !== "done" && n.status !== "na") {
            ops.push(updateTaskStatus(n.id, "done"));
          }
          for (const it of n.checklist) {
            if (!it.is_checked) ops.push(toggleChecklistItem(it.id, true));
          }
          for (const c of n.children) walk(c);
        };
        walk(node);
        if (ops.length === 0) {
          toast.message("Already all done");
          return;
        }
        await Promise.all(ops);
        toast.success("Marked all done");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  // Visual: depth 0 = full card on surface; deeper = subtler nested card.
  const bg =
    node.depth === 0
      ? "bg-surface"
      : node.depth === 1
      ? "bg-surface-alt/40"
      : "bg-transparent";

  const overdue =
    node.due_date &&
    isOverdue(node.due_date) &&
    node.status !== "done" &&
    node.status !== "na";

  // Show department badge only when it differs from the parent's context.
  // The screenshot pain point: 6 rows in a row labeled "Onboarding" inside
  // the Onboarding section. Hide it.
  const showDept = node.department && node.department !== parentDept;

  // Aggregate progress for parent rows
  const progress =
    node.depth === 0 || expandable ? rollupProgress(node) : null;

  const isDone = node.status === "done";

  return (
    <div
      className={`group rounded-card border border-border ${bg} transition-shadow hover:shadow-sm ${
        isDone ? "opacity-90" : ""
      }`}
      style={{ marginLeft: node.depth * 12 }}
    >
      {/* ----- Row header ----- */}
      <div className="flex items-center gap-2 p-2 pl-2.5">
        {/* Expand chevron */}
        {expandable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-label={open ? "Collapse" : "Expand"}
            className="shrink-0 h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-alt"
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}

        {/* One-click checkbox = primary action */}
        <TaskCheckbox
          status={node.status}
          onToggle={onStatus}
          disabled={pending}
          size={node.depth === 0 ? "md" : "sm"}
        />

        {/* Title button (opens drawer; Enter to open, Space already toggles via checkbox focus) */}
        <button
          type="button"
          onClick={() => onOpenTask(node)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onOpenTask(node);
            }
          }}
          className="min-w-0 flex-1 flex items-center gap-2 flex-wrap text-left rounded-md px-1.5 py-1 -mx-1.5 -my-1 hover:bg-surface-alt/40 focus-visible:outline-none focus-visible:bg-surface-alt/60"
        >
          {node.is_key_date ? (
            <Star className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
          ) : null}
          <span
            className={
              "min-w-0 " +
              (node.depth === 0 ? "font-semibold text-[14px]" : "text-[13px]") +
              " " +
              (isDone ? "line-through text-muted-foreground" : "")
            }
          >
            {node.title}
          </span>

          {showDept && node.department ? (
            <Badge
              tone={DEPARTMENT_TONE[node.department]}
              className="text-[10px] px-2 py-0 shrink-0"
            >
              {DEPARTMENT_LABELS[node.department]}
            </Badge>
          ) : null}

          {node.due_date ? (
            <span
              className={
                "inline-flex items-center gap-1 text-[11px] shrink-0 " +
                (overdue
                  ? "text-rose-700 font-semibold"
                  : "text-muted-foreground")
              }
            >
              <Calendar className="h-3 w-3" />
              {formatDateShort(node.due_date)}
            </span>
          ) : null}

          {/* Aggregate progress for parents */}
          {progress && progress.total > 0 && expandable ? (
            <span className="ml-auto inline-flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums shrink-0">
              <span className="hidden sm:inline-flex h-1 w-16 rounded-full bg-surface-alt overflow-hidden">
                <span
                  className={
                    "h-full " +
                    (progress.done === progress.total
                      ? "bg-emerald-500"
                      : "bg-haven-coral-600")
                  }
                  style={{
                    width: `${Math.round(
                      (progress.done / progress.total) * 100,
                    )}%`,
                  }}
                />
              </span>
              <span>
                {progress.done}/{progress.total}
              </span>
            </span>
          ) : null}
        </button>

        {/* Mark all done — only on parents with incomplete work */}
        {expandable && progress && progress.done < progress.total ? (
          <button
            type="button"
            onClick={onMarkAllDone}
            disabled={pending}
            title="Mark every subtask & checklist item done"
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 h-7 inline-flex items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-opacity disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all done
          </button>
        ) : null}

        {/* Status pill — secondary; only shown when not in default not_started/done */}
        <TaskStatusMenu
          value={node.status}
          onChange={onStatus}
          disabled={pending}
        />

        {/* Overflow menu (hover-only) */}
        <TaskRowMenu
          onOpen={() => onOpenTask(node)}
          onDelete={onDelete}
        />
      </div>

      {/* ----- Children ----- */}
      {open && expandable ? (
        <div className="border-t border-border/50 p-2 flex flex-col gap-1">
          {hasChecklist ? (
            <ul className="px-1 flex flex-col">
              {node.checklist.map((it) => (
                <ChecklistRow key={it.id} item={it} />
              ))}
            </ul>
          ) : null}
          {node.children.map((c) => (
            <TaskRow
              key={c.id}
              node={c}
              parentDept={node.department ?? parentDept}
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist row (embedded in expanded task)
// ---------------------------------------------------------------------------

function ChecklistRow({ item }: { item: DbOnboardingChecklistItem }) {
  const [pending, startTransition] = useTransition();
  const toggle = () => {
    startTransition(async () => {
      try {
        await toggleChecklistItem(item.id, !item.is_checked);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  return (
    <li>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-surface-alt/60 disabled:opacity-50"
      >
        <span
          className={
            "shrink-0 inline-flex items-center justify-center rounded-md transition-colors h-4 w-4 " +
            (item.is_checked
              ? "bg-emerald-600 border border-emerald-600 text-white"
              : "border border-border bg-surface group-hover:border-emerald-500/70 group-hover:bg-emerald-50")
          }
        >
          {item.is_checked ? (
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 8.5 6.5 12 13 4.5" />
            </svg>
          ) : null}
        </span>
        <span
          className={
            item.is_checked ? "line-through text-muted-foreground" : ""
          }
        >
          {item.label}
        </span>
      </button>
    </li>
  );
}
