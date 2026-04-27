"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Search, Users, Building2, GripVertical } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeEditor } from "./employee-editor";
import { setEmployeeDepartment } from "@/lib/hr/actions";
import type { DbEmployee } from "@/lib/hr/types";
import type { Department } from "@/lib/admin/actions";

type Props = {
  employees: DbEmployee[];
  departments: Department[];
};

const UNASSIGNED_KEY = "__unassigned__";

export function PeopleDirectory({ employees: initial, departments }: Props) {
  const router = useRouter();
  const [employees, setEmployees] = useState<DbEmployee[]>(initial);
  const [q, setQ] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Resync when server pushes new data.
  useEffect(() => {
    setEmployees(initial);
  }, [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const departmentNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of departments) m.set(d.id, d.name);
    return m;
  }, [departments]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return employees.filter((e) => {
      if (!showInactive && e.status !== "active") return false;
      if (deptFilter === UNASSIGNED_KEY && e.department_id) return false;
      if (deptFilter !== "all" && deptFilter !== UNASSIGNED_KEY) {
        if (e.department_id !== deptFilter) return false;
      }
      if (!needle) return true;
      return [e.full_name, e.email, e.role_title, e.department]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(needle));
    });
  }, [employees, q, deptFilter, showInactive]);

  // While dragging we want every department to render — even empty ones —
  // so users can drop into a currently-empty department or the Unassigned
  // bucket. When not dragging, only sections with people are shown.
  const sections = useMemo(() => {
    const map = new Map<string, DbEmployee[]>();
    for (const e of filtered) {
      const key = e.department_id ?? UNASSIGNED_KEY;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    const isDragging = activeId !== null;
    const ordered: { id: string; name: string; people: DbEmployee[] }[] = [];
    for (const d of departments) {
      const people = map.get(d.id) ?? [];
      if (people.length > 0 || isDragging) {
        ordered.push({ id: d.id, name: d.name, people });
      }
    }
    const unassigned = map.get(UNASSIGNED_KEY) ?? [];
    if (unassigned.length > 0 || isDragging) {
      ordered.push({ id: UNASSIGNED_KEY, name: "Unassigned", people: unassigned });
    }
    return ordered;
  }, [filtered, departments, activeId]);

  const totalCount = filtered.length;

  const activeEmployee = activeId
    ? employees.find((e) => e.id === activeId) ?? null
    : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const empId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    // The droppable id is either a department id, the Unassigned key, or
    // another employee card id (when hovering over an existing card).
    let targetDeptId: string | null | undefined;
    if (overId === UNASSIGNED_KEY) {
      targetDeptId = null;
    } else if (departments.some((d) => d.id === overId)) {
      targetDeptId = overId;
    } else {
      const overEmp = employees.find((emp) => emp.id === overId);
      if (overEmp) targetDeptId = overEmp.department_id ?? null;
    }
    if (targetDeptId === undefined) return;

    const emp = employees.find((x) => x.id === empId);
    if (!emp) return;
    if ((emp.department_id ?? null) === (targetDeptId ?? null)) return;

    const prevDeptId = emp.department_id;
    const prevDeptName = emp.department;
    const nextDeptName =
      targetDeptId === null
        ? null
        : departmentNameById.get(targetDeptId) ?? null;

    // Optimistic update.
    setEmployees((curr) =>
      curr.map((x) =>
        x.id === empId
          ? { ...x, department_id: targetDeptId ?? null, department: nextDeptName }
          : x,
      ),
    );

    void (async () => {
      const result = await setEmployeeDepartment(empId, targetDeptId ?? null);
      if (!result.ok) {
        // Revert on failure.
        setEmployees((curr) =>
          curr.map((x) =>
            x.id === empId
              ? { ...x, department_id: prevDeptId, department: prevDeptName }
              : x,
          ),
        );
        toast.error(result.error || "Failed to move person");
        return;
      }
      toast.success(
        `Moved ${emp.full_name} to ${
          targetDeptId === null ? "Unassigned" : nextDeptName ?? "department"
        }`,
      );
      // Refresh the access lists / dept counts on related pages.
      router.refresh();
    })();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people by name, email, role, or department…"
            className="pl-9"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-2 text-[13px] focus:outline-none focus:shadow-ring"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
          <option value={UNASSIGNED_KEY}>Unassigned</option>
        </select>
        <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Show inactive
        </label>
        <Button variant="primary" onClick={() => setNewOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add person
        </Button>
      </div>

      <div className="text-[12px] text-muted-foreground">
        {totalCount} {totalCount === 1 ? "person" : "people"}
        <span className="ml-3 hidden sm:inline">
          Tip: drag a person card to a different department to reassign them.
        </span>
      </div>

      {employees.length === 0 ? (
        <EmptyState onAdd={() => setNewOpen(true)} />
      ) : sections.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface-alt/30 py-10 text-center text-sm text-muted-foreground">
          No people match your filters.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex flex-col gap-5">
            {sections.map((g) => (
              <DepartmentSection
                key={g.id}
                deptId={g.id}
                title={g.name}
                people={g.people}
                departmentNameById={departmentNameById}
                activeId={activeId}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeEmployee ? (
              <EmployeeTileCard
                employee={activeEmployee}
                departmentName={
                  activeEmployee.department_id
                    ? departmentNameById.get(activeEmployee.department_id) ?? null
                    : null
                }
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <EmployeeEditor
        open={newOpen}
        onOpenChange={setNewOpen}
        departments={departments}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Department section (droppable container)
// ---------------------------------------------------------------------------

function DepartmentSection({
  deptId,
  title,
  people,
  departmentNameById,
  activeId,
}: {
  deptId: string;
  title: string;
  people: DbEmployee[];
  departmentNameById: Map<string, string>;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: deptId });
  const dragging = activeId !== null;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
        <span className="text-[12px] text-muted-foreground">{people.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={
          "rounded-card border p-2 transition-colors " +
          (isOver
            ? "border-haven-coral-600 bg-accent-soft/40 ring-2 ring-haven-coral-600/30"
            : dragging
              ? "border-dashed border-border bg-surface-alt/20"
              : "border-transparent")
        }
      >
        {people.length === 0 ? (
          <div
            className={
              "py-6 text-center text-[12px] rounded-md border border-dashed " +
              (isOver
                ? "text-haven-coral-700 border-haven-coral-300 bg-accent-soft/40"
                : "text-muted-foreground border-border")
            }
          >
            {isOver ? "Drop here" : dragging ? "Drop here to assign" : "No one yet"}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {people.map((e) => (
              <DraggableEmployeeTile
                key={e.id}
                employee={e}
                departmentName={
                  e.department_id ? departmentNameById.get(e.department_id) ?? null : null
                }
                isOverlayActive={activeId === e.id}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Employee tile — draggable wrapper + visual card
// ---------------------------------------------------------------------------

function DraggableEmployeeTile({
  employee,
  departmentName,
  isOverlayActive,
}: {
  employee: DbEmployee;
  departmentName: string | null;
  isOverlayActive: boolean;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: employee.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => router.push(`/hr/people/${employee.id}` as never)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          router.push(`/hr/people/${employee.id}` as never);
        }
      }}
      role="button"
      tabIndex={0}
      style={{ opacity: isDragging || isOverlayActive ? 0.4 : 1 }}
      className="touch-none cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:shadow-ring rounded-card"
    >
      <EmployeeTileCard employee={employee} departmentName={departmentName} />
    </div>
  );
}

function EmployeeTileCard({
  employee,
  departmentName,
  isDragging,
}: {
  employee: DbEmployee;
  departmentName: string | null;
  isDragging?: boolean;
}) {
  const initials = employee.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const deptLabel = departmentName ?? employee.department ?? null;

  return (
    <div
      className={
        "haven-card haven-card-hover group relative flex flex-col gap-3 p-4 " +
        (isDragging ? "rotate-1 shadow-card-hover ring-1 ring-haven-coral-300" : "")
      }
    >
      <GripVertical className="pointer-events-none absolute left-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-heading text-[13px] font-bold text-haven-coral-700 dark:text-haven-coral">
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold">{employee.full_name}</div>
          <div className="truncate text-[12px] text-muted-foreground">
            {employee.role_title || "—"}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {deptLabel ? (
          <Badge tone="neutral" className="text-[10px]">
            {deptLabel}
          </Badge>
        ) : null}
        {employee.status !== "active" ? (
          <Badge tone="neutral" className="text-[10px] capitalize">
            {employee.status}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface-alt/30 py-12 text-center">
      <Users className="h-8 w-8 text-muted-foreground" />
      <div>
        <div className="font-heading text-[15px] font-bold">No people yet</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first team member to start tracking reviews and issues.
        </p>
      </div>
      <Button variant="primary" onClick={onAdd}>
        <UserPlus className="h-4 w-4" />
        Add person
      </Button>
    </div>
  );
}
