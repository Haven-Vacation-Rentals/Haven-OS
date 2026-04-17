"use client";

/**
 * ListViewTable — ClickUp-parity rewrite.
 *
 * New in this version:
 * - StatusPill + StatusPickerPopover for status cell
 * - Dynamic custom-field columns from list's field_defs
 * - Multi-select checkbox column + animated BulkActionsBar
 * - Unified DndContext across ALL status groups for cross-group drag
 *   - Droppable group zones (id: "group:<statusId>") accept drops
 *   - Nest zones on each task row (id: "nest:<taskId>") set parent_id
 * - framer-motion AnimatePresence + layout around rows
 * - Keyboard shortcuts: n, /, ↑↓, space, esc, cmd+a
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
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { KeyboardSensor } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Settings2,
  Trash2,
  Copy,
  CornerDownRight,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TaskDetailDrawer } from "@/components/work/task-detail-drawer";
import { ListSettingsPanel } from "@/components/work/list-settings-panel";
import { ListTaskRow } from "@/components/work/list-task-row";
import { ListAddRow } from "@/components/work/list-add-row";
import { StatusPill } from "@/components/work/status-pill";
import { StatusPickerPopover } from "@/components/work/status-picker-popover";
import { BulkActionsBar } from "@/components/work/bulk-actions-bar";
import { CustomFieldCell } from "@/components/work/custom-field-cell";
import {
  updateTask,
  reorderTasks,
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
// Droppable group zone — wraps each status group's row area
// ---------------------------------------------------------------------------

function DroppableGroupZone({
  groupKey,
  children,
}: {
  groupKey: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `group:${groupKey}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors duration-150",
        isOver && "bg-accent/5",
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Droppable nest zone — wraps the chevron area of each task row
// ---------------------------------------------------------------------------

function useNestDroppable(taskId: string) {
  const { setNodeRef, isOver } = useDroppable({ id: `nest:${taskId}` });
  return { ref: setNodeRef, isOver };
}

// ---------------------------------------------------------------------------
// Sortable task row wrapper (DnD)
// ---------------------------------------------------------------------------

function SortableTaskRow({
  task,
  statuses,
  members,
  fieldDefs,
  depth,
  expandedSubtasks,
  selectedIds,
  focusedTaskId,
  onToggleSubtasks,
  onSelect,
  onUpdate,
  onContextMenu,
  onToggleSelected,
  onStatusChange,
  onSubtaskAdded,
}: {
  task: TaskWithSubtasks;
  statuses: Status[];
  members: { id: string; full_name: string | null; avatar_url: string | null }[];
  fieldDefs: CustomFieldDef[];
  depth: number;
  expandedSubtasks: Set<string>;
  selectedIds: Set<string>;
  focusedTaskId: string | null;
  onToggleSubtasks: (id: string) => void;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TaskWithSubtasks>) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onToggleSelected: (id: string, e?: React.MouseEvent) => void;
  onStatusChange: (task: TaskWithSubtasks, status: Status) => void;
  onSubtaskAdded?: (task: TaskWithSubtasks) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const nestDroppable = useNestDroppable(task.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedIds.has(task.id);
  const isFocused = focusedTaskId === task.id;
  const currentStatus = statuses.find((s) => s.id === task.status_id) ?? null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "group flex items-stretch border-b border-border/20 transition-colors duration-[120ms] ease-out",
        isSelected && "bg-accent/5",
        isFocused && !isSelected && "bg-surface-alt/60",
        !isSelected && !isFocused && "hover:bg-surface-alt/30",
      )}
      onContextMenu={(e) => onContextMenu(e, task.id)}
    >
      {/* Checkbox column */}
      <div
        className={cn(
          "flex w-9 shrink-0 items-center justify-center border-r border-border/20 transition-opacity",
          "opacity-0 group-hover:opacity-100",
          isSelected && "opacity-100",
        )}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelected(task.id, e.nativeEvent as unknown as React.MouseEvent)}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5 rounded accent-accent cursor-pointer"
        />
      </div>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex w-6 shrink-0 cursor-grab items-center justify-center text-muted-foreground/20 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Main task row content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-stretch">
          {/* Task row (handles title, status circle, priority, assignee, due date, subtasks) */}
          <div className="min-w-0 flex-1">
            <ListTaskRow
              task={task}
              statuses={statuses}
              members={members}
              depth={depth}
              expandedSubtasks={expandedSubtasks}
              onToggleSubtasks={onToggleSubtasks}
              onSelect={onSelect}
              onStatusChange={onStatusChange}
              onUpdate={onUpdate}
              onContextMenu={onContextMenu}
              onSubtaskAdded={onSubtaskAdded}
              nestDroppableProps={nestDroppable}
            />
          </div>

          {/* Status pill column */}
          <div className="flex w-28 shrink-0 items-center border-l border-border/20 px-2">
            <StatusPickerPopover
              statuses={statuses}
              currentStatus={currentStatus}
              onSelect={(status) => onStatusChange(task, status)}
            >
              <div>
                <StatusPill
                  status={currentStatus}
                  interactive={true}
                  taskId={task.id}
                  size="sm"
                />
              </div>
            </StatusPickerPopover>
          </div>

          {/* Custom field columns */}
          {fieldDefs.map((fd) => (
            <div
              key={fd.id}
              className="flex w-28 shrink-0 items-center border-l border-border/20 px-2"
              onClick={(e) => e.stopPropagation()}
            >
              <CustomFieldCell
                taskId={task.id}
                fieldDef={fd}
                value={task.custom_fields?.[fd.id]}
                onValueChange={(val) => {
                  onUpdate(task.id, {
                    custom_fields: { ...task.custom_fields, [fd.id]: val },
                  });
                }}
                compact={true}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

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
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    taskId: string;
    x: number;
    y: number;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastClickedId = useRef<string | null>(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      // n — new task
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey && !inInput) {
        e.preventDefault();
        const addBtn = document.querySelector<HTMLButtonElement>("[data-add-task-trigger]");
        addBtn?.click();
        return;
      }

      // / — search
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !inInput) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Escape — close drawer, clear selection
      if (e.key === "Escape") {
        if (selectedTaskId) {
          setSelectedTaskId(null);
        } else if (selectedIds.size > 0) {
          setSelectedIds(new Set());
        } else if (contextMenu) {
          setContextMenu(null);
        }
        return;
      }

      // cmd+a — select all visible tasks
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && !inInput) {
        e.preventDefault();
        setSelectedIds(new Set(tasks.map((t) => t.id)));
        return;
      }

      // ↑↓ — navigate rows
      if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !inInput) {
        e.preventDefault();
        const visibleTasks = tasks;
        const currentIndex = focusedTaskId
          ? visibleTasks.findIndex((t) => t.id === focusedTaskId)
          : -1;
        const nextIndex =
          e.key === "ArrowDown"
            ? Math.min(currentIndex + 1, visibleTasks.length - 1)
            : Math.max(currentIndex - 1, 0);
        const nextTask = visibleTasks[nextIndex];
        if (nextTask) setFocusedTaskId(nextTask.id);
        return;
      }

      // space — open focused task drawer
      if (e.key === " " && !inInput && focusedTaskId) {
        e.preventDefault();
        setSelectedTaskId(focusedTaskId);
        return;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTaskId, selectedIds, contextMenu, tasks, focusedTaskId]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(
      (t) => t.status?.category === "done" || t.status?.category === "closed",
    ).length;
    const open = total - done;
    return { total, done, open };
  }, [tasks]);

  // Filtered tasks
  const filtered = useMemo(() => {
    let result = tasks;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all" && statusFilter !== "open") {
      result = result.filter((t) => {
        const cat = t.status?.category;
        if (statusFilter === "todo") return cat === "todo";
        if (statusFilter === "in_progress") return cat === "in_progress";
        if (statusFilter === "done") return cat === "done" || cat === "closed";
        if (statusFilter === "blocked") return cat === "in_progress";
        return true;
      });
    } else if (statusFilter === "open") {
      result = result.filter(
        (t) => t.status?.category !== "done" && t.status?.category !== "closed",
      );
    }

    result = [...result].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "title") return a.title.localeCompare(b.title) * dir;
      if (sortKey === "priority") {
        return ((PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)) * dir;
      }
      if (sortKey === "due_date") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1 * dir;
        if (!b.due_date) return -1 * dir;
        return a.due_date.localeCompare(b.due_date) * dir;
      }
      return (a.order - b.order) * dir;
    });

    return result;
  }, [tasks, search, statusFilter, sortKey, sortDir]);

  // Group by status
  const groups = useMemo(() => {
    if (groupBy !== "status") return [{ status: null, tasks: filtered }];

    const groupMap = new Map<string, { status: Status | null; tasks: TaskWithSubtasks[] }>();
    for (const s of statuses) groupMap.set(s.id, { status: s, tasks: [] });
    groupMap.set("__none__", { status: null, tasks: [] });

    for (const t of filtered) {
      const key = t.status_id ?? "__none__";
      if (groupMap.has(key)) groupMap.get(key)!.tasks.push(t);
      else groupMap.get("__none__")!.tasks.push(t);
    }

    return Array.from(groupMap.values());
  }, [filtered, statuses, groupBy]);

  // All task ids across all groups (for unified SortableContext)
  const allTaskIds = useMemo(() => groups.flatMap((g) => g.tasks.map((t) => t.id)), [groups]);

  // Build a map of taskId → statusId for quick lookup
  const taskStatusMap = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const t of tasks) m.set(t.id, t.status_id);
    return m;
  }, [tasks]);

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
      startTransition(async () => {
        const {
          subtasks_done: _sd,
          subtask_list: _sl,
          status: _st,
          subtask_count: _sc,
          assignees: _as,
          ...serverUpdates
        } = updates as Record<string, unknown>;
        if (Object.keys(serverUpdates).length > 0) {
          await updateTask(taskId, serverUpdates as Parameters<typeof updateTask>[1]);
        }
      });
    },
    [],
  );

  const handleStatusChange = useCallback(
    (task: TaskWithSubtasks, status: Status) => {
      handleTaskUpdate(task.id, {
        status_id: status.id,
        status,
        completed_at:
          status.category === "done" || status.category === "closed"
            ? new Date().toISOString()
            : null,
      });
    },
    [handleTaskUpdate],
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

  const handleDuplicateTask = useCallback((taskId: string) => {
    setContextMenu(null);
    startTransition(async () => {
      await duplicateTask(taskId);
    });
  }, []);

  const handleTaskAdded = useCallback((newTask: TaskWithSubtasks) => {
    setTasks((prev) => [...prev, newTask]);
  }, []);

  const handleSubtaskAdded = useCallback((newTask: TaskWithSubtasks) => {
    // Add to tasks list (it will show under parent when expanded)
    setTasks((prev) => {
      // Update parent subtask_count + auto-expand
      const updated = prev.map((t) => {
        if (t.id === newTask.parent_id) {
          return {
            ...t,
            subtask_count: (t.subtask_count ?? 0) + 1,
            subtask_list: [...(t.subtask_list ?? []), newTask],
          };
        }
        return t;
      });
      return updated;
    });
    // Expand parent
    if (newTask.parent_id) {
      setExpandedSubtasks((prev) => new Set([...prev, newTask.parent_id!]));
    }
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, taskId: string) => {
      e.preventDefault();
      setContextMenu({ taskId, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleToggleSelected = useCallback(
    (taskId: string, e?: React.MouseEvent) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        // Shift+click → range select
        if (e?.shiftKey && lastClickedId.current) {
          const allIds = tasks.map((t) => t.id);
          const fromIdx = allIds.indexOf(lastClickedId.current);
          const toIdx = allIds.indexOf(taskId);
          const [start, end] = [Math.min(fromIdx, toIdx), Math.max(fromIdx, toIdx)];
          for (let i = start; i <= end; i++) next.add(allIds[i]);
        } else {
          if (next.has(taskId)) next.delete(taskId);
          else next.add(taskId);
        }
        return next;
      });
      lastClickedId.current = taskId;
    },
    [tasks],
  );

  // -------------------------------------------------------------------------
  // DnD — drag over handler (no-op: nest visual feedback handled by useDroppable)
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleDragOver(_event: DragOverEvent) {
    // Visual feedback for nest zones is handled by useDroppable's isOver
    // inside useNestDroppable — no additional state needed here.
  }

  // -------------------------------------------------------------------------
  // DnD — drag end handler (cross-group + nest + same-group reorder)
  // -------------------------------------------------------------------------
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // ── Case 1: Drop on a nest zone → set parent_id ───────────────────────
    if (overId.startsWith("nest:")) {
      const targetTaskId = overId.slice(5);
      // Don't nest a task into itself or into one of its own subtasks
      if (targetTaskId === activeId) return;

      // Snapshot for rollback
      const prevTasks = tasks;

      // Optimistic update: remove from tasks list (it becomes a subtask), update parent
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === targetTaskId) {
            return {
              ...t,
              subtask_count: (t.subtask_count ?? 0) + 1,
            };
          }
          if (t.id === activeId) {
            return { ...t, parent_id: targetTaskId };
          }
          return t;
        }),
      );

      // Expand target to show newly nested task
      setExpandedSubtasks((prev) => new Set([...prev, targetTaskId]));

      startTransition(async () => {
        try {
          await updateTask(activeId, { parent_id: targetTaskId });
        } catch {
          setTasks(prevTasks);
          toast.error("Failed to nest task — changes reverted");
        }
      });
      return;
    }

    // ── Case 2: Drop on a group zone → cross-group status change ─────────
    if (overId.startsWith("group:")) {
      const targetGroupKey = overId.slice(6);
      const targetStatusId = targetGroupKey === "__none__" ? null : targetGroupKey;

      // Find current status of dragged task
      const currentStatusId = taskStatusMap.get(activeId);
      if (currentStatusId === targetStatusId) return; // same group, no-op

      const targetStatus = targetStatusId
        ? statuses.find((s) => s.id === targetStatusId) ?? null
        : null;

      // Snapshot for rollback
      const prevTasks = tasks;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === activeId) {
            return {
              ...t,
              status_id: targetStatusId,
              status: targetStatus,
              completed_at:
                targetStatus?.category === "done" || targetStatus?.category === "closed"
                  ? new Date().toISOString()
                  : null,
            };
          }
          return t;
        }),
      );

      startTransition(async () => {
        try {
          await updateTask(activeId, {
            status_id: targetStatusId ?? undefined,
            completed_at:
              targetStatus?.category === "done" || targetStatus?.category === "closed"
                ? new Date().toISOString()
                : undefined,
          });
        } catch {
          setTasks(prevTasks);
          toast.error("Failed to update status — changes reverted");
        }
      });
      return;
    }

    // ── Case 3: Drop on another task id → check if same group or cross-group
    const activeStatusId = taskStatusMap.get(activeId);
    const overStatusId = taskStatusMap.get(overId);

    if (activeStatusId !== overStatusId) {
      // Cross-group: change status to match the target task's group
      const targetStatus = overStatusId
        ? statuses.find((s) => s.id === overStatusId) ?? null
        : null;

      const prevTasks = tasks;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === activeId) {
            return {
              ...t,
              status_id: overStatusId ?? null,
              status: targetStatus,
              completed_at:
                targetStatus?.category === "done" || targetStatus?.category === "closed"
                  ? new Date().toISOString()
                  : null,
            };
          }
          return t;
        }),
      );

      startTransition(async () => {
        try {
          await updateTask(activeId, {
            status_id: overStatusId ?? undefined,
            completed_at:
              targetStatus?.category === "done" || targetStatus?.category === "closed"
                ? new Date().toISOString()
                : undefined,
          });
        } catch {
          setTasks(prevTasks);
          toast.error("Failed to update status — changes reverted");
        }
      });
      return;
    }

    // ── Case 4: Same group reorder ─────────────────────────────────────────
    setTasks((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === activeId);
      const newIndex = prev.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Persist order values
      const updates = reordered
        .filter((t) => t.status_id === activeStatusId)
        .map((t, i) => ({ id: t.id, order: i }));

      startTransition(async () => {
        try {
          await reorderTasks(updates);
        } catch {
          // Non-critical: reorder failed, local state is still updated
          toast.error("Failed to save reorder");
        }
      });

      return reordered;
    });
  }

  const handleBulkTasksDeleted = useCallback((ids: string[]) => {
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    setSelectedIds(new Set());
  }, []);

  const handleBulkTasksUpdated = useCallback(
    (
      ids: string[],
      updates: { status_id?: string; priority?: TaskPriority; due_date?: string | null },
    ) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (!ids.includes(t.id)) return t;
          const statusUpdate = updates.status_id
            ? { status: statuses.find((s) => s.id === updates.status_id) ?? t.status }
            : {};
          return { ...t, ...updates, ...statusUpdate };
        }),
      );
    },
    [statuses],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
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
                const addBtn = document.querySelector<HTMLButtonElement>("[data-add-task-trigger]");
                addBtn?.click();
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add task
            </Button>
          </div>
        </div>

        {/* Status filter pills + search */}
        <div className="flex items-center gap-2 flex-wrap">
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

          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
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
            {/* Checkbox + drag columns */}
            <div className="flex w-9 shrink-0 items-center justify-center border-r border-border/30 px-2 py-1.5">
              <input
                type="checkbox"
                checked={selectedIds.size === tasks.length && tasks.length > 0}
                onChange={(e) => {
                  if (e.target.checked) setSelectedIds(new Set(tasks.map((t) => t.id)));
                  else setSelectedIds(new Set());
                }}
                className="h-3.5 w-3.5 rounded accent-accent cursor-pointer"
              />
            </div>
            <div className="w-6 shrink-0" />

            {/* Task title column */}
            <div className="sticky left-0 z-10 min-w-0 flex-1 bg-inherit px-3 py-1.5">
              Task
            </div>

            {/* Fixed columns */}
            <div className="flex shrink-0 items-center">
              <ColHeader width={112}>Status</ColHeader>
              <ColHeader width={80}>Priority</ColHeader>
              <ColHeader width={72}>Assignee</ColHeader>
              <ColHeader width={96}>Due Date</ColHeader>
              <ColHeader width={56}>Sub</ColHeader>
              {/* Dynamic field columns */}
              {fieldDefs.map((fd) => (
                <ColHeader key={fd.id} width={112}>
                  {fd.name}
                </ColHeader>
              ))}
            </div>
          </div>

          {/* Groups — single unified DndContext wraps ALL groups */}
          <DndContext
            sensors={dndSensors}
            collisionDetection={closestCenter}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={allTaskIds}
              strategy={verticalListSortingStrategy}
            >
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
                        style={{ backgroundColor: group.status?.color ?? "#94a3b8" }}
                      />
                      <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                        {group.status?.name ?? "No Status"}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground/60">
                        {group.tasks.length}
                      </span>
                    </button>

                    {/* Task rows — wrapped in DroppableGroupZone */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <DroppableGroupZone groupKey={groupKey}>
                          {group.tasks.length === 0 && !search ? (
                            <div className="px-3 py-3 text-[12px] text-muted-foreground/50 border-b border-border/20">
                              Drop tasks here or add a new one
                            </div>
                          ) : null}

                          {group.tasks.map((task) => (
                            <SortableTaskRow
                              key={task.id}
                              task={task}
                              statuses={statuses}
                              members={members}
                              fieldDefs={fieldDefs}
                              depth={0}
                              expandedSubtasks={expandedSubtasks}
                              selectedIds={selectedIds}
                              focusedTaskId={focusedTaskId}
                              onToggleSubtasks={toggleSubtasks}
                              onSelect={(id) => {
                                setSelectedTaskId(id);
                                setFocusedTaskId(id);
                              }}
                              onUpdate={handleTaskUpdate}
                              onContextMenu={handleContextMenu}
                              onToggleSelected={handleToggleSelected}
                              onStatusChange={handleStatusChange}
                              onSubtaskAdded={handleSubtaskAdded}
                            />
                          ))}

                          {/* Subtasks */}
                          {group.tasks.flatMap((task) =>
                            expandedSubtasks.has(task.id)
                              ? task.subtask_list.map((sub) => (
                                  <SortableTaskRow
                                    key={sub.id}
                                    task={sub as TaskWithSubtasks}
                                    statuses={statuses}
                                    members={members}
                                    fieldDefs={fieldDefs}
                                    depth={1}
                                    expandedSubtasks={expandedSubtasks}
                                    selectedIds={selectedIds}
                                    focusedTaskId={focusedTaskId}
                                    onToggleSubtasks={toggleSubtasks}
                                    onSelect={(id) => {
                                      setSelectedTaskId(id);
                                      setFocusedTaskId(id);
                                    }}
                                    onUpdate={handleTaskUpdate}
                                    onContextMenu={handleContextMenu}
                                    onToggleSelected={handleToggleSelected}
                                    onStatusChange={handleStatusChange}
                                    onSubtaskAdded={handleSubtaskAdded}
                                  />
                                ))
                              : [],
                          )}

                          {/* Add task row per group */}
                          <ListAddRow
                            listId={list.id}
                            statusId={group.status?.id ?? null}
                            onAdded={handleTaskAdded}
                          />
                        </DroppableGroupZone>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </SortableContext>
          </DndContext>

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-surface-alt p-4">
                <CornerDownRight className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Press <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono">N</kbd> or click Add task
              </p>
              <Button
                size="sm"
                className="mt-4"
                data-add-task-trigger
                onClick={() => {
                  const addBtn = document.querySelector<HTMLButtonElement>("[data-add-task-input]");
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
            members={members}
            onClose={() => setSelectedTaskId(null)}
          />
        ) : null}

        {/* Settings panel */}
        {settingsOpen ? (
          <ListSettingsPanel
            list={list}
            statuses={statuses}
            fieldDefs={fieldDefs}
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

      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        statuses={statuses}
        onClearSelection={() => setSelectedIds(new Set())}
        onTasksDeleted={handleBulkTasksDeleted}
        onTasksUpdated={handleBulkTasksUpdated}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column header
// ---------------------------------------------------------------------------

function ColHeader({ width, children }: { width: number; children: React.ReactNode }) {
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
