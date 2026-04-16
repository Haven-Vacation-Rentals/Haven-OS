"use client";

/**
 * ListViewTable — Tendwell-style rich table for a single list.
 *
 * Features:
 * - Grouped by status (collapsible sections)
 * - Inline editing: title (double-click), priority, due date
 * - Assignee avatar stack
 * - Subtask expand/collapse with {done}/{total} indicator
 * - Add-task inline row at bottom of each group
 * - Search + status filter pills in header
 * - Done counter chip
 * - Detail drawer integration
 * - Context menu: Delete, Duplicate, Move to list (planned)
 */

import {
  useState,
  useTransition,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Settings2,
  Trash2,
  Copy,
  CornerDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TaskDetailDrawer } from "@/components/work/task-detail-drawer";
import { ListSettingsPanel } from "@/components/work/list-settings-panel";
import { ListTaskRow } from "@/components/work/list-task-row";
import { ListAddRow } from "@/components/work/list-add-row";
import {
  updateTask,
  deleteTask,
  duplicateTask,
} from "@/lib/work/actions";
import type {
  List,
  Status,
  CustomFieldDef,
  TaskPriority,
} from "@/lib/work/types";
import type { TaskWithSubtasks } from "@/lib/work/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StatusFilter =
  | "all"
  | "open"
  | "todo"
  | "in_progress"
  | "done"
  | "blocked";

type SortKey = "order" | "title" | "priority" | "due_date";
type SortDir = "asc" | "desc";

type GroupByKey = "status" | "priority" | "assignee";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
  none: 4,
};

// ---------------------------------------------------------------------------
// ListViewTable — main client component
// ---------------------------------------------------------------------------

