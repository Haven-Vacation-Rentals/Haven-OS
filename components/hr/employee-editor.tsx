"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createEmployee, updateEmployee } from "@/lib/hr/actions";
import { EMPLOYEE_STATUSES, type DbEmployee } from "@/lib/hr/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employee?: DbEmployee | null;
};

export function EmployeeEditor({ open, onOpenChange, employee }: Props) {
  const editing = !!employee;
  const [fullName, setFullName] = useState(employee?.full_name ?? "");
  const [email, setEmail] = useState(employee?.email ?? "");
  const [roleTitle, setRoleTitle] = useState(employee?.role_title ?? "");
  const [department, setDepartment] = useState(employee?.department ?? "");
  const [startDate, setStartDate] = useState(employee?.start_date ?? "");
  const [status, setStatus] = useState(employee?.status ?? "active");
  const [notes, setNotes] = useState(employee?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setFullName("");
    setEmail("");
    setRoleTitle("");
    setDepartment("");
    setStartDate("");
    setStatus("active");
    setNotes("");
    setError(null);
  };

  const save = () => {
    setError(null);
    if (!fullName.trim()) {
      setError("Name is required");
      return;
    }
    startTransition(async () => {
      try {
        if (editing && employee) {
          await updateEmployee(employee.id, {
            full_name: fullName,
            email: email || null,
            role_title: roleTitle || null,
            department: department || null,
            start_date: startDate || null,
            status,
            notes,
          });
        } else {
          await createEmployee({
            full_name: fullName,
            email: email || undefined,
            role_title: roleTitle || undefined,
            department: department || undefined,
            start_date: startDate || undefined,
            status,
            notes,
          });
          reset();
        }
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit person" : "Add person"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Role">
            <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Operations Manager" />
          </Field>
          <Field label="Department">
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Operations" />
          </Field>
          <Field label="Start date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm focus:outline-none focus:shadow-ring"
            >
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
              />
            </Field>
          </div>
        </div>
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Add person"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
