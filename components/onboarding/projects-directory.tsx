"use client";

/**
 * ProjectsDirectory — the overhauled landing page for /onboarding.
 *
 * Sections (top to bottom):
 *  1. Summary bar: Active · Target open ≤14 days · Overdue key dates · Blocked tasks
 *  2. Toolbar: search + status filter chips + smart filter chips + view toggle
 *  3. View body: Board (kanban by project status) / List (dense table) / Timeline (by target open date)
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ClipboardList,
  ClipboardCheck,
  BookOpen,
  Calendar,
  AlertTriangle,
  CircleDot,
  LayoutGrid,
  List as ListIcon,
  CalendarClock,
  Star,
  Flame,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PROJECT_STATUS_LABELS,
  ONBOARDING_PROJECT_STATUSES,
  type OnboardingProjectStatus,
} from "@/lib/onboarding/types";
import type { ProjectWithStats } from "@/lib/onboarding/actions";
import {
  PROJECT_STATUS_TONE,
  formatDate,
  formatDateShort,
  formatRelative,
  daysUntil,
  isOverdue,
  pipelineIndex,
  isOffPipeline,
  PROJECT_PIPELINE,
} from "@/lib/onboarding/utils";

type Props = { projects: ProjectWithStats[] };

type ViewMode = "board" | "list" | "timeline";
type SmartFilter = "blockers" | "upcoming_target" | "overdue_keys" | null;

export function ProjectsDirectory({ projects }: Props) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<OnboardingProjectStatus | "all">("all");
  const [smart, setSmart] = useState<SmartFilter>(null);
  const [view, setView] = useState<ViewMode>("board");

  // --- rollup for summary bar (over full, unfiltered project list) ----------
  const rollup = useMemo(() => {
    const active = projects.filter(
      (p) => p.status !== "done" && p.status !== "no_longer_onboarding",
    );
    const upcomingTarget = active.filter((p) => {
      const d = daysUntil(p.target_open_date);
      return d !== null && d >= 0 && d <= 14;
    });
    const overdueKeys = active.reduce(
      (sum, p) => sum + p.stats.overdueKeyDates,
      0,
    );
    const blockedTasks = active.reduce((sum, p) => sum + p.stats.blocked, 0);
    return {
      active: active.length,
      upcomingTarget: upcomingTarget.length,
      overdueKeys,
      blockedTasks,
    };
  }, [projects]);

  // --- filter projects ------------------------------------------------------
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (needle) {
        const hit = [p.property_nickname, p.owner_name, p.owner_email]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(needle));
        if (!hit) return false;
      }
      if (smart === "blockers" && p.stats.blocked === 0) return false;
      if (smart === "upcoming_target") {
        const d = daysUntil(p.target_open_date);
        if (!(d !== null && d >= 0 && d <= 14)) return false;
      }
      if (smart === "overdue_keys" && p.stats.overdueKeyDates === 0) return false;
      return true;
    });
  }, [projects, q, statusFilter, smart]);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile
          icon={<CircleDot className="h-4 w-4 text-haven-coral-700" />}
          label="Active projects"
          value={rollup.active}
        />
        <SummaryTile
          icon={<CalendarClock className="h-4 w-4 text-amber-700" />}
          label="Target open ≤14 days"
          value={rollup.upcomingTarget}
          onClick={() =>
            setSmart(smart === "upcoming_target" ? null : "upcoming_target")
          }
          active={smart === "upcoming_target"}
        />
        <SummaryTile
          icon={<AlertTriangle className="h-4 w-4 text-rose-700" />}
          label="Overdue key dates"
          value={rollup.overdueKeys}
          onClick={() =>
            setSmart(smart === "overdue_keys" ? null : "overdue_keys")
          }
          active={smart === "overdue_keys"}
        />
        <SummaryTile
          icon={<Flame className="h-4 w-4 text-rose-700" />}
          label="Blocked tasks"
          value={rollup.blockedTasks}
          onClick={() => setSmart(smart === "blockers" ? null : "blockers")}
          active={smart === "blockers"}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search property or owner…"
              className="pl-9"
            />
          </div>
          <ViewToggle value={view} onChange={setView} />
          <Link
            href="/onboarding/clean-transition"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-surface-alt hover:text-foreground"
          >
            <ClipboardCheck className="h-4 w-4" />
            Clean Transition
          </Link>
          <a
            href="/knowledge"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-surface-alt hover:text-foreground"
          >
            <BookOpen className="h-4 w-4" />
            Knowledge Base
          </a>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <StatusPill
            label="All"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            count={projects.length}
          />
          {ONBOARDING_PROJECT_STATUSES.map((s) => {
            const count = projects.filter((p) => p.status === s).length;
            if (count === 0 && statusFilter !== s) return null;
            return (
              <StatusPill
                key={s}
                label={PROJECT_STATUS_LABELS[s]}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                count={count}
              />
            );
          })}
          {smart !== null ? (
            <button
              type="button"
              onClick={() => setSmart(null)}
              className="ml-auto text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Clear smart filter
            </button>
          ) : null}
        </div>
      </div>

      {/* Body */}
      {projects.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground px-4 py-8">
          No projects match your filters.
        </p>
      ) : view === "board" ? (
        <BoardView projects={filtered} />
      ) : view === "list" ? (
        <ListView projects={filtered} />
      ) : (
        <TimelineView projects={filtered} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary tiles
// ---------------------------------------------------------------------------

function SummaryTile({
  icon,
  label,
  value,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onClick?: () => void;
  active?: boolean;
}) {
  const clickable = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={
        "text-left rounded-card border p-4 transition-all " +
        (active
          ? "border-foreground bg-accent-soft shadow-card"
          : "border-border bg-surface hover:border-foreground/30 " +
            (clickable ? "cursor-pointer" : "cursor-default"))
      }
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-heading text-2xl font-bold">{value}</div>
      {clickable ? (
        <div className="mt-1 text-[10px] text-muted-foreground">
          {active ? "Filtering" : "Click to filter"}
        </div>
      ) : null}
    </button>
  );
}

