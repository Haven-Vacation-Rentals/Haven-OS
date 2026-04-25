"use client";

/**
 * ByDeptTab — tasks grouped by department, with per-dept progress bar.
 * Click the checkbox to mark done; click the title to open the drawer.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskCheckbox } from "@/components/onboarding/task-checkbox";
import {
  ONBOARDING_DEPARTMENTS,
  DEPARTMENT_LABELS,
  type OnboardingTaskNode,
  type OnboardingTaskStatus,
  type OnboardingDepartment,
} from "@/lib/onboarding/types";
import { DEPARTMENT_TONE } from "@/lib/onboarding/utils";
import { updateTaskStatus } from "@/lib/onboarding/actions";

export function ByDeptTab({
  tasks,
  onOpenTask,
}: {
  tasks: OnboardingTaskNode[];
  onOpenTask: (t: OnboardingTaskNode) => void;
}) {
  const byDept = new Map<
    OnboardingDepartment | "unassigned",
    OnboardingTaskNode[]
  >();
  for (const t of tasks) {
    const k = (t.department ?? "unassigned") as
      | OnboardingDepartment
      | "unassigned";
    const arr = byDept.get(k) ?? [];
    arr.push(t);
    byDept.set(k, arr);
  }
  const order: (OnboardingDepartment | "unassigned")[] = [
    ...ONBOARDING_DEPARTMENTS,
    "unassigned",
  ];

  return (
    <div className="flex flex-col gap-3">
      {order.map((d) => {
        const items = byDept.get(d);
        if (!items || items.length === 0) return null;
        return (
          <DeptGroup
            key={d}
            dept={d}
            items={items}
            onOpenTask={onOpenTask}
          />
        );
      })}
    </div>
  );
}

function DeptGroup({
  dept,
  items,
  onOpenTask,
}: {
  dept: OnboardingDepartment | "unassigned";
  items: OnboardingTaskNode[];
  onOpenTask: (t: OnboardingTaskNode) => void;
}) {
  const [open, setOpen] = useState(true);
  const label =
    dept === "unassigned"
      ? "Unassigned"
      : DEPARTMENT_LABELS[dept as OnboardingDepartment];
  const tone =
    dept === "unassigned"
      ? "neutral"
      : DEPARTMENT_TONE[dept as OnboardingDepartment];

  const countable = items.filter((t) => t.status !== "na");
  const done = items.filter((t) => t.status === "done").length;
  const pct =
    countable.length === 0 ? 0 : Math.round((done / countable.length) * 100);

  return (
    <div className="haven-card rounded-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-alt/30 rounded-card"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Badge tone={tone}>{label}</Badge>
        <div className="flex-1 h-1.5 rounded-full bg-surface-alt overflow-hidden max-w-[280px]">
          <div
            className={
              "h-full " +
              (pct === 100 ? "bg-emerald-500" : "bg-haven-coral-600")
            }
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {done}/{countable.length} · {pct}%
        </span>
        <span className="text-xs text-muted-foreground">
          {items.length} task{items.length === 1 ? "" : "s"}
        </span>
      </button>

      {open ? (
        <div className="border-t border-border/50 p-1.5 flex flex-col">
          {items.map((t) => (
            <DeptTaskRow key={t.id} task={t} onOpenTask={onOpenTask} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DeptTaskRow({
  task,
  onOpenTask,
}: {
  task: OnboardingTaskNode;
  onOpenTask: (t: OnboardingTaskNode) => void;
}) {
  const [pending, startTransition] = useTransition();
  const onStatus = (status: OnboardingTaskStatus) => {
    startTransition(async () => {
      try {
        await updateTaskStatus(task.id, status);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };
  return (
    <div className="flex items-center gap-2 py-0.5 pl-1 pr-1 rounded-md hover:bg-surface-alt/40">
      <TaskCheckbox
        status={task.status}
        onToggle={onStatus}
        disabled={pending}
        size="sm"
      />
      <button
        type="button"
        onClick={() => onOpenTask(task)}
        className="flex-1 min-w-0 flex items-center gap-2 text-[13px] py-1 text-left"
      >
        {task.is_key_date ? (
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
        ) : null}
        <span
          className={
            "flex-1 min-w-0 truncate " +
            (task.status === "done"
              ? "line-through text-muted-foreground"
              : "")
          }
        >
          {task.title}
        </span>
      </button>
    </div>
  );
}
