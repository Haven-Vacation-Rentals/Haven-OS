"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeEditor } from "./employee-editor";
import { ReviewEditor } from "./review-editor";
import { IssueEditor } from "./issue-editor";
import { ReviewCard } from "./review-card";
import { IssueCard } from "./issue-card";
import { EmployeeAccessManager } from "./employee-access-manager";
import { deleteEmployee, type EmployeeAccessEntry } from "@/lib/hr/actions";
import type { AdminUser, Department } from "@/lib/admin/actions";
import { useRouter } from "next/navigation";
import type {
  DbEmployee,
  DbPerformanceReview,
  DbHrIssue,
} from "@/lib/hr/types";

type LinkableProfile = { id: string; email: string; full_name: string | null };

type Props = {
  employee: DbEmployee;
  reviews: DbPerformanceReview[];
  issues: DbHrIssue[];
  departments: Department[];
  access: EmployeeAccessEntry[];
  profiles: LinkableProfile[];
  users: AdminUser[];
  canManageAccess: boolean;
};

export function EmployeeDetail({
  employee,
  reviews,
  issues,
  departments,
  access,
  profiles,
  users,
  canManageAccess,
}: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!confirm(`Delete ${employee.full_name}? This removes all their reviews and issues and cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteEmployee(employee.id);
        router.push("/hr");
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const initials = employee.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const openIssues = issues.filter((i) => i.status !== "resolved").length;

  const departmentName = employee.department_id
    ? departments.find((d) => d.id === employee.department_id)?.name ?? null
    : employee.department;

  const linkedProfile = employee.profile_id
    ? profiles.find((p) => p.id === employee.profile_id)
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Header card */}
      <div className="haven-card flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft font-heading text-[16px] font-bold text-haven-coral-700 dark:text-haven-coral">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-[20px] font-bold">{employee.full_name}</h2>
              {employee.status !== "active" && (
                <Badge tone="neutral" className="capitalize">
                  {employee.status}
                </Badge>
              )}
            </div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              {[employee.role_title, departmentName].filter(Boolean).join(" · ") || "—"}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
              {employee.email && <span>{employee.email}</span>}
              {employee.start_date && <span>Started {formatDate(employee.start_date)}</span>}
              {linkedProfile && (
                <span className="inline-flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  Linked to {linkedProfile.full_name ?? linkedProfile.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={remove} disabled={pending}>
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          </Button>
        </div>
      </div>

      {employee.notes && (
        <div className="haven-card p-4 text-[13px] leading-relaxed text-foreground/90">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </div>
          <div className="whitespace-pre-wrap">{employee.notes}</div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList>
          <TabsTrigger value="reviews">
            Performance reviews
            <span className="ml-1.5 text-[11px] text-muted-foreground">{reviews.length}</span>
          </TabsTrigger>
          <TabsTrigger value="issues">
            Issues
            {openIssues > 0 && (
              <Badge tone="danger" className="ml-1.5 h-4 px-1.5 text-[10px]">
                {openIssues} open
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="access">
            Access
            <span className="ml-1.5 text-[11px] text-muted-foreground">{access.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4 flex flex-col gap-3">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setReviewOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Log review
            </Button>
          </div>
          {reviews.length === 0 ? (
            <p className="rounded-card border border-dashed border-border bg-surface-alt/30 py-8 text-center text-sm text-muted-foreground">
              No performance reviews logged yet.
            </p>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} employeeId={employee.id} />)
          )}
        </TabsContent>

        <TabsContent value="issues" className="mt-4 flex flex-col gap-3">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIssueOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Log issue
            </Button>
          </div>
          {issues.length === 0 ? (
            <p className="rounded-card border border-dashed border-border bg-surface-alt/30 py-8 text-center text-sm text-muted-foreground">
              No issues logged for {employee.full_name.split(" ")[0]}.
            </p>
          ) : (
            issues.map((i) => <IssueCard key={i.id} issue={i} employeeId={employee.id} />)
          )}
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <EmployeeAccessManager
            employeeId={employee.id}
            employeeName={employee.full_name}
            initialAccess={access}
            users={users}
            canManage={canManageAccess}
          />
        </TabsContent>
      </Tabs>

      <EmployeeEditor
        open={editOpen}
        onOpenChange={setEditOpen}
        employee={employee}
        departments={departments}
        profiles={profiles}
      />
      <ReviewEditor
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        employeeId={employee.id}
      />
      <IssueEditor
        open={issueOpen}
        onOpenChange={setIssueOpen}
        employeeId={employee.id}
      />
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
