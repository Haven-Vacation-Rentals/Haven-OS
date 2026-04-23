"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IssueEditor } from "./issue-editor";
import { deleteIssue } from "@/lib/hr/actions";
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_SEVERITY_LABELS,
  ISSUE_STATUS_LABELS,
  type DbHrIssue,
  type IssueCategory,
  type IssueSeverity,
  type IssueStatus,
} from "@/lib/hr/types";

const SEVERITY_TONE: Record<IssueSeverity, "sage" | "warn" | "danger"> = {
  low: "sage",
  medium: "warn",
  high: "danger",
};

const STATUS_TONE: Record<IssueStatus, "danger" | "warn" | "success"> = {
  open: "danger",
  in_progress: "warn",
  resolved: "success",
};

export function IssueCard({
  issue,
  employeeId,
}: {
  issue: DbHrIssue;
  employeeId: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!confirm("Delete this issue?")) return;
    startTransition(async () => {
      try {
        await deleteIssue(issue.id, employeeId);
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const severityTone = SEVERITY_TONE[issue.severity as IssueSeverity] ?? "sage";
  const statusTone = STATUS_TONE[issue.status as IssueStatus] ?? "sage";
  const categoryLabel = ISSUE_CATEGORY_LABELS[issue.category as IssueCategory] ?? issue.category;

  return (
    <div className="haven-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-heading text-[14px] font-bold">{issue.title}</div>
            <Badge tone={statusTone} className="text-[10px]">
              {ISSUE_STATUS_LABELS[issue.status as IssueStatus] ?? issue.status}
            </Badge>
            <Badge tone={severityTone} className="text-[10px]">
              {ISSUE_SEVERITY_LABELS[issue.severity as IssueSeverity] ?? issue.severity} severity
            </Badge>
            <Badge tone="neutral" className="text-[10px]">
              {categoryLabel}
            </Badge>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Reported {formatDate(issue.reported_date)}
            {issue.reported_by ? ` by ${issue.reported_by}` : ""}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={remove} disabled={pending}>
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          </Button>
        </div>
      </div>

      {issue.description && (
        <div className="mt-3 text-[13px] leading-relaxed text-foreground/90">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </div>
          <p className="whitespace-pre-wrap">{issue.description}</p>
        </div>
      )}

      {issue.resolution && (
        <div className="mt-3 text-[13px] leading-relaxed text-foreground/90">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Resolution
          </div>
          <p className="whitespace-pre-wrap">{issue.resolution}</p>
        </div>
      )}

      <IssueEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        employeeId={employeeId}
        issue={issue}
      />
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
