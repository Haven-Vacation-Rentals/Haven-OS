"use client";

import {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  List,
  LayoutGrid,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TaskDetailDrawer } from "@/components/work/task-detail-drawer";
import { ListTypeIcon } from "@/components/work/list-type-icon";
import { getGlobalTasks, getStatuses, getCustomFieldDefs } from "@/lib/work/actions";
import type {
  GlobalTask,
  GlobalTaskFilters,
  TaskPriority,
  Space,
  Status,
  CustomFieldDef,
} from "@/lib/work/types";
import Papa from "papaparse";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = "list" | "board" | "calendar";
type SortKey =
  | "title"
  | "status"
  | "priority"
  | "due_date"
  | "assignee_name"
  | "list_name"
  | "created_at";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
  none: 4,
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
  none: "None",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: "text-rose-600 dark:text-rose-400",
  high: "text-amber-600 dark:text-amber-400",
  normal: "text-sky-600 dark:text-sky-400",
  low: "text-muted-foreground",
  none: "text-muted-foreground/50",
};

// ---------------------------------------------------------------------------
// Helper: format due date (no date-fns needed)
// ---------------------------------------------------------------------------

function formatDueDate(dateStr: string | null): {
  label: string;
  cls: string;
} {
  if (!dateStr) return { label: "No date", cls: "text-muted-foreground" };
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const isOverdue = d < todayStart;
  const isToday = d >= todayStart && d <= todayEnd;
  const diffDays = Math.round(
    (d.getTime() - todayStart.getTime()) / 86400000,
  );

  let label: string;
  if (isToday) {
    label = "Today";
  } else if (isOverdue) {
    label = `${Math.abs(diffDays)}d overdue`;
  } else if (diffDays <= 7) {
    label = `${diffDays}d`;
  } else {
    label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const cls = isOverdue
    ? "text-rose-600 dark:text-rose-400 font-medium"
    : isToday
      ? "text-amber-600 dark:text-amber-400 font-medium"
      : "text-muted-foreground";

  return { label, cls };
}

// ---------------------------------------------------------------------------
// Sort utility
// ---------------------------------------------------------------------------

function sortTasks(
  tasks: GlobalTask[],
  key: SortKey,
  dir: SortDir,
): GlobalTask[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...tasks].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    switch (key) {
      case "title":
        av = a.title.toLowerCase();
        bv = b.title.toLowerCase();
        break;
      case "status":
        av = a.status?.name ?? "";
        bv = b.status?.name ?? "";
        break;
      case "priority":
        av = PRIORITY_ORDER[a.priority];
        bv = PRIORITY_ORDER[b.priority];
        break;
      case "due_date":
        av = a.due_date ?? "9999-99-99";
        bv = b.due_date ?? "9999-99-99";
        break;
      case "assignee_name":
        av = a.assignees[0]?.full_name?.toLowerCase() ?? "";
        bv = b.assignees[0]?.full_name?.toLowerCase() ?? "";
        break;
      case "list_name":
        av = a.list?.name?.toLowerCase() ?? "";
        bv = b.list?.name?.toLowerCase() ?? "";
        break;
      case "created_at":
        av = a.created_at;
        bv = b.created_at;
        break;
    }
    if (av < bv) return -1 * mul;
    if (av > bv) return 1 * mul;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// SortHeader helper
// ---------------------------------------------------------------------------

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground select-none whitespace-nowrap"
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Assignee avatar
// ---------------------------------------------------------------------------

function Avatar({
  profile,
  isPrimary,
}: {
  profile: { full_name: string | null; avatar_url: string | null };
  isPrimary: boolean;
}) {
  const initials = (profile.full_name ?? "?")[0]?.toUpperCase() ?? "?";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    profile.avatar_url ? (
      <img
        src={profile.avatar_url}
        alt={profile.full_name ?? ""}
        className={cn(
          "h-5 w-5 rounded-full object-cover",
          isPrimary && "ring-2 ring-accent",
        )}
      />
    ) : (
      <span
        className={cn(
          "grid h-5 w-5 place-items-center rounded-full bg-muted text-[9px] font-bold",
          isPrimary && "ring-2 ring-accent",
        )}
      >
        {initials}
      </span>
    )
  );
}

