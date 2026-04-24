"use client";

/**
 * OverviewTab — default landing tab in project detail.
 *
 * Shows: department progress breakdown, upcoming key dates, blocker callouts.
 */

import Link from "next/link";
import {
  AlertTriangle,
  Star,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OnboardingTaskNode } from "@/lib/onboarding/types";
import {
  ONBOARDING_DEPARTMENTS,
  DEPARTMENT_LABELS,
  type OnboardingDepartment,
} from "@/lib/onboarding/types";
import {
  DEPARTMENT_TONE,
  formatDate,
  formatRelative,
  isOverdue,
  daysUntil,
} from "@/lib/onboarding/utils";

export function OverviewTab({
  flatTasks,
  onOpenTask,
}: {
  flatTasks: OnboardingTaskNode[];
  onOpenTask: (t: OnboardingTaskNode) => void;
}) {
  const blockers = flatTasks.filter((t) => t.status === "blocked");
  const inProgress = flatTasks.filter((t) => t.status === "in_progress");
  const upcomingKey = flatTasks
    .filter(
      (t) =>
        t.is_key_date &&
        t.status !== "done" &&
        t.status !== "na" &&
        t.due_date,
    )
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Blockers */}
      <Panel
        title="Blockers"
        icon={<AlertTriangle className="h-4 w-4 text-rose-700" />}
        count={blockers.length}
        empty={
          <EmptyMessage
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />}
            text="No blocked tasks"
          />
        }
      >
        <ul className="flex flex-col gap-1">
          {blockers.slice(0, 6).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onOpenTask(t)}
                className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-alt"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="flex-1 min-w-0 truncate text-[13px]">
                  {t.title}
                </span>
                {t.department ? (
                  <Badge
                    tone={DEPARTMENT_TONE[t.department]}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {DEPARTMENT_LABELS[t.department]}
                  </Badge>
                ) : null}
              </button>
            </li>
          ))}
          {blockers.length > 6 ? (
            <li className="text-[11px] text-muted-foreground px-2 pt-1">
              + {blockers.length - 6} more
            </li>
          ) : null}
        </ul>
      </Panel>

      {/* Upcoming key dates */}
      <Panel
        title="Upcoming key dates"
        icon={<Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
        count={upcomingKey.length}
        empty={
          <EmptyMessage
            icon={<Star className="h-4 w-4 text-muted-foreground" />}
            text="No upcoming key dates"
          />
        }
      >
        <ul className="flex flex-col gap-1">
          {upcomingKey.map((t) => {
            const d = daysUntil(t.due_date);
            const overdue = isOverdue(t.due_date);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpenTask(t)}
                  className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-alt"
                >
                  <Star className="h-3 w-3 shrink-0 text-amber-500 fill-amber-500" />
                  <span className="flex-1 min-w-0 truncate text-[13px]">
                    {t.title}
                  </span>
                  <span
                    className={
                      "text-[11px] shrink-0 tabular-nums " +
                      (overdue
                        ? "text-rose-700 font-semibold"
                        : d !== null && d <= 7
                        ? "text-amber-700 font-semibold"
                        : "text-muted-foreground")
                    }
                  >
                    {formatRelative(t.due_date)}
                    <span className="opacity-60">
                      {" · "}
                      {formatDate(t.due_date)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* In progress right now */}
      <Panel
        title="In progress right now"
        icon={<Activity className="h-4 w-4 text-amber-700" />}
        count={inProgress.length}
        empty={
          <EmptyMessage
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            text="Nothing in progress"
          />
        }
      >
        <ul className="flex flex-col gap-1">
          {inProgress.slice(0, 6).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onOpenTask(t)}
                className="w-full text-left flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-alt"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="flex-1 min-w-0 truncate text-[13px]">
                  {t.title}
                </span>
                {t.department ? (
                  <Badge
                    tone={DEPARTMENT_TONE[t.department]}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {DEPARTMENT_LABELS[t.department]}
                  </Badge>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Dept progress */}
      <Panel
        title="Progress by department"
        icon={<TrendingUp className="h-4 w-4 text-emerald-700" />}
      >
        <DeptProgress tasks={flatTasks} />
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Department progress bars
// ---------------------------------------------------------------------------

function DeptProgress({ tasks }: { tasks: OnboardingTaskNode[] }) {
  const rows: {
    dept: OnboardingDepartment;
    total: number;
    done: number;
    pct: number;
  }[] = [];
  for (const d of ONBOARDING_DEPARTMENTS) {
    const inDept = tasks.filter((t) => t.department === d && t.status !== "na");
    if (inDept.length === 0) continue;
    const done = inDept.filter((t) => t.status === "done").length;
    rows.push({
      dept: d,
      total: inDept.length,
      done,
      pct: Math.round((done / inDept.length) * 100),
    });
  }
  rows.sort((a, b) => b.pct - a.pct);
  if (rows.length === 0) {
    return (
      <EmptyMessage
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        text="No department-tagged tasks"
      />
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.dept} className="flex items-center gap-2">
          <Badge
            tone={DEPARTMENT_TONE[r.dept]}
            className="shrink-0 text-[10px] min-w-[90px] justify-center"
          >
            {DEPARTMENT_LABELS[r.dept]}
          </Badge>
          <div className="flex-1 h-1.5 rounded-full bg-surface-alt overflow-hidden">
            <div
              className="h-full bg-haven-coral-600"
              style={{ width: `${r.pct}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground min-w-[60px] text-right">
            {r.done}/{r.total} · {r.pct}%
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Panel primitive
// ---------------------------------------------------------------------------

function Panel({
  title,
  icon,
  count,
  children,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children?: React.ReactNode;
  empty?: React.ReactNode;
}) {
  const isEmpty = count === 0;
  return (
    <section className="haven-card rounded-card p-4 flex flex-col gap-2">
      <header className="flex items-center gap-2">
        {icon}
        <h4 className="font-heading text-sm font-bold">{title}</h4>
        {typeof count === "number" ? (
          <span className="text-xs text-muted-foreground">{count}</span>
        ) : null}
      </header>
      {isEmpty && empty ? empty : children}
    </section>
  );
}

function EmptyMessage({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 py-3 text-[13px] text-muted-foreground">
      {icon}
      {text}
    </div>
  );
}
