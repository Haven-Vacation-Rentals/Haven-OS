"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRole, updateRole } from "@/lib/hr/actions";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  ROLE_STATUSES,
  ROLE_STATUS_LABELS,
  type DbRole,
} from "@/lib/hr/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role?: DbRole | null;
};

export function RoleEditor({ open, onOpenChange, role }: Props) {
  const router = useRouter();
  const editing = !!role;
  const [title, setTitle] = useState(role?.title ?? "");
  const [department, setDepartment] = useState(role?.department ?? "");
  const [location, setLocation] = useState(role?.location ?? "");
  const [employmentType, setEmploymentType] = useState(role?.employment_type ?? "full_time");
  const [description, setDescription] = useState(role?.description ?? "");
  const [responsibilities, setResponsibilities] = useState(role?.responsibilities ?? "");
  const [perks, setPerks] = useState(role?.perks ?? "");
  const [status, setStatus] = useState(role?.status ?? "draft");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    startTransition(async () => {
      try {
        if (editing && role) {
          await updateRole(role.id, {
            title,
            department: department || null,
            location: location || null,
            employment_type: employmentType || null,
            description,
            responsibilities,
            perks,
            status,
          });
          onOpenChange(false);
        } else {
          const created = await createRole({
            title,
            department: department || undefined,
            location: location || undefined,
            employment_type: employmentType || undefined,
            description,
            responsibilities,
            perks,
            status,
          });
          onOpenChange(false);
          router.push(`/hr/hiring/${created.id}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit role" : "Create role"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Guest Experience Specialist" />
            </Field>
          </div>
          <Field label="Department">
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Guest Experience" />
          </Field>
          <Field label="Location">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pigeon Forge, TN" />
          </Field>
          <Field label="Employment type">
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm focus:outline-none focus:shadow-ring"
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EMPLOYMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm focus:outline-none focus:shadow-ring"
            >
              {ROLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ROLE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="About the role">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="What is this role? What does success look like?"
                className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Markdown supported — same as announcements.
              </p>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Responsibilities">
              <textarea
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                rows={4}
                placeholder="- Lead weekly guest outreach&#10;- Coordinate with cleaning crews…"
                className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Perks & benefits">
              <textarea
                value={perks}
                onChange={(e) => setPerks(e.target.value)}
                rows={3}
                placeholder="- Health insurance&#10;- PTO…"
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
            {pending ? "Saving…" : editing ? "Save changes" : "Create role"}
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
