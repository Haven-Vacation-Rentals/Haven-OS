"use client";

/**
 * TaskDrawer — right-side sliding panel for viewing and editing a task.
 *
 * Supports:
 *  - Title, description, department, due date, assignee, key-date toggle
 *  - Inline checklist with toggle/add/delete
 *  - Status change via TaskStatusMenu
 *  - Delete
 *
 * Uses Radix Dialog as the a11y/overlay primitive, styled as a drawer.
 */

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Trash2,
  Star,
  Plus,
  Mail,
  Building2,
  X,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskStatusMenu } from "@/components/onboarding/status-menu";
import {
  ONBOARDING_DEPARTMENTS,
  DEPARTMENT_LABELS,
  type OnboardingTaskNode,
  type OnboardingTaskStatus,
  type OnboardingDepartment,
  type DbOnboardingChecklistItem,
} from "@/lib/onboarding/types";
import { DEPARTMENT_TONE } from "@/lib/onboarding/utils";
import {
  updateTask,
  updateTaskStatus,
  deleteTask,
  toggleChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
} from "@/lib/onboarding/actions";

export function TaskDrawer({
  task,
  open,
  onOpenChange,
}: {
  task: OnboardingTaskNode | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={
            "fixed inset-0 z-50 bg-black/20 backdrop-blur-sm " +
            "data-[state=open]:animate-in data-[state=closed]:animate-out " +
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          }
        />
        <DialogPrimitive.Content
          className={
            "fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-[520px] " +
            "bg-surface border-l border-border shadow-xl overflow-y-auto " +
            "data-[state=open]:animate-in data-[state=closed]:animate-out " +
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right " +
            "duration-200"
          }
        >
          <DialogPrimitive.Title className="sr-only">
            Task details
          </DialogPrimitive.Title>
          {task ? <DrawerBody task={task} /> : null}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-alt">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Drawer body
// ---------------------------------------------------------------------------

function DrawerBody({ task }: { task: OnboardingTaskNode }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dept, setDept] = useState<OnboardingDepartment | null>(task.department);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [assignee, setAssignee] = useState(task.assignee_email ?? "");
  const [isKey, setIsKey] = useState(task.is_key_date);
  const [pending, startTransition] = useTransition();

  // Keep state fresh when a different task is selected in the drawer.
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDept(task.department);
    setDueDate(task.due_date ?? "");
    setAssignee(task.assignee_email ?? "");
    setIsKey(task.is_key_date);
  }, [task.id, task.title, task.description, task.department, task.due_date, task.assignee_email, task.is_key_date]);

  const save = (patch: Parameters<typeof updateTask>[1]) => {
    startTransition(async () => {
      try {
        await updateTask(task.id, patch);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const saveAll = () => {
    save({
      title: title.trim() || task.title,
      description,
      department: dept,
      due_date: dueDate || null,
      assignee_email: assignee.trim() || null,
      is_key_date: isKey,
    });
    toast.success("Saved");
  };

  const onStatus = (s: OnboardingTaskStatus) => {
    startTransition(async () => {
      try {
        await updateTaskStatus(task.id, s);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const onDelete = () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteTask(task.id);
        toast.success("Task deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 p-6 pr-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {isKey ? (
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          ) : null}
          <span className="haven-eyebrow">Task</span>
          {dept ? (
            <Badge tone={DEPARTMENT_TONE[dept]} className="text-[10px]">
              {DEPARTMENT_LABELS[dept]}
            </Badge>
          ) : null}
          <div className="ml-auto">
            <TaskStatusMenu
              value={task.status}
              onChange={onStatus}
              disabled={pending}
              size="md"
            />
          </div>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const t = title.trim();
            if (t && t !== task.title) save({ title: t });
          }}
          className="font-heading text-xl font-bold bg-transparent border-0 outline-none focus:outline-none focus:ring-0 p-0"
          placeholder="Task title"
        />
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4">
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== (task.description ?? ""))
                save({ description });
            }}
            rows={4}
            placeholder="Add description…"
            className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:shadow-ring"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Department" icon={<Building2 className="h-3 w-3" />}>
            <select
              value={dept ?? ""}
              onChange={(e) => {
                const v = (e.target.value || null) as OnboardingDepartment | null;
                setDept(v);
                save({ department: v });
              }}
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-foreground/30"
            >
              <option value="">—</option>
              {ONBOARDING_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {DEPARTMENT_LABELS[d]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Due date" icon={<Calendar className="h-3 w-3" />}>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={() => {
                if ((dueDate || null) !== (task.due_date ?? null))
                  save({ due_date: dueDate || null });
              }}
            />
          </Field>

          <Field label="Assignee email" icon={<Mail className="h-3 w-3" />}>
            <Input
              type="email"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              onBlur={() => {
                const v = assignee.trim();
                if ((v || null) !== (task.assignee_email ?? null))
                  save({ assignee_email: v || null });
              }}
              placeholder="name@havenvacationrentals.com"
            />
          </Field>

          <Field label="Key date">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isKey}
                onChange={(e) => {
                  setIsKey(e.target.checked);
                  save({ is_key_date: e.target.checked });
                }}
                className="h-4 w-4 rounded border-border text-accent focus:ring-0"
              />
              <span className="flex items-center gap-1 text-foreground/80">
                <Star
                  className={
                    "h-3.5 w-3.5 " +
                    (isKey
                      ? "text-amber-500 fill-amber-500"
                      : "text-muted-foreground")
                  }
                />
                Milestone / key date
              </span>
            </label>
          </Field>
        </div>
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-2">
        <span className="haven-eyebrow">Checklist</span>
        <Checklist items={task.checklist} taskId={task.id} />
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-md px-2 py-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete task
        </button>
        <Button variant="primary" onClick={saveAll} disabled={pending}>
          Save
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist editor
// ---------------------------------------------------------------------------

function Checklist({
  items,
  taskId,
}: {
  items: DbOnboardingChecklistItem[];
  taskId: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (it: DbOnboardingChecklistItem) => {
    startTransition(async () => {
      try {
        await toggleChecklistItem(it.id, !it.is_checked);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const add = () => {
    if (!newLabel.trim()) return;
    startTransition(async () => {
      try {
        await addChecklistItem(taskId, newLabel);
        setNewLabel("");
        setAdding(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      try {
        await deleteChecklistItem(id);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-surface-alt/30 p-2">
      {items.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground px-2 py-1">
          No checklist items yet.
        </p>
      ) : null}
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface group"
        >
          <input
            type="checkbox"
            checked={it.is_checked}
            onChange={() => toggle(it)}
            disabled={pending}
            className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-0"
          />
          <span
            className={`text-[13px] flex-1 ${
              it.is_checked ? "line-through text-muted-foreground" : ""
            }`}
          >
            {it.label}
          </span>
          <button
            type="button"
            onClick={() => remove(it.id)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-700"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      {adding ? (
        <div className="flex gap-1.5 px-2 py-1">
          <Input
            autoFocus
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="New checklist item"
            className="h-8 text-[13px]"
          />
          <Button size="sm" variant="primary" onClick={add} disabled={pending}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground w-fit"
        >
          <Plus className="h-3 w-3" />
          Add item
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bits
// ---------------------------------------------------------------------------

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
