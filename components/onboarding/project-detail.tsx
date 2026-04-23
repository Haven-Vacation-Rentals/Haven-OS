"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Calendar,
  Mail,
  Phone,
  Folder,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ONBOARDING_TASK_STATUSES,
  ONBOARDING_DEPARTMENTS,
  TASK_STATUS_LABELS,
  DEPARTMENT_LABELS,
  PROJECT_STATUS_LABELS,
  type OnboardingProjectTree,
  type OnboardingTaskNode,
  type OnboardingTaskStatus,
  type OnboardingDepartment,
  type DbOnboardingChecklistItem,
} from "@/lib/onboarding/types";
import {
  PROJECT_STATUS_TONE,
  TASK_STATUS_TONE,
  DEPARTMENT_TONE,
  formatDate,
} from "@/lib/onboarding/utils";
import {
  updateTaskStatus,
  toggleChecklistItem,
  addAdHocTask,
  deleteTask,
  addChecklistItem,
  deleteChecklistItem,
  updateTask,
} from "@/lib/onboarding/actions";

type Props = { tree: OnboardingProjectTree };

export function ProjectDetail({ tree }: Props) {
  const { project, tasks, totals } = tree;

  // Flatten tasks for department/kanban views
  const flat = useMemo(() => flattenTasks(tasks), [tasks]);
  const keyDates = flat.filter((t) => t.is_key_date);

  return (
    <div className="flex flex-col gap-5">
      {/* Back link */}
      <Link
        href={"/onboarding" as never}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All projects
      </Link>

      {/* Summary header */}
      <div className="haven-card rounded-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-heading text-2xl font-bold">
                {project.property_nickname}
              </h2>
              <Badge tone={PROJECT_STATUS_TONE[project.status]} dot>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-muted-foreground">
              {project.owner_name ? (
                <MetaItem icon={<Sparkles className="h-3.5 w-3.5" />} label={project.owner_name} />
              ) : null}
              {project.owner_email ? (
                <MetaItem icon={<Mail className="h-3.5 w-3.5" />} label={project.owner_email} />
              ) : null}
              {project.owner_phone ? (
                <MetaItem icon={<Phone className="h-3.5 w-3.5" />} label={project.owner_phone} />
              ) : null}
              {project.slack_channel ? (
                <MetaItem
                  icon={<MessageSquare className="h-3.5 w-3.5" />}
                  label={project.slack_channel}
                />
              ) : null}
              {project.start_date ? (
                <MetaItem
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label={`Start: ${formatDate(project.start_date)}`}
                />
              ) : null}
              {project.target_open_date ? (
                <MetaItem
                  icon={<Star className="h-3.5 w-3.5" />}
                  label={`Target open: ${formatDate(project.target_open_date)}`}
                />
              ) : null}
              {project.owner_profile_folder_url ? (
                <MetaItem
                  icon={<Folder className="h-3.5 w-3.5" />}
                  label={
                    <a
                      href={project.owner_profile_folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      Owner Profile folder
                    </a>
                  }
                />
              ) : null}
            </div>
          </div>
          <ProgressRing percent={totals.percentComplete} />
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatTile label="Total" value={totals.total} />
          <StatTile label="Done" value={totals.done} tone="success" />
          <StatTile label="In Progress" value={totals.inProgress} tone="warn" />
          <StatTile label="Blocked" value={totals.blocked} tone="danger" />
          <StatTile label="Not Started" value={totals.notStarted} />
          <StatTile
            label="Key Dates"
            value={`${totals.keyDatesDone}/${totals.keyDatesTotal}`}
            tone="coral"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="checklist" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="key-dates">Key Dates</TabsTrigger>
          <TabsTrigger value="by-dept">By Department</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <ChecklistView projectId={project.id} tasks={tasks} />
        </TabsContent>

        <TabsContent value="key-dates">
          <KeyDatesView tasks={keyDates} />
        </TabsContent>

        <TabsContent value="by-dept">
          <ByDeptView tasks={flat} />
        </TabsContent>

        <TabsContent value="kanban">
          <KanbanView tasks={flat} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function flattenTasks(nodes: OnboardingTaskNode[]): OnboardingTaskNode[] {
  const out: OnboardingTaskNode[] = [];
  const walk = (arr: OnboardingTaskNode[]) => {
    for (const n of arr) {
      out.push(n);
      if (n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

function MetaItem({ icon, label }: { icon: React.ReactNode; label: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const R = 32;
  const C = 2 * Math.PI * R;
  const offset = C - (percent / 100) * C;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={R} strokeWidth="6" className="stroke-surface-alt" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={R}
          strokeWidth="6"
          className="stroke-accent"
          fill="none"
          strokeDasharray={C}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-heading text-lg font-bold">{percent}%</span>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "success" | "warn" | "danger" | "coral";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warn"
      ? "text-amber-700"
      : tone === "danger"
      ? "text-rose-700"
      : tone === "coral"
      ? "text-haven-coral-700"
      : "text-foreground";
  return (
    <div className="rounded-card border border-border bg-surface-alt/40 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-heading text-xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checklist (nested tree) view
// ---------------------------------------------------------------------------

function ChecklistView({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: OnboardingTaskNode[];
}) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const addTop = () => {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      try {
        await addAdHocTask({ project_id: projectId, title: newTitle });
        toast.success("Task added");
        setNewTitle("");
        setAdding(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <TaskRow key={t.id} node={t} projectId={projectId} />
      ))}

      {adding ? (
        <div className="haven-card rounded-card p-3 flex gap-2">
          <Input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New top-level task title"
            onKeyDown={(e) => {
              if (e.key === "Enter") addTop();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <Button variant="primary" onClick={addTop} disabled={pending || !newTitle.trim()}>
            Add
          </Button>
          <Button variant="outline" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-card border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors w-fit"
        >
          <Plus className="h-4 w-4" />
          Add top-level task
        </button>
      )}
    </div>
  );
}

function TaskRow({
  node,
  projectId,
}: {
  node: OnboardingTaskNode;
  projectId: string;
}) {
  const [open, setOpen] = useState(node.depth === 0);
  const [pending, startTransition] = useTransition();
  const hasChildren = node.children.length > 0;
  const hasChecklist = node.checklist.length > 0;

  const onStatus = (status: OnboardingTaskStatus) => {
    startTransition(async () => {
      try {
        await updateTaskStatus(node.id, status);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  };

  const onDelete = () => {
    if (!confirm(`Delete "${node.title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteTask(node.id);
        toast.success("Task deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  const bg =
    node.depth === 0
      ? "bg-surface"
      : node.depth === 1
      ? "bg-surface-alt/30"
      : "bg-transparent";

  return (
    <div
      className={`rounded-card border border-border ${bg}`}
      style={{ marginLeft: node.depth * 12 }}
    >
      <div className="flex items-center gap-2 p-3">
        {hasChildren || hasChecklist ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 h-5 w-5 inline-flex items-center justify-center rounded hover:bg-surface-alt"
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
          {node.is_key_date ? (
            <Star className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
          ) : null}
          <span
            className={`truncate ${
              node.depth === 0 ? "font-semibold text-[14px]" : "text-[13px]"
            } ${node.status === "done" ? "line-through text-muted-foreground" : ""}`}
          >
            {node.title}
          </span>
          {node.department ? (
            <Badge tone={DEPARTMENT_TONE[node.department]} className="text-[10px] px-2 py-0">
              {DEPARTMENT_LABELS[node.department]}
            </Badge>
          ) : null}
          {node.due_date ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(node.due_date)}
            </span>
          ) : null}
        </div>

        <StatusSelect
          value={node.status}
          onChange={onStatus}
          disabled={pending}
        />

        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-rose-700 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (hasChildren || hasChecklist) ? (
        <div className="border-t border-border/50 p-2 flex flex-col gap-1">
          {node.description ? (
            <p className="px-2 py-1 text-xs text-muted-foreground whitespace-pre-wrap">
              {node.description.length > 300
                ? node.description.slice(0, 300) + "…"
                : node.description}
            </p>
          ) : null}
          {hasChecklist ? (
            <ChecklistItems items={node.checklist} taskId={node.id} />
          ) : null}
          {node.children.map((c) => (
            <TaskRow key={c.id} node={c} projectId={projectId} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: OnboardingTaskStatus;
  onChange: (v: OnboardingTaskStatus) => void;
  disabled?: boolean;
}) {
  const toneClass =
    value === "done"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : value === "in_progress"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : value === "blocked"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : value === "na"
      ? "bg-haven-sage text-foreground/70 border-haven-sage"
      : "bg-surface-alt text-foreground/70 border-border";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as OnboardingTaskStatus)}
      disabled={disabled}
      className={`shrink-0 text-[11px] font-semibold rounded-pill border px-2.5 py-1 ${toneClass} focus-visible:outline-none focus-visible:shadow-ring`}
    >
      {ONBOARDING_TASK_STATUSES.map((s) => (
        <option key={s} value={s}>
          {TASK_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

function ChecklistItems({
  items,
  taskId,
}: {
  items: DbOnboardingChecklistItem[];
  taskId: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [pending, startTransition] = useTransition();

  const onToggle = (item: DbOnboardingChecklistItem) => {
    startTransition(async () => {
      try {
        await toggleChecklistItem(item.id, !item.is_checked);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const onAdd = () => {
    if (!newLabel.trim()) return;
    startTransition(async () => {
      try {
        await addChecklistItem(taskId, newLabel);
        setNewLabel("");
        setAdding(false);
        toast.success("Item added");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const onDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteChecklistItem(id);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  return (
    <div className="flex flex-col gap-0.5 px-2">
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-alt/50 group"
        >
          <input
            type="checkbox"
            checked={it.is_checked}
            onChange={() => onToggle(it)}
            disabled={pending}
            className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-0"
          />
          <span
            className={`text-[12px] flex-1 ${
              it.is_checked ? "line-through text-muted-foreground" : ""
            }`}
          >
            {it.label}
          </span>
          <button
            type="button"
            onClick={() => onDelete(it.id)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-700"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      {adding ? (
        <div className="flex gap-1.5 px-2 py-1">
          <Input
            autoFocus
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="New checklist item"
            className="h-7 text-[12px]"
          />
          <Button size="sm" variant="primary" onClick={onAdd} disabled={pending}>
            Add
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground w-fit"
        >
          <Plus className="h-3 w-3" />
          Add item
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Key Dates view
// ---------------------------------------------------------------------------

function KeyDatesView({ tasks }: { tasks: OnboardingTaskNode[] }) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border bg-surface-alt/50 p-8 text-sm text-muted-foreground text-center">
        No key date milestones yet.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {tasks.map((t) => (
        <KeyDateRow key={t.id} task={t} />
      ))}
    </div>
  );
}

function KeyDateRow({ task }: { task: OnboardingTaskNode }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");

  const saveDate = () => {
    startTransition(async () => {
      try {
        await updateTask(task.id, { due_date: dueDate || null });
        toast.success("Date saved");
        setEditing(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  return (
    <div className="haven-card rounded-card p-3 flex items-center gap-3 flex-wrap">
      <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
      <span className="flex-1 min-w-0 font-medium text-[14px]">{task.title}</span>
      {task.department ? (
        <Badge tone={DEPARTMENT_TONE[task.department]}>
          {DEPARTMENT_LABELS[task.department]}
        </Badge>
      ) : null}
      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-8 w-[150px]"
          />
          <Button size="sm" variant="primary" onClick={saveDate} disabled={pending}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-surface-alt"
        >
          <Calendar className="h-3 w-3" />
          {task.due_date ? formatDate(task.due_date) : "Set date"}
        </button>
      )}
      <Badge tone={TASK_STATUS_TONE[task.status]} dot>
        {TASK_STATUS_LABELS[task.status]}
      </Badge>
    </div>
  );
}

// ---------------------------------------------------------------------------
// By Department view
// ---------------------------------------------------------------------------

function ByDeptView({ tasks }: { tasks: OnboardingTaskNode[] }) {
  const byDept = new Map<OnboardingDepartment | "unassigned", OnboardingTaskNode[]>();
  for (const t of tasks) {
    const k = (t.department ?? "unassigned") as OnboardingDepartment | "unassigned";
    const arr = byDept.get(k) ?? [];
    arr.push(t);
    byDept.set(k, arr);
  }
  const order: (OnboardingDepartment | "unassigned")[] = [
    ...ONBOARDING_DEPARTMENTS,
    "unassigned",
  ];
  return (
    <div className="flex flex-col gap-4">
      {order.map((d) => {
        const items = byDept.get(d);
        if (!items || items.length === 0) return null;
        const label =
          d === "unassigned" ? "Unassigned" : DEPARTMENT_LABELS[d as OnboardingDepartment];
        const tone = d === "unassigned" ? "neutral" : DEPARTMENT_TONE[d as OnboardingDepartment];
        return (
          <div key={d} className="haven-card rounded-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge tone={tone}>{label}</Badge>
              <span className="text-xs text-muted-foreground">{items.length} tasks</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {items.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 text-[13px] py-1"
                >
                  {t.is_key_date ? (
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span
                    className={`flex-1 min-w-0 truncate ${
                      t.status === "done" ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {t.title}
                  </span>
                  <Badge tone={TASK_STATUS_TONE[t.status]}>
                    {TASK_STATUS_LABELS[t.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban
// ---------------------------------------------------------------------------

function KanbanView({ tasks }: { tasks: OnboardingTaskNode[] }) {
  const cols: OnboardingTaskStatus[] = ["not_started", "in_progress", "blocked", "done"];
  const groups = new Map<OnboardingTaskStatus, OnboardingTaskNode[]>();
  for (const c of cols) groups.set(c, []);
  for (const t of tasks) {
    if (t.status === "na") continue;
    groups.get(t.status)?.push(t);
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cols.map((c) => {
        const items = groups.get(c) ?? [];
        return (
          <div key={c} className="rounded-card border border-border bg-surface-alt/30 p-3">
            <div className="flex items-center justify-between mb-3">
              <Badge tone={TASK_STATUS_TONE[c]}>{TASK_STATUS_LABELS[c]}</Badge>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
              {items.map((t) => (
                <KanbanCard key={t.id} task={t} />
              ))}
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No tasks</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ task }: { task: OnboardingTaskNode }) {
  return (
    <div className="rounded-card bg-surface p-3 shadow-sm border border-border">
      <div className="flex items-start gap-2">
        {task.is_key_date ? (
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
        ) : null}
        <p className="text-[13px] leading-snug flex-1">{task.title}</p>
      </div>
      {task.department ? (
        <div className="mt-2">
          <Badge tone={DEPARTMENT_TONE[task.department]} className="text-[10px] px-2 py-0">
            {DEPARTMENT_LABELS[task.department]}
          </Badge>
        </div>
      ) : null}
    </div>
  );
}
