"use client";

/**
 * KanbanTab — tasks grouped into status columns. Cards click → drawer.
 */

import { Star, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  TASK_STATUS_LABELS,
  DEPARTMENT_LABELS,
  type OnboardingTaskNode,
  type OnboardingTaskStatus,
} from "@/lib/onboarding/types";
import {
  TASK_STATUS_TONE,
  DEPARTMENT_TONE,
  formatDateShort,
  isOverdue,
} from "@/lib/onboarding/utils";

export function KanbanTab({
  tasks,
  onOpenTask,
}: {
  tasks: OnboardingTaskNode[];
  onOpenTask: (t: OnboardingTaskNode) => void;
}) {
  const cols: OnboardingTaskStatus[] = [
    "not_started",
    "in_progress",
    "blocked",
    "done",
  ];
  const groups = new Map<OnboardingTaskStatus, OnboardingTaskNode[]>();
  for (const c of cols) groups.set(c, []);
  for (const t of tasks) {
    if (t.status === "na") continue;
    groups.get(t.status)?.push(t);
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cols.map((c) => {
        const items = groups.get(c) ?? [];
        return (
          <div
            key={c}
            className="rounded-card border border-border bg-surface-alt/30 p-3 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <Badge tone={TASK_STATUS_TONE[c]}>{TASK_STATUS_LABELS[c]}</Badge>
              <span className="text-xs text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto">
              {items.map((t) => (
                <KanbanCard key={t.id} task={t} onClick={() => onOpenTask(t)} />
              ))}
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No tasks
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  task,
  onClick,
}: {
  task: OnboardingTaskNode;
  onClick: () => void;
}) {
  const overdue =
    task.due_date && isOverdue(task.due_date) && task.status !== "done";
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-card bg-surface p-2.5 shadow-sm border border-border text-left hover:shadow-md hover:border-foreground/20 transition-all"
    >
      <div className="flex items-start gap-2">
        {task.is_key_date ? (
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
        ) : null}
        <p className="text-[13px] leading-snug flex-1">{task.title}</p>
      </div>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {task.department ? (
          <Badge
            tone={DEPARTMENT_TONE[task.department]}
            className="text-[10px] px-1.5 py-0"
          >
            {DEPARTMENT_LABELS[task.department]}
          </Badge>
        ) : null}
        {task.due_date ? (
          <span
            className={
              "inline-flex items-center gap-1 text-[10px] px-1.5 py-0 rounded-full border " +
              (overdue
                ? "text-rose-700 border-rose-200 bg-rose-50 font-semibold"
                : "text-muted-foreground border-border bg-surface-alt")
            }
          >
            <Calendar className="h-2.5 w-2.5" />
            {formatDateShort(task.due_date)}
          </span>
        ) : null}
      </div>
    </button>
  );
}
