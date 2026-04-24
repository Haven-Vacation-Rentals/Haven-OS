"use client";

/**
 * ByDeptTab — tasks grouped by department, with per-dept progress bar.
 * Row click opens the drawer.
 */

import { useState } from "react";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ONBOARDING_DEPARTMENTS,
  DEPARTMENT_LABELS,
  TASK_STATUS_LABELS,
  type OnboardingTaskNode,
  type OnboardingDepartment,
} from "@/lib/onboarding/types";
import {
  DEPARTMENT_TONE,
  TASK_STATUS_TONE,
} from "@/lib/onboarding/utils";

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
            className="h-full bg-haven-coral-600"
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
        <div className="border-t border-border/50 p-2 flex flex-col gap-1">
          {items.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onOpenTask(t)}
              className="flex items-center gap-2 text-[13px] py-1.5 px-2 rounded-md hover:bg-surface-alt text-left"
            >
              {t.is_key_date ? (
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
              ) : (
                <span className="h-3.5 w-3.5 shrink-0" />
              )}
              <span
                className={`flex-1 min-w-0 truncate ${
                  t.status === "done" ? "line-through text-muted-foreground" : ""
                }`}
              >
                {t.title}
              </span>
              <Badge tone={TASK_STATUS_TONE[t.status]}>
                {TASK_STATUS_LABELS[t.status]}
              </Badge>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