// ---------------------------------------------------------------------------
// List view — task row
// ---------------------------------------------------------------------------

function TaskListRow({
  task,
  onSelect,
}: {
  task: GlobalTask;
  onSelect: (id: string) => void;
}) {
  const due = formatDueDate(task.due_date);
  const isDone =
    task.status?.category === "done" || task.status?.category === "closed";

  return (
    <tr
      className="group border-b border-border/50 hover:bg-surface-alt/60 cursor-pointer"
      onClick={() => onSelect(task.id)}
    >
      {/* Done checkbox */}
      <td className="w-8 px-3 py-2">
        <span
          className={cn(
            "grid h-4 w-4 place-items-center rounded border border-border",
            isDone && "border-emerald-500 bg-emerald-500 text-white",
          )}
        >
          {isDone && <CheckSquare className="h-3 w-3" />}
        </span>
      </td>

      {/* Priority */}
      <td className="w-20 px-2 py-2">
        <span className={cn("text-[11px] font-semibold", PRIORITY_COLORS[task.priority])}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </td>

      {/* Title */}
      <td className="min-w-0 px-2 py-2">
        <span
          className={cn(
            "truncate text-[13px] font-medium text-foreground",
            isDone && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </span>
        {task.subtask_count > 0 && (
          <span className="ml-2 text-[10px] text-muted-foreground">
            {task.subtask_count} sub
          </span>
        )}
      </td>

      {/* Status */}
      <td className="w-28 px-2 py-2">
        {task.status && (
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
            style={{ backgroundColor: task.status.color }}
          >
            {task.status.name}
          </span>
        )}
      </td>

      {/* Due date */}
      <td className="w-28 px-2 py-2">
        <span className={cn("text-[12px]", due.cls)}>{due.label}</span>
      </td>

      {/* Assignees */}
      <td className="w-24 px-2 py-2">
        <div className="flex items-center -space-x-1">
          {task.assignees.slice(0, 3).map((a, i) => (
            <Avatar key={a.id} profile={a} isPrimary={i === 0} />
          ))}
          {task.assignees.length > 3 && (
            <span className="ml-1 text-[10px] text-muted-foreground">
              +{task.assignees.length - 3}
            </span>
          )}
        </div>
      </td>

      {/* List name */}
      <td className="w-36 px-2 py-2">
        {task.list && (
          <span className="flex items-center gap-1 truncate">
            <ListTypeIcon type={task.list.type} className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate text-[12px] text-muted-foreground">
              {task.list.name}
            </span>
          </span>
        )}
      </td>

      {/* Space */}
      <td className="w-24 px-2 py-2">
        {task.space && (
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: task.space.color }}
            />
            <span className="truncate text-[12px] text-muted-foreground">
              {task.space.name}
            </span>
          </span>
        )}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// List view
// ---------------------------------------------------------------------------

function ListView({
  tasks,
  onSelect,
}: {
  tasks: GlobalTask[];
  onSelect: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(k: SortKey) {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(
    () => sortTasks(tasks, sortKey, sortDir),
    [tasks, sortKey, sortDir],
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <CheckSquare className="mb-3 h-8 w-8 opacity-30" />
        <p className="text-sm">No tasks match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[800px] border-collapse">
        <thead className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-sm">
          <tr className="border-b border-border">
            <th className="w-8 px-3 py-2" />
            <th className="w-20 px-2 py-2">
              <SortHeader label="Priority" sortKey="priority" current={sortKey} dir={sortDir} onSort={handleSort} />
            </th>
            <th className="px-2 py-2 text-left">
              <SortHeader label="Title" sortKey="title" current={sortKey} dir={sortDir} onSort={handleSort} />
            </th>
            <th className="w-28 px-2 py-2">
              <SortHeader label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
            </th>
            <th className="w-28 px-2 py-2">
              <SortHeader label="Due" sortKey="due_date" current={sortKey} dir={sortDir} onSort={handleSort} />
            </th>
            <th className="w-24 px-2 py-2">
              <SortHeader label="Assignees" sortKey="assignee_name" current={sortKey} dir={sortDir} onSort={handleSort} />
            </th>
            <th className="w-36 px-2 py-2">
              <SortHeader label="List" sortKey="list_name" current={sortKey} dir={sortDir} onSort={handleSort} />
            </th>
            <th className="w-24 px-2 py-2">
              <span className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Space
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => (
            <TaskListRow key={task.id} task={task} onSelect={onSelect} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board view (scaffolded — no drag-drop in this branch)
// ---------------------------------------------------------------------------

function BoardView({
  tasks,
  onSelect,
}: {
  tasks: GlobalTask[];
  onSelect: (id: string) => void;
}) {
  // TODO: Add drag-drop between columns (out of scope for this branch)
  const statusCategories = ["todo", "in_progress", "done", "closed"] as const;
  const categoryLabels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
    closed: "Closed",
  };

  const byCategory = useMemo(() => {
    const map: Record<string, GlobalTask[]> = {};
    for (const cat of statusCategories) map[cat] = [];
    for (const t of tasks) {
      const cat = t.status?.category ?? "todo";
      if (map[cat]) map[cat].push(t);
      else map["todo"].push(t);
    }
    return map;
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusCategories.map((cat) => (
        <div
          key={cat}
          className="w-64 shrink-0 rounded-card border border-border bg-surface-alt/30"
        >
          <div className="border-b border-border px-3 py-2">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              {categoryLabels[cat]}
            </span>
            <span className="ml-1.5 text-[11px] text-muted-foreground">
              ({byCategory[cat].length})
            </span>
          </div>
          <div className="space-y-2 p-2">
            {byCategory[cat].map((task) => {
              const due = formatDueDate(task.due_date);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onSelect(task.id)}
                  className="w-full rounded-md border border-border bg-surface p-2 text-left hover:border-accent/50 hover:shadow-sm"
                >
                  <div className="mb-1 flex items-start justify-between gap-1">
                    <span className="line-clamp-2 text-[12.5px] font-medium text-foreground">
                      {task.title}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-semibold",
                        PRIORITY_COLORS[task.priority],
                      )}
                    >
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[11px]", due.cls)}>
                      {task.due_date ? due.label : ""}
                    </span>
                    {task.assignees[0] && (
                      <Avatar profile={task.assignees[0]} isPrimary />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar view (scaffolded)
// ---------------------------------------------------------------------------

function CalendarView({
  tasks,
  onSelect,
}: {
  tasks: GlobalTask[];
  onSelect: (id: string) => void;
}) {
  // TODO: Add drag-reschedule (out of scope for this branch)
  const [monthOffset, setMonthOffset] = useState(0);
  const base = new Date();
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    if (day < 1 || day > daysInMonth) return null;
    return day;
  });

  const tasksByDate = useMemo(() => {
    const map: Record<string, GlobalTask[]> = {};
    for (const t of tasks) {
      if (!t.due_date) continue;
      if (!map[t.due_date]) map[t.due_date] = [];
      map[t.due_date].push(t);
    }
    return map;
  }, [tasks]);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="flex-1">
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonthOffset((m) => m - 1)}
        >
          &lt;
        </Button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonthOffset((m) => m + 1)}
        >
          &gt;
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-card border border-border bg-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="bg-surface-alt px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null)
            return <div key={i} className="min-h-[80px] bg-background" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayTasks = tasksByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          return (
            <div
              key={i}
              className={cn(
                "min-h-[80px] bg-background p-1",
                isToday && "ring-2 ring-inset ring-accent",
              )}
            >
              <span
                className={cn(
                  "text-[11px]",
                  isToday
                    ? "font-bold text-accent"
                    : "text-muted-foreground",
                )}
              >
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelect(t.id)}
                    className={cn(
                      "w-full truncate rounded px-1 py-0.5 text-left text-[10px]",
                      t.status?.category === "done" ||
                        t.status?.category === "closed"
                        ? "bg-emerald-100 text-emerald-700 line-through dark:bg-emerald-900/20 dark:text-emerald-400"
                        : t.priority === "urgent"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                          : "bg-accent/10 text-accent",
                    )}
                  >
                    {t.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function GlobalTasksView({
  initialTasks,
  spaces,
  members,
  initialFilters,
  hideAssigneeFilter = false,
}: {
  initialTasks: GlobalTask[];
  spaces: Space[];
  members: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  }[];
  initialFilters: GlobalTaskFilters;
  /** When true, the "All assignees" picker is hidden — used by /work/mine. */
  hideAssigneeFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [tasks, setTasks] = useState<GlobalTask[]>(initialTasks);
  const [view, setView] = useState<ViewMode>("list");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [drawerStatuses, setDrawerStatuses] = useState<Status[]>([]);
  const [drawerFieldDefs, setDrawerFieldDefs] = useState<CustomFieldDef[]>([]);

  // Debounce search
  const [localSearch, setLocalSearch] = useState(initialFilters.search ?? "");

  // Update URL params and refresh data
  const updateFilters = useCallback(
    (patch: Partial<GlobalTaskFilters>) => {
      const current = new URLSearchParams(searchParams.toString());

      function set(key: string, val: string | string[] | undefined) {
        if (!val || (Array.isArray(val) && val.length === 0)) {
          current.delete(key);
        } else if (Array.isArray(val)) {
          current.set(key, val.join(","));
        } else {
          current.set(key, val);
        }
      }

      if (patch.search !== undefined) set("search", patch.search);
      if (patch.statuses !== undefined) set("statuses", patch.statuses);
      if (patch.priorities !== undefined) set("priorities", patch.priorities);
      if (patch.assignee_ids !== undefined)
        set("assignee_ids", patch.assignee_ids);
      if (patch.list_ids !== undefined) set("list_ids", patch.list_ids);
      if (patch.space_ids !== undefined) set("space_ids", patch.space_ids);
      if (patch.due !== undefined) set("due", patch.due);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`${pathname}?${current.toString()}` as any);
    },
    [searchParams, router, pathname],
  );

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== (initialFilters.search ?? "")) {
        updateFilters({ search: localSearch || undefined });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh task list when initialTasks changes (from server revalidation)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // When drawer opens, fetch statuses + field defs for that task
  useEffect(() => {
    if (!selectedTaskId) return;
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task?.list_id) return;
    startTransition(async () => {
      const [s, f] = await Promise.all([
        getStatuses(task.list_id),
        getCustomFieldDefs(task.list_id),
      ]);
      setDrawerStatuses(s);
      setDrawerFieldDefs(f);
    });
  }, [selectedTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Current filter state from URL
  function getFilterArr(key: string): string[] {
    const v = searchParams.get(key);
    return v ? v.split(",").filter(Boolean) : [];
  }
  const currentStatuses = getFilterArr("statuses");
  const currentPriorities = getFilterArr("priorities") as TaskPriority[];
  const currentAssigneeIds = getFilterArr("assignee_ids");
  const currentDue = (searchParams.get("due") ?? "all") as GlobalTaskFilters["due"];

  // Toggle helpers
  function toggleStr(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  // Export CSV
  function handleExport() {
    if (tasks.length === 0) return;
    const rows = tasks.map((t) => ({
      Title: t.title,
      Status: t.status?.name ?? "",
      Priority: PRIORITY_LABELS[t.priority],
      Due: t.due_date ?? "",
      List: t.list?.name ?? "",
      Space: t.space?.name ?? "",
      "Primary Assignee": t.assignees[0]?.full_name ?? "",
      Watchers: "", // watchers not preloaded — TODO if needed
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `haven-tasks-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Distinct status names from loaded tasks
  const distinctStatuses = useMemo(() => {
    const names = new Set<string>();
    for (const t of tasks) {
      if (t.status?.name) names.add(t.status.name);
    }
    // Fall back to defaults if nothing loaded
    if (names.size === 0) {
      ["To Do", "In Progress", "In Review", "Done", "Closed"].forEach((n) =>
        names.add(n),
      );
    }
    return [...names];
  }, [tasks]);

  const priorityOptions: TaskPriority[] = ["urgent", "high", "normal", "low"];
  const dueOptions: { value: GlobalTaskFilters["due"]; label: string }[] = [
    { value: "all", label: "All" },
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Today" },
    { value: "this_week", label: "This week" },
    { value: "none", label: "No date" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-foreground">
          All Tasks
        </h1>
        <span className="text-[12px] text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Top-bar controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search tasks…"
            className="h-8 w-52 pl-8 text-[13px]"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {distinctStatuses.slice(0, 5).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                updateFilters({ statuses: toggleStr(currentStatuses, s) })
              }
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                currentStatuses.includes(s)
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-alt text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1">
          {priorityOptions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() =>
                updateFilters({
                  priorities: toggleStr(currentPriorities, p) as TaskPriority[],
                })
              }
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                currentPriorities.includes(p)
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-alt text-muted-foreground hover:text-foreground",
              )}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Due date filter */}
        <select
          value={currentDue ?? "all"}
          onChange={(e) =>
            updateFilters({
              due: e.target.value as GlobalTaskFilters["due"],
            })
          }
          className="h-8 rounded-md border border-border bg-surface px-2 text-[12px] text-foreground"
        >
          {dueOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Assignee picker */}
        {!hideAssigneeFilter && (
          <select
            value={currentAssigneeIds[0] ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              updateFilters({ assignee_ids: v ? [v] : [] });
            }}
            className="h-8 rounded-md border border-border bg-surface px-2 text-[12px] text-foreground"
          >
            <option value="">All assignees</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name ?? m.email}
              </option>
            ))}
          </select>
        )}

        {/* Space picker */}
        <select
          value={getFilterArr("space_ids")[0] ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            updateFilters({ space_ids: v ? [v] : [] });
          }}
          className="h-8 rounded-md border border-border bg-surface px-2 text-[12px] text-foreground"
        >
          <option value="">All spaces</option>
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Spacer */}
        <span className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center overflow-hidden rounded-md border border-border">
          {(
            [
              { mode: "list" as ViewMode, Icon: List, label: "List" },
              { mode: "board" as ViewMode, Icon: LayoutGrid, label: "Board" },
              {
                mode: "calendar" as ViewMode,
                Icon: Calendar,
                label: "Calendar",
              },
            ] as const
          ).map(({ mode, Icon, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                view === mode
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface text-muted-foreground hover:bg-surface-alt",
              )}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Export CSV */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-[12px]"
          onClick={handleExport}
          disabled={tasks.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Active filter badges */}
      {(currentStatuses.length > 0 ||
        currentPriorities.length > 0 ||
        currentAssigneeIds.length > 0) && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-muted-foreground">Filters:</span>
          {currentStatuses.map((s) => (
            <Badge
              key={s}
              tone="neutral"
              className="cursor-pointer text-[10px]"
              onClick={() =>
                updateFilters({ statuses: currentStatuses.filter((x) => x !== s) })
              }
            >
              {s} ×
            </Badge>
          ))}
          {currentPriorities.map((p) => (
            <Badge
              key={p}
              tone="neutral"
              className="cursor-pointer text-[10px]"
              onClick={() =>
                updateFilters({
                  priorities: currentPriorities.filter((x) => x !== p),
                })
              }
            >
              {PRIORITY_LABELS[p]} ×
            </Badge>
          ))}
        </div>
      )}

      {/* View content */}
      <div className="flex flex-1 gap-4">
        <div className="min-w-0 flex-1">
          {view === "list" && (
            <ListView tasks={tasks} onSelect={setSelectedTaskId} />
          )}
          {view === "board" && (
            <BoardView tasks={tasks} onSelect={setSelectedTaskId} />
          )}
          {view === "calendar" && (
            <CalendarView tasks={tasks} onSelect={setSelectedTaskId} />
          )}
        </div>

        {/* Task detail drawer */}
        {selectedTaskId && (
          <TaskDetailDrawer
            taskId={selectedTaskId}
            statuses={drawerStatuses}
            fieldDefs={drawerFieldDefs}
            onClose={() => {
              setSelectedTaskId(null);
              // Refresh tasks after any changes made in drawer
              startTransition(async () => {
                const filters: GlobalTaskFilters = {
                  search: searchParams.get("search") ?? undefined,
                  statuses: getFilterArr("statuses"),
                  priorities: getFilterArr("priorities") as TaskPriority[],
                  assignee_ids: getFilterArr("assignee_ids"),
                  list_ids: getFilterArr("list_ids"),
                  space_ids: getFilterArr("space_ids"),
                  due: (searchParams.get("due") as GlobalTaskFilters["due"]) ?? "all",
                };
                const updated = await getGlobalTasks(filters);
                setTasks(updated);
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
