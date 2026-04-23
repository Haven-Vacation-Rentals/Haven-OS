"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createIssue, updateIssue } from "@/lib/hr/actions";
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABELS,
  ISSUE_SEVERITIES,
  ISSUE_SEVERITY_LABELS,
  ISSUE_STATUSES,
  ISSUE_STATUS_LABELS,
  type DbHrIssue,
} from "@/lib/hr/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: string;
  issue?: DbHrIssue | null;
};

export function IssueEditor({ open, onOpenChange, employeeId, issue }: Props) {
  const editing = !!issue;
  const [title, setTitle] = useState(issue?.title ?? "");
  const [description, setDescription] = useState(issue?.description ?? "");
  const [category, setCategory] = useState(issue?.category ?? "other");
  const [severity, setSeverity] = useState(issue?.severity ?? "low");
  const [status, setStatus] = useState(issue?.status ?? "open");
  const [resolution, setResolution] = useState(issue?.resolution ?? "");
  const [reportedDate, setReportedDate] = useState(
    issue?.reported_date ?? new Date().toISOString().slice(0, 10),
  );
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
        if (editing && issue) {
          await updateIssue(
            issue.id,
            { title, description, category, severity, status, resolution, reported_date: reportedDate },
            employeeId,
          );
        } else {
          await createIssue({
            employee_id: employeeId,
            title,
            description,
            category,
            severity,
            status,
            reported_date: reportedDate,
          });
        }
        onOpenChange(false);
        if (!editing) {
          setTitle("");
          setDescription("");
          setCategory("other");
          setSeverity("low");
          setStatus("open");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit issue" : "Log issue"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Date</label>
            <Input type="date" value={reportedDate} onChange={(e) => setReportedDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm focus:outline-none focus:shadow-ring"
            >
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ISSUE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm focus:outline-none focus:shadow-ring"
            >
              {ISSUE_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {ISSUE_SEVERITY_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm focus:outline-none focus:shadow-ring"
            >
              {ISSUE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ISSUE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="What happened? Who was involved? Dates and context…"
              className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
            />
          </div>
          {(status === "resolved" || editing) && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Resolution</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                placeholder="How was it resolved?"
                className="w-full rounded-md border border-border bg-surface p-3 text-[13px] leading-relaxed focus:outline-none focus:shadow-ring"
              />
            </div>
          )}
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
            {pending ? "Saving…" : editing ? "Save changes" : "Log issue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
