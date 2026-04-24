"use client";

/**
 * TimelineTab — all key-date tasks grouped into timeline buckets.
 * Row click opens the drawer.
 */

import { Star, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OnboardingTaskNode } from "@/lib/onboarding/types";
import {
  DEPARTMENT_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/onboarding/types";
import {
  DEPARTMENT_TONE,
  TASK_STATUS_TONE,
  formatDate,
  formatRelative,
  timelineBucket,
  TIMELINE_BUCKET_LABEL,
  TIMELINE_BUCKET_ORDER,
  type TimelineBucket,
} from "@/lib/onboarding/utils";

export function TimelineTab({
  tasks,
  onOpenTask,
}: {
  tasks: OnboardingTaskNode[];
  onOpenTask: (t: OnboardingTaskNode) => void;
}) {
  const keyDates = tasks.filter((t) => t.is_key_date);
  if (keyDates.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border bg-surface-alt/50 p-8 text-sm text-muted-foreground text-center">
        No key date milestones yet.
      </p>
    );
  }

  const buckets = new Map<TimelineBucket, OnboardingTaskNode[]>();
  for (const t of keyDates) {
    const key = t.status === "done" ? null : timelineBucket(t.due_date);
    if (key === null) continue;
    const arr = buckets.get(key) ?? [];
    arr.push(t);
    buckets.set(key, arr);
  }
  // sort each bucket by due_date ascending (null last)
  for (const arr of buckets.values()) {
    arr.sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date < b.due_date ? -1 : 1;
    });
  }

  const done = keyDates.filter((t) => t.status === "done");

  return (
    <div className="flex flex-col gap-6">
      {TIMELINE_BUCKET_ORDER.map((b) => {
        const items = buckets.get(b);
        if (!items || items.length === 0) return null;
        return (
          <section key={b} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className={
                  "haven-eyebrow " +
                  (b === "overdue"
                    ? "text-rose-700"
                    : b === "today" || b === "this_week"
                    ? "text-amber-700"
                    : "")
                }
              >
                {TIMELINE_BUCKET_LABEL[b]}
              </span>
              <span className="text-xs text-muted-foreground">
                · {items.length}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {items.map((t) => (
                <KeyDateRow key={t.id} task={t} onClick={() => onOpenTask(t)} />
              ))}
            </ul>
          </section>
        );
      })}

      {done.length > 0 ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="haven-eyebrow text-emerald-700">Completed</span>
            <span className="text-xs text-muted-foreground">
              · {done.length}
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {done.map((t) => (
              <KeyDateRow
                key={t.id}
                task={t}
                onClick={() => onOpenTask(t)}
                muted
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function KeyDateRow({
  task,
  onClick,
  muted,
}: {
  task: OnboardingTaskNode;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={
          "haven-card rounded-card w-full text-left p-3 flex items-center gap-3 flex-wrap hover:shadow-md transition-all " +
          (muted ? "opacity-60" : "")
        }
      >
        <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
        <span
          className={
            "flex-1 min-w-0 truncate font-medium text-[14px] " +
            (task.status === "done" ? "line-through text-muted-foreground" : "")
          }
        >
          {task.title}
        </span>
        {task.department ? (
          <Badge tone={DEPARTMENT_TONE[task.department]}>
            {DEPARTMENT_LABELS[task.department]}
          </Badge>
        ) : null}
        {task.due_date ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(task.due_date)}
            <span className="opacity-70">· {formatRelative(task.due_date)}</span>
          </span>
        ) : null}
        <Badge tone={TASK_STATUS_TONE[task.status]} dot>
          {TASK_STATUS_LABELS[task.status]}
        </Badge>
      </button>
    </li>
  );
}
