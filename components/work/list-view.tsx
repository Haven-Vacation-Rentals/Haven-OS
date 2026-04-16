"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskRow, TaskRowHeader } from "./task-row";
import { AddTaskRow } from "./add-task-row";
import { TaskDetailDrawer } from "./task-detail-drawer";
import { reorderTasks } from "@/lib/work/actions";
import type { FlatTask, TaskWithRelations, Status, CustomFieldDef, List } from "@/lib/work/types";

// ---------------------------------------------------------------------------
// SortableTaskRow — wraps TaskRow with dnd-kit sortable
// ---------------------------------------------------------------------------

function SortableTaskRow({
  task,
  statuses,
  fieldDefs,
  onSelect,
  overId,
  overAsChildId,
}: {
  task: FlatTask;
  statuses: Status[];
  fieldDefs: CustomFieldDef[];
  onSelect: (id: string) => void;
  overId: string | null;
  overAsChildId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskRow
        task={task}
        statuses={statuses}
        fieldDefs={fieldDefs}
        onSelect={onSelect}
        isDragging={isDragging}
        dragHandleProps={listeners}
        isOver={overId === task.id}
        isOverAsChild={overAsChildId === task.id}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ListView — main list component with DnD
// ---------------------------------------------------------------------------

export function ListView({
  list,
  tasks: initialTasks,
  statuses,
  fieldDefs,
}: {
  list: List;
  tasks: TaskWithRelations[];
  statuses: Status[];
  fieldDefs: CustomFieldDef[];
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [, startReorder] = useTransition();

  // Convert to FlatTask format (initially all depth=0, no hierarchy in initial data)
  const flatTasks = useMemo(() => {
    return initialTasks.map((t) => ({
      ...t,
      depth: 0,
      children: [] as FlatTask[],
    })) as FlatTask[];
  }, [initialTasks]);

  // Group by status category
  const grouped = useMemo(() => groupByStatus(flatTasks, statuses), [flatTasks, statuses]);

  // DnD state
  const [overId, setOverId] = useState<string | null>(null);
  const [overAsChildId, setOverAsChildId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(_event: DragStartEvent) {
    // Could show a drag overlay here if needed
  }

  function handleDragOver(event: DragOverEvent) {
    const { over, active } = event;
    if (!over || over.id === active.id) {
      setOverId(null);
      setOverAsChildId(null);
      return;
    }

    const overId = over.id as string;

    // Check if pointer is indented (to the right) — means "nest as child"
    const delta = event.delta;
    if (delta && delta.x > 40) {
      setOverAsChildId(overId);
      setOverId(null);
    } else {
      setOverId(overId);
      setOverAsChildId(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setOverId(null);

    if (!over || active.id === over.id) {
      setOverAsChildId(null);
      return;
    }

    const activeTaskId = active.id as string;
    const overTaskId = over.id as string;
    const isNesting = overAsChildId === overTaskId;
    setOverAsChildId(null);

    // Find the tasks in the flat list
    const allTasks = grouped.flatMap((g) => g.tasks);
    const overTask = allTasks.find((t) => t.id === overTaskId);

    if (!overTask) return;

    if (isNesting) {
      // Make active task a child of over task
      startReorder(async () => {
        await reorderTasks([
          { id: activeTaskId, order: 0, parent_id: overTaskId },
        ]);
      });
    } else {
      // Reorder: place active task at the position of over task
      const overIdx = allTasks.findIndex((t) => t.id === overTaskId);
      const activeIdx = allTasks.findIndex((t) => t.id === activeTaskId);

      if (overIdx === -1 || activeIdx === -1) return;

      // Build new order for affected tasks
      const reordered = [...allTasks];
      const [moved] = reordered.splice(activeIdx, 1);
      reordered.splice(overIdx, 0, moved);

      const updates = reordered.map((t, i) => ({
        id: t.id,
        order: i,
        // If nesting back to top level from a subtask
        ...(t.id === activeTaskId && moved.parent_id ? { parent_id: null } : {}),
      }));

      startReorder(async () => {
        await reorderTasks(updates);
      });
    }
  }

  function handleDragCancel() {
    setOverId(null);
    setOverAsChildId(null);
  }

  // Build the flat id list for SortableContext
  const allIds = useMemo(
    () => grouped.flatMap((g) => g.tasks.map((t) => t.id)),
    [grouped],
  );

  return (
    <div className="flex">
      {/* Main list */}
      <div className="min-w-0 flex-1 overflow-x-auto">
        {/* Column headers */}
        <TaskRowHeader fieldDefs={fieldDefs} />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
            {grouped.map((group) => (
              <div key={group.status?.id ?? "none"}>
                {/* Status group header */}
                <StatusGroupHeader status={group.status} count={group.tasks.length} />

                {/* Tasks */}
                {group.tasks.map((task) => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    statuses={statuses}
                    fieldDefs={fieldDefs}
                    onSelect={setSelectedTaskId}
                    overId={overId}
                    overAsChildId={overAsChildId}
                  />
                ))}
              </div>
            ))}
          </SortableContext>
        </DndContext>

        <AddTaskRow listId={list.id} />
      </div>

      {/* Task detail drawer */}
      {selectedTaskId ? (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          statuses={statuses}
          fieldDefs={fieldDefs}
          onClose={() => setSelectedTaskId(null)}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusGroupHeader — collapsible status section
// ---------------------------------------------------------------------------

function StatusGroupHeader({
  status,
  count,
}: {
  status: Status | null;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border/30 bg-surface-alt/30 px-3 py-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: status?.color ?? "#94a3b8",
        }}
      />
      <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
        {status?.name ?? "No Status"}
      </span>
      <span className="text-[11px] font-semibold text-muted-foreground/70">
        {count}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group by status
// ---------------------------------------------------------------------------

function groupByStatus(tasks: FlatTask[], statuses: Status[]) {
  const groups = statuses.map((s) => ({
    status: s as Status | null,
    tasks: tasks.filter((t) => t.status_id === s.id),
  }));

  const noStatus = tasks.filter(
    (t) => !t.status_id || !statuses.some((s) => s.id === t.status_id),
  );

  if (noStatus.length > 0) {
    groups.push({ status: null, tasks: noStatus });
  }

  // Only return groups that have tasks, or the first status (todo) even if empty
  return groups.filter(
    (g, i) => g.tasks.length > 0 || i === 0,
  );
}
