"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { UserPlus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeEditor } from "./employee-editor";
import type { DbEmployee } from "@/lib/hr/types";

type Props = { employees: DbEmployee[] };

export function PeopleDirectory({ employees }: Props) {
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [, startTransition] = useTransition();
  void startTransition;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter((e) =>
      [e.full_name, e.email, e.role_title, e.department]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(needle)),
    );
  }, [employees, q]);

  const active = filtered.filter((e) => e.status === "active");
  const inactive = filtered.filter((e) => e.status !== "active");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people by name, email, role, or department…"
            className="pl-9"
          />
        </div>
        <Button variant="primary" onClick={() => setNewOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add person
        </Button>
      </div>

      {employees.length === 0 ? (
        <EmptyState onAdd={() => setNewOpen(true)} />
      ) : (
        <>
          <Section title="Active" count={active.length}>
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active people match your search.</p>
            ) : (
              <Grid employees={active} />
            )}
          </Section>
          {inactive.length > 0 && (
            <Section title="Inactive" count={inactive.length} dimmed>
              <Grid employees={inactive} />
            </Section>
          )}
        </>
      )}

      <EmployeeEditor open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function Section({
  title,
  count,
  children,
  dimmed,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  dimmed?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className={`font-heading text-base font-bold ${dimmed ? "text-muted-foreground" : "text-foreground"}`}>
          {title}
        </h2>
        <span className="text-[12px] text-muted-foreground">{count}</span>
      </div>
      {children}
    </section>
  );
}

function Grid({ employees }: { employees: DbEmployee[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {employees.map((e) => (
        <EmployeeTile key={e.id} employee={e} />
      ))}
    </div>
  );
}

function EmployeeTile({ employee }: { employee: DbEmployee }) {
  const initials = employee.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

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
        {employee.department ? (
          <Badge tone="neutral" className="text-[10px]">
            {employee.department}
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
