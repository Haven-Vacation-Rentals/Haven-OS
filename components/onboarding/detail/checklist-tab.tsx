"use client";

/**
 * ChecklistTab — nested task tree. Row click opens the drawer.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Star,
  Calendar,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskStatusMenu } from "@/components/onboarding/status-menu";
import type {
  OnboardingTaskNode,
  OnboardingTaskStatus,
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
          projectId={projectId}
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

function TaskRow({
  node,
  projectId,
  onOpenTask,
}: {
  node: OnboardingTaskNode;
  projectId: string;
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

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const bg =
    node.depth === 0
      ? "bg-surface"
      : node.depth === 1
      ? "bg-surface-alt/30"
      : "bg-transparent";

  const overdue =
    node.due_date &&
    isOverdue(node.due_date) &&
    node.status !== "done" &&
    node.status !== "na";

  return (
    <div
      className={`rounded-card border border-border ${bg}`}
      style={{ marginLeft: node.depth * 12 }}
    >
      <div className="flex items-center gap-2 p-2 pl-3">
        {expandable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className="shrink-0 h-5 w-5 inline-flex items-center justify-center rounded hover:bg-surface-alt"
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onOpenTask(node)}
          className="min-w-0 flex-1 flex items-center gap-2 flex-wrap text-left hover:bg-surface-alt/40 rounded-md px-1.5 py-1 -mx-1.5 -my-1"
        >
          {node.is_key_date ? (
            <Star className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
          ) : null}
          <span
            className={`truncate ${
              node.depth === 0 ? "font-semibold text-[14px]" : "text-[13px]"
            } ${node.status === "done" ? "line-through text-muted-foreground" : ""}`}
          >
            {node.title}
          </span>
          {node.department ? (
            <Badge
              tone={DEPARTMENT_TONE[node.department]}
              className="text-[10px] px-2 py-0"
            >
              {DEPARTMENT_LABELS[node.department]}
            </Badge>
          ) : null}
          {node.due_date ? (
            <span
              className={
                "inline-flex items-center gap-1 text-[11px] " +
                (overdue ? "text-rose-700 font-semibold" : "text-muted-foreground")
              }
            >
              <Calendar className="h-3 w-3" />
              {formatDateShort(node.due_date)}
            </span>
          ) : null}
        </button>

        <TaskStatusMenu
          value={node.status}
          onChange={onStatus}
          disabled={pending}
        />

        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-rose-700 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && expandable ? (
        <div className="border-t border-border/50 p-2 flex flex-col gap-1">
          {hasChecklist ? (
            <ul className="px-2 flex flex-col gap-0.5">
              {node.checklist.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-2 px-2 py-1 text-[12px]"
                >
                  <span
                    className={
                      "h-3 w-3 rounded border shrink-0 " +
                      (it.is_checked
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-surface border-border")
                    }
                  />
                  <span
                    className={
                      it.is_checked ? "line-through text-muted-foreground" : ""
                    }
                  >
                    {it.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {node.children.map((c) => (
            <TaskRow
              key={c.id}
              node={c}
              projectId={projectId}
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
