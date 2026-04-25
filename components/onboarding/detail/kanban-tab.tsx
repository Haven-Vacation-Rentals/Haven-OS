"use client";

/**
 * KanbanTab — tasks grouped into status columns with drag-and-drop.
 *
 * Drag a card between columns to change its status. Uses @dnd-kit/core
 * (already a project dep) with PointerSensor + KeyboardSensor + a 6px
 * activation distance so a click still opens the task drawer.
 *
 * Updates are optimistic: we move the card locally, then call
 * updateTaskStatus on the server. On error we revert and toast.
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Star, Calendar, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
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
import { updateTaskStatus } from "@/lib/onboarding/actions";

const COLS: OnboardingTaskStatus[] = [
  "not_started",
  "in_progress",
  "blocked",
  "done",
];

export function KanbanTab({
  tasks,
  onOpenTask,
}: {
  tasks: OnboardingTaskNode[];
  onOpenTask: (t: OnboardingTaskNode) => void;
}) {
  // Local copy so drag changes feel instant; server data resyncs via
  // the parent's revalidation path.
  const [board, setBoard] = useState<OnboardingTaskNode[]>(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Resync when the parent feeds in fresh data.
  useEffect(() => {
    setBoard(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const groups = useMemo(() => {
    const m = new Map<OnboardingTaskStatus, OnboardingTaskNode[]>();
    for (const c of COLS) m.set(c, []);
    for (const t of board) {
      if (t.status === "na") continue;
      m.get(t.status)?.push(t);
    }
    return m;
  }, [board]);

  const activeTask = activeId
    ? board.find((t) => t.id === activeId) ?? null
    : null;

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const taskId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    // The droppable id is either the column status, or another card id
    // (when hovering over an existing card). Resolve to a column.
    let targetCol: OnboardingTaskStatus | null = null;
    if ((COLS as string[]).includes(overId)) {
      targetCol = overId as OnboardingTaskStatus;
    } else {
      const overTask = board.find((t) => t.id === overId);
      if (overTask) targetCol = overTask.status;
    }
    if (!targetCol) return;

    const task = board.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === targetCol) return;

    const prevStatus = task.status;
    // Optimistic update.
    setBoard((curr) =>
      curr.map((t) => (t.id === taskId ? { ...t, status: targetCol! } : t)),
    );

    void (async () => {
      try {
        await updateTaskStatus(taskId, targetCol!);
      } catch (err) {
        // Revert on failure.
        setBoard((curr) =>
          curr.map((t) =>
            t.id === taskId ? { ...t, status: prevStatus } : t,
          ),
        );
        toast.error(
          err instanceof Error ? err.message : "Failed to move task",
        );
      }
    })();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLS.map((c) => (
          <KanbanColumn
            key={c}
            status={c}
            tasks={groups.get(c) ?? []}
            onOpenTask={onOpenTask}
            activeId={activeId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <KanbanCard task={activeTask} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ---------------------------------------------------------------------------
// Column (droppable)
// ---------------------------------------------------------------------------

function KanbanColumn({
  status,
  tasks,
  onOpenTask,
  activeId,
}: {
  status: OnboardingTaskStatus;
  tasks: OnboardingTaskNode[];
  onOpenTask: (t: OnboardingTaskNode) => void;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={
        "rounded-card border bg-surface-alt/30 p-3 flex flex-col gap-3 transition-colors " +
        (isOver
          ? "border-haven-coral-600 bg-accent-soft/50 ring-2 ring-haven-coral-600/30"
          : "border-border")
      }
    >
      <div className="flex items-center justify-between">
        <Badge tone={TASK_STATUS_TONE[status]}>
          {TASK_STATUS_LABELS[status]}
        </Badge>
        <span className="text-xs text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
        {tasks.map((t) => (
          <DraggableKanbanCard
            key={t.id}
            task={t}
            onOpen={() => onOpenTask(t)}
            isOverlayActive={activeId === t.id}
          />
        ))}
        {tasks.length === 0 ? (
          <div
            className={
              "text-xs text-center py-6 rounded-md border border-dashed " +
              (isOver
                ? "text-haven-coral-700 border-haven-coral-300 bg-accent-soft/40"
                : "text-muted-foreground border-border")
            }
          >
            {isOver ? "Drop here" : "No tasks"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable card wrapper
// ---------------------------------------------------------------------------

function DraggableKanbanCard({
  task,
  onOpen,
  isOverlayActive,
}: {
  task: OnboardingTaskNode;
  onOpen: () => void;
  isOverlayActive: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });
  // The whole card is the drag handle — PointerSensor's 6px activation
  // distance ensures a click still opens the drawer.
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      onKeyDown={(e) => {
        // Space is reserved by dnd-kit's keyboard sensor; Enter opens.
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      style={{
        opacity: isDragging || isOverlayActive ? 0.4 : 1,
      }}
      className="touch-none cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:shadow-ring rounded-card"
    >
      <KanbanCard task={task} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function KanbanCard({
  task,
  isDragging,
}: {
  task: OnboardingTaskNode;
  isDragging?: boolean;
}) {
  const overdue =
    task.due_date && isOverdue(task.due_date) && task.status !== "done";
  return (
    <div
      className={
        "group relative rounded-card bg-surface p-2.5 pl-3 shadow-sm border border-border " +
        (isDragging
          ? "shadow-lg border-haven-coral-300 rotate-1"
          : "hover:shadow-md hover:border-foreground/20 transition-all")
      }
    >
      {/* Grip indicator on hover — purely visual, the whole card drags. */}
      <GripVertical className="absolute left-0.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
    </div>
  );
}