export function ListViewTable({
  list,
  tasks: initialTasks,
  statuses,
  fieldDefs,
  members,
}: {
  list: List;
  tasks: TaskWithSubtasks[];
  statuses: Status[];
  fieldDefs: CustomFieldDef[];
  members: { id: string; full_name: string | null; avatar_url: string | null }[];
}) {
  const [tasks, setTasks] = useState<TaskWithSubtasks[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey] = useState<SortKey>("order");
  const [sortDir] = useState<SortDir>("asc");
  const [groupBy] = useState<GroupByKey>("status");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(statuses.map((s) => s.id)),
  );
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(
    new Set(),
  );
  const [contextMenu, setContextMenu] = useState<{
    taskId: string;
    x: number;
    y: number;
  } | null>(null);
  const [, startTransition] = useTransition();
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Keep local tasks in sync when prop changes (server refresh)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    function handler(e: MouseEvent) {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  // Keyboard: 'n' to focus add-task input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "n" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        const addBtn = document.querySelector<HTMLButtonElement>(
          "[data-add-task-trigger]",
        );
        addBtn?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(
      (t) =>
        t.status?.category === "done" || t.status?.category === "closed",
    ).length;
    const open = total - done;
    return { total, done, open };
  }, [tasks]);

  // Filtered tasks
  const filtered = useMemo(() => {
    let result = tasks;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter !== "all" && statusFilter !== "open") {
      result = result.filter((t) => {
        const cat = t.status?.category;
        if (statusFilter === "todo") return cat === "todo";
        if (statusFilter === "in_progress") return cat === "in_progress";
        if (statusFilter === "done")
          return cat === "done" || cat === "closed";
        if (statusFilter === "blocked") return cat === "in_progress"; // use blocked label
        return true;
      });
    } else if (statusFilter === "open") {
      result = result.filter(
        (t) =>
          t.status?.category !== "done" && t.status?.category !== "closed",
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "title") {
        return a.title.localeCompare(b.title) * dir;
      }
      if (sortKey === "priority") {
        return (
          ((PRIORITY_ORDER[a.priority] ?? 4) -
            (PRIORITY_ORDER[b.priority] ?? 4)) *
          dir
        );
      }
      if (sortKey === "due_date") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1 * dir;
        if (!b.due_date) return -1 * dir;
        return a.due_date.localeCompare(b.due_date) * dir;
      }
      // default: order
      return (a.order - b.order) * dir;
    });

    return result;
  }, [tasks, search, statusFilter, sortKey, sortDir]);

  // Group by status
  const groups = useMemo(() => {
    if (groupBy !== "status") {
      return [{ status: null, tasks: filtered }];
    }

    // Create one group per status (in status order), plus "No Status"
    const groupMap = new Map<string, { status: Status | null; tasks: TaskWithSubtasks[] }>();

    for (const s of statuses) {
      groupMap.set(s.id, { status: s, tasks: [] });
    }
    groupMap.set("__none__", { status: null, tasks: [] });

    for (const t of filtered) {
      const key = t.status_id ?? "__none__";
      if (groupMap.has(key)) {
        groupMap.get(key)!.tasks.push(t);
      } else {
        groupMap.get("__none__")!.tasks.push(t);
      }
    }

    // Return all groups (even empty ones for "Add task" UI)
    return Array.from(groupMap.values());
  }, [filtered, statuses, groupBy]);

  // Callbacks
  const toggleGroup = useCallback((id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSubtasks = useCallback((taskId: string) => {
    setExpandedSubtasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const handleTaskUpdate = useCallback(
    (taskId: string, updates: Partial<TaskWithSubtasks>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      );
      // Fire server action
      startTransition(async () => {
        // Filter out non-Task fields before sending to server
        const { subtasks_done: _sd, subtask_list: _sl, status: _st, subtask_count: _sc, assignees: _as, ...serverUpdates } = updates as Record<string, unknown>;
        if (Object.keys(serverUpdates).length > 0) {
          await updateTask(taskId, serverUpdates as Parameters<typeof updateTask>[1]);
        }
      });
    },
    [],
  );

  const handleToggleDone = useCallback(
    (task: TaskWithSubtasks) => {
      const isDone =
        task.status?.category === "done" ||
        task.status?.category === "closed";
      // Find the first todo status or first done status
      const targetStatus = isDone
        ? statuses.find((s) => s.category === "todo") ?? statuses[0]
        : statuses.find(
            (s) => s.category === "done" || s.category === "closed",
          ) ?? statuses[statuses.length - 1];

      if (!targetStatus) return;

      handleTaskUpdate(task.id, {
        status_id: targetStatus.id,
        status: targetStatus,
        completed_at: targetStatus.category === "done" ? new Date().toISOString() : null,
      });
    },
    [statuses, handleTaskUpdate],
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      if (!confirm("Delete this task?")) return;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTaskId === taskId) setSelectedTaskId(null);
      startTransition(async () => {
        await deleteTask(taskId);
      });
      setContextMenu(null);
    },
    [selectedTaskId],
  );

  const handleDuplicateTask = useCallback(
    (taskId: string) => {
      setContextMenu(null);
      startTransition(async () => {
        await duplicateTask(taskId);
      });
    },
    [],
  );

  const handleTaskAdded = useCallback(
    (newTask: TaskWithSubtasks) => {
      setTasks((prev) => [...prev, newTask]);
    },
    [],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, taskId: string) => {
      e.preventDefault();
      setContextMenu({ taskId, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const currentStatus = selectedTaskId
    ? statuses.find((s) => s.id === tasks.find((t) => t.id === selectedTaskId)?.status_id) ?? null
    : null;
  void currentStatus;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
        {/* Row 1: title + badge + actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-heading text-xl font-bold tracking-tight truncate">
              {list.name}
            </h1>
            <Badge tone="neutral" className="shrink-0 text-xs">
              {stats.done}/{stats.total} done
            </Badge>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen((v) => !v)}
              title="List settings"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const addBtn = document.querySelector<HTMLButtonElement>(
                  "[data-add-task-trigger]",
                );
                addBtn?.click();
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add task
            </Button>
          </div>
        </div>

        {/* Row 2: status filter pills + search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter pills */}
          {(
            [
              { key: "all", label: `All (${stats.total})` },
              { key: "open", label: `Open (${stats.open})` },
              { key: "todo", label: "To Do" },
              { key: "in_progress", label: "In Progress" },
              { key: "done", label: "Done" },
            ] as { key: StatusFilter; label: string }[]
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === f.key
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:bg-surface-alt hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="h-8 w-44 pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-auto">
          {/* Column header */}
          <div className="sticky top-0 z-20 flex items-center border-b border-border bg-surface-alt/80 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="sticky left-0 z-10 min-w-0 flex-1 bg-inherit px-3 py-1.5">
              Task
            </div>
            <div className="flex shrink-0 items-center">
              <ColHeader width={80}>Priority</ColHeader>
              <ColHeader width={72}>Assignee</ColHeader>
              <ColHeader width={96}>Due Date</ColHeader>
              <ColHeader width={56}>Sub</ColHeader>
            </div>
          </div>

          {/* Groups */}
          {groups.map((group) => {
            const groupKey = group.status?.id ?? "__none__";
            const isExpanded = expandedGroups.has(groupKey);
            return (
              <div key={groupKey}>
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKey)}
                  className="flex w-full items-center gap-2 border-b border-border/30 bg-surface-alt/30 px-3 py-1.5 text-left hover:bg-surface-alt/60 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: group.status?.color ?? "#94a3b8",
                    }}
                  />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                    {group.status?.name ?? "No Status"}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground/60">
                    {group.tasks.length}
                  </span>
                </button>

                {/* Task rows */}
                {isExpanded && (
                  <>
                    {group.tasks.length === 0 && !search ? (
                      <div className="px-3 py-3 text-[12px] text-muted-foreground/50 border-b border-border/20">
                        No tasks
                      </div>
                    ) : null}

                    {group.tasks.map((task) => (
                      <div key={task.id}>
                        <ListTaskRow
                          task={task}
                          statuses={statuses}
                          members={members}
                          depth={0}
                          expandedSubtasks={expandedSubtasks}
                          onToggleSubtasks={toggleSubtasks}
                          onSelect={setSelectedTaskId}
                          onToggleDone={handleToggleDone}
                          onUpdate={handleTaskUpdate}
                          onContextMenu={handleContextMenu}
                        />

                        {/* Subtasks */}
                        {expandedSubtasks.has(task.id) &&
                          task.subtask_list.map((sub) => (
                            <ListTaskRow
                              key={sub.id}
                              task={sub as TaskWithSubtasks}
                              statuses={statuses}
                              members={members}
                              depth={1}
                              expandedSubtasks={expandedSubtasks}
                              onToggleSubtasks={toggleSubtasks}
                              onSelect={setSelectedTaskId}
                              onToggleDone={handleToggleDone}
                              onUpdate={handleTaskUpdate}
                              onContextMenu={handleContextMenu}
                            />
                          ))}
                      </div>
                    ))}

                    {/* Add task row per group */}
                    <ListAddRow
                      listId={list.id}
                      statusId={group.status?.id ?? null}
                      onAdded={handleTaskAdded}
                    />
                  </>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-surface-alt p-4">
                <CornerDownRight className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No tasks yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Add your first task to get started
              </p>
              <Button
                size="sm"
                className="mt-4"
                data-add-task-trigger
                onClick={() => {
                  const addBtn = document.querySelector<HTMLButtonElement>(
                    "[data-add-task-input]",
                  );
                  addBtn?.focus();
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add your first task
              </Button>
            </div>
          )}
        </div>

        {/* Detail drawer */}
        {selectedTaskId ? (
          <TaskDetailDrawer
            taskId={selectedTaskId}
            statuses={statuses}
            fieldDefs={fieldDefs}
            onClose={() => setSelectedTaskId(null)}
          />
        ) : null}

        {/* Settings panel */}
        {settingsOpen ? (
          <ListSettingsPanel
            list={list}
            members={members}
            onClose={() => setSettingsOpen(false)}
          />
        ) : null}
      </div>

      {/* Context menu */}
      {contextMenu ? (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-40 rounded-card border border-border bg-surface py-1 shadow-card-hover animate-slide-up"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <ContextMenuItem
            icon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
            label="Delete"
            onClick={() => handleDeleteTask(contextMenu.taskId)}
            danger
          />
          <ContextMenuItem
            icon={<Copy className="h-3.5 w-3.5" />}
            label="Duplicate"
            onClick={() => handleDuplicateTask(contextMenu.taskId)}
          />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column header cell
// ---------------------------------------------------------------------------

function ColHeader({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-center border-l border-border/30 px-2 py-1.5"
      style={{ width }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Context menu item
// ---------------------------------------------------------------------------

function ContextMenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-surface-alt",
        danger ? "text-rose-600" : "text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
