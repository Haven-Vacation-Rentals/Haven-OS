"use client";

import { useState } from "react";
import { TaskRow, TaskRowHeader } from "./task-row";
import { AddTaskRow } from "./add-task-row";
import { TaskDetailDrawer } from "./task-detail-drawer";
import type { TaskWithRelations, Status, CustomFieldDef, List } from "@/lib/work/types";

export function ListView({
  list,
  tasks,
  statuses,
  fieldDefs,
}: {
  list: List;
  tasks: TaskWithRelations[];
  statuses: Status[];
  fieldDefs: CustomFieldDef[];
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Group by status category
  const grouped = groupByStatus(tasks, statuses);

  return (
    <div className="flex gap-0">
      {/* Main list */}
      <div className="min-w-0 flex-1 overflow-x-auto">
        {/* Column headers */}
        <TaskRowHeader fieldDefs={fieldDefs} />

        {grouped.map((group) => (
          <div key={group.status?.id ?? "none"}>
            {/* Status group header */}
            <div className="flex items-center gap-2 bg-surface-alt/30 px-3 py-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: group.status?.color ?? "#94a3b8",
                }}
              />
              <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                {group.status?.name ?? "No Status"}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground/70">
                {group.tasks.length}
              </span>
            </div>

            {/* Tasks */}
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                statuses={statuses}
                fieldDefs={fieldDefs}
                onSelect={setSelectedTaskId}
              />
            ))}
          </div>
        ))}

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

function groupByStatus(tasks: TaskWithRelations[], statuses: Status[]) {
  const groups = statuses.map((s) => ({
    status: s,
    tasks: tasks.filter((t) => t.status_id === s.id),
  }));

  const noStatus = tasks.filter(
    (t) => !t.status_id || !statuses.some((s) => s.id === t.status_id),
  );

  if (noStatus.length > 0) {
    groups.push({ status: null as unknown as Status, tasks: noStatus });
  }

  // Only return groups that have tasks, or the first status (todo) even if empty
  return groups.filter(
    (g, i) => g.tasks.length > 0 || i === 0,
  );
}