// ---------------------------------------------------------------------------
// View toggle
// ---------------------------------------------------------------------------

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const opts: { v: ViewMode; label: string; icon: React.ReactNode }[] = [
    { v: "board", label: "Board", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { v: "list", label: "List", icon: <ListIcon className="h-3.5 w-3.5" /> },
    {
      v: "timeline",
      label: "Timeline",
      icon: <CalendarClock className="h-3.5 w-3.5" />,
    },
  ];
  return (
    <div className="inline-flex items-center rounded-pill border border-border bg-surface-alt p-0.5">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={
            "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[12px] font-semibold transition-colors " +
            (value === o.v
              ? "bg-foreground text-background"
              : "text-foreground/70 hover:text-foreground")
          }
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status pill (reused for filter chips)
// ---------------------------------------------------------------------------

function StatusPill({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold border transition-colors " +
        (active
          ? "bg-foreground text-background border-foreground"
          : "bg-surface-alt text-foreground/70 border-border hover:bg-surface")
      }
    >
      {label}
      <span
        className={
          "rounded-full px-1.5 py-0.5 text-[10px] " +
          (active ? "bg-background/20" : "bg-surface")
        }
      >
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Board view — kanban grouped by project status
// ---------------------------------------------------------------------------

function BoardView({ projects }: { projects: ProjectWithStats[] }) {
  // Five columns — on_hold shown as the last lane.
  const cols: OnboardingProjectStatus[] = [
    "onboarding",
    "owner_relations_onboarding",
    "ready_to_pass",
    "done",
    "on_hold",
  ];
  const groups = new Map<OnboardingProjectStatus, ProjectWithStats[]>();
  for (const c of cols) groups.set(c, []);
  for (const p of projects) {
    if (p.status === "no_longer_onboarding") continue; // hide archived from board
    const arr = groups.get(p.status);
    if (arr) arr.push(p);
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      {cols.map((c) => {
        const items = groups.get(c) ?? [];
        return (
          <div
            key={c}
            className="rounded-card border border-border bg-surface-alt/30 p-3 flex flex-col gap-3 min-h-[120px]"
          >
            <div className="flex items-center justify-between">
              <Badge tone={PROJECT_STATUS_TONE[c]} dot>
                {PROJECT_STATUS_LABELS[c]}
              </Badge>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((p) => (
                <ProjectCard key={p.id} project={p} dense />
              ))}
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No projects
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// List view — dense table-like rows
// ---------------------------------------------------------------------------

function ListView({ projects }: { projects: ProjectWithStats[] }) {
  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden">
      <div className="grid grid-cols-[minmax(200px,2fr)_1.2fr_1fr_1fr_90px_auto] gap-3 px-4 py-2.5 border-b border-border bg-surface-alt/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Property</div>
        <div>Stage</div>
        <div>Target open</div>
        <div>Next key date</div>
        <div className="text-right">Progress</div>
        <div />
      </div>
      <ul className="divide-y divide-border">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/onboarding/${p.id}` as never}
              className="grid grid-cols-[minmax(200px,2fr)_1.2fr_1fr_1fr_90px_auto] gap-3 items-center px-4 py-3 hover:bg-surface-alt/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">
                  {p.property_nickname}
                </div>
                {p.owner_name ? (
                  <div className="text-xs text-muted-foreground truncate">
                    {p.owner_name}
                  </div>
                ) : null}
              </div>
              <div>
                <StagePipeline status={p.status} compact />
              </div>
              <div className="text-xs">
                {p.target_open_date ? (
                  <div
                    className={
                      isOverdue(p.target_open_date) &&
                      p.status !== "done" &&
                      p.status !== "no_longer_onboarding"
                        ? "text-rose-700 font-semibold"
                        : ""
                    }
                  >
                    {formatDate(p.target_open_date)}
                    <span className="text-muted-foreground ml-1">
                      ({formatRelative(p.target_open_date)})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div className="text-xs min-w-0">
                {p.stats.nextKeyDate ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="truncate">
                      {p.stats.nextKeyDate.title}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {formatDateShort(p.stats.nextKeyDate.due_date)}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div className="text-right">
                <ProgressBar percent={p.stats.percentComplete} width="w-20" />
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline view — grouped by target open date bucket
// ---------------------------------------------------------------------------

function TimelineView({ projects }: { projects: ProjectWithStats[] }) {
  // Sort by target_open_date ascending, null dates at end.
  const sorted = [...projects].sort((a, b) => {
    const da = a.target_open_date;
    const db = b.target_open_date;
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da < db ? -1 : 1;
  });

  const buckets = new Map<string, ProjectWithStats[]>();
  for (const p of sorted) {
    const key = bucketForProject(p);
    const arr = buckets.get(key) ?? [];
    arr.push(p);
    buckets.set(key, arr);
  }

  const order: { key: string; label: string }[] = [
    { key: "overdue", label: "Overdue" },
    { key: "this_week", label: "Opens this week" },
    { key: "next_two", label: "Opens in next two weeks" },
    { key: "this_month", label: "Later this month" },
    { key: "later", label: "Later" },
    { key: "no_date", label: "No target date" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {order.map((b) => {
        const items = buckets.get(b.key);
        if (!items || items.length === 0) return null;
        return (
          <section key={b.key} className="flex flex-col gap-2">
            <div className="haven-eyebrow flex items-center gap-2">
              <CalendarClock className="h-3 w-3" />
              {b.label}
              <span className="text-muted-foreground">· {items.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function bucketForProject(p: ProjectWithStats): string {
  const d = daysUntil(p.target_open_date);
  if (d === null) return "no_date";
  if (d < 0) return "overdue";
  if (d <= 7) return "this_week";
  if (d <= 14) return "next_two";
  if (d <= 30) return "this_month";
  return "later";
}

// ---------------------------------------------------------------------------
// Rich project card — used by Board + Timeline views
// ---------------------------------------------------------------------------

function ProjectCard({
  project,
  dense = false,
}: {
  project: ProjectWithStats;
  dense?: boolean;
}) {
  const { stats } = project;
  const targetOverdue =
    project.target_open_date &&
    isOverdue(project.target_open_date) &&
    project.status !== "done" &&
    project.status !== "no_longer_onboarding";

  return (
    <Link
      href={`/onboarding/${project.id}` as never}
      className={
        "haven-card rounded-card transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-3 " +
        (dense ? "p-3" : "p-4")
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className={"font-heading font-bold truncate " + (dense ? "text-sm" : "text-base")}>
            {project.property_nickname}
          </h3>
          {project.owner_name ? (
            <p className="text-xs text-muted-foreground truncate">
              {project.owner_name}
            </p>
          ) : null}
        </div>
        {stats.blocked > 0 ? (
          <span
            title={`${stats.blocked} blocked tasks`}
            className="inline-flex items-center gap-1 rounded-pill bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200"
          >
            <Flame className="h-2.5 w-2.5" />
            {stats.blocked}
          </span>
        ) : null}
      </div>

      {/* Pipeline */}
      <StagePipeline status={project.status} compact={dense} />

      {/* Progress */}
      <div className="flex items-center gap-2">
        <ProgressBar percent={stats.percentComplete} />
        <span className="text-[11px] font-semibold text-foreground/80 tabular-nums shrink-0">
          {stats.percentComplete}%
        </span>
      </div>

      {/* Key dates + target open */}
      <div className="flex flex-col gap-1.5 text-[11px]">
        {project.target_open_date ? (
          <div
            className={
              "flex items-center gap-1.5 " +
              (targetOverdue ? "text-rose-700 font-semibold" : "text-muted-foreground")
            }
          >
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">
              Target open {formatDateShort(project.target_open_date)}
              <span className="opacity-70">
                {" · "}
                {formatRelative(project.target_open_date)}
              </span>
            </span>
          </div>
        ) : null}
        {stats.nextKeyDate ? (
          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
            <span className="truncate">
              {stats.nextKeyDate.title}
              <span className="opacity-70">
                {" · "}
                {formatRelative(stats.nextKeyDate.due_date)}
              </span>
            </span>
          </div>
        ) : null}
        {stats.overdueKeyDates > 0 ? (
          <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {stats.overdueKeyDates} overdue key date
            {stats.overdueKeyDates === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Stage pipeline — visual project-status progress
// ---------------------------------------------------------------------------

function StagePipeline({
  status,
  compact = false,
}: {
  status: OnboardingProjectStatus;
  compact?: boolean;
}) {
  if (isOffPipeline(status)) {
    return (
      <div className="flex items-center gap-2">
        <Badge tone={PROJECT_STATUS_TONE[status]} dot>
          {PROJECT_STATUS_LABELS[status]}
        </Badge>
      </div>
    );
  }
  const idx = pipelineIndex(status);
  return (
    <div className="flex items-center gap-1">
      {PROJECT_PIPELINE.map((stage, i) => {
        const reached = i <= idx;
        const current = i === idx;
        return (
          <div
            key={stage.key}
            className="flex-1 flex items-center gap-1 min-w-0"
          >
            <div
              title={stage.label}
              className={
                "h-1.5 flex-1 rounded-full " +
                (current
                  ? "bg-haven-coral-600"
                  : reached
                  ? "bg-emerald-500"
                  : "bg-surface-alt")
              }
            />
          </div>
        );
      })}
      {!compact ? (
        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
          {PROJECT_PIPELINE[Math.max(0, idx)]?.label ?? ""}
        </span>
      ) : null}
    </div>
  );
}

function ProgressBar({
  percent,
  width = "w-full",
}: {
  percent: number;
  width?: string;
}) {
  return (
    <div
      className={`h-1.5 ${width} rounded-full bg-surface-alt overflow-hidden flex-1`}
    >
      <div
        className="h-full bg-haven-coral-600 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="rounded-card border border-dashed border-border bg-surface-alt/50 p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
        <ClipboardList className="h-6 w-6 text-haven-coral-700" />
      </div>
      <h3 className="mt-3 text-lg font-semibold">No onboarding projects yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first project to spawn the full onboarding task template.
      </p>
      <Link
        href={"/onboarding/new" as never}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-95"
      >
        + New Project
      </Link>
    </div>
  );
}
