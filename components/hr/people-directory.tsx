"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UserPlus, Search, Users, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeEditor } from "./employee-editor";
import type { DbEmployee } from "@/lib/hr/types";
import type { Department } from "@/lib/admin/actions";

type Props = {
  employees: DbEmployee[];
  departments: Department[];
};

const UNASSIGNED_KEY = "__unassigned__";

export function PeopleDirectory({ employees, departments }: Props) {
  const [q, setQ] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

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

  const grouped = useMemo(() => {
    const map = new Map<string, DbEmployee[]>();
    for (const e of filtered) {
      const key = e.department_id ?? UNASSIGNED_KEY;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    // Sort according to departments.sort_order, with unassigned last.
    const ordered: { id: string; name: string; people: DbEmployee[] }[] = [];
    for (const d of departments) {
      const list = map.get(d.id);
      if (list && list.length > 0) ordered.push({ id: d.id, name: d.name, people: list });
    }
    const unassigned = map.get(UNASSIGNED_KEY);
    if (unassigned && unassigned.length > 0) {
      ordered.push({ id: UNASSIGNED_KEY, name: "Unassigned", people: unassigned });
    }
    return ordered;
  }, [filtered, departments]);

  const totalCount = filtered.length;

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
      </div>

      {employees.length === 0 ? (
        <EmptyState onAdd={() => setNewOpen(true)} />
      ) : grouped.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface-alt/30 py-10 text-center text-sm text-muted-foreground">
          No people match your filters.
        </p>
      ) : (
        grouped.map((g) => (
          <Section
            key={g.id}
            title={g.name}
            count={g.people.length}
          >
            <Grid employees={g.people} departmentNameById={departmentNameById} />
          </Section>
        ))
      )}

      <EmployeeEditor
        open={newOpen}
        onOpenChange={setNewOpen}
        departments={departments}
      />
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
        <span className="text-[12px] text-muted-foreground">{count}</span>
      </div>
      {children}
    </section>
  );
}

function Grid({
  employees,
  departmentNameById,
}: {
  employees: DbEmployee[];
  departmentNameById: Map<string, string>;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {employees.map((e) => (
        <EmployeeTile
          key={e.id}
          employee={e}
          departmentName={
            e.department_id ? departmentNameById.get(e.department_id) ?? null : null
          }
        />
      ))}
    </div>
  );
}

function EmployeeTile({
  employee,
  departmentName,
}: {
  employee: DbEmployee;
  departmentName: string | null;
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
    <Link
      href={`/hr/people/${employee.id}` as never}
      className="haven-card haven-card-hover flex flex-col gap-3 p-4"
    >
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
    </Link>
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
