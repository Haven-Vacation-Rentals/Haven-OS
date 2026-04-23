"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ClipboardList, Star, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PROJECT_STATUS_LABELS,
  ONBOARDING_PROJECT_STATUSES,
  type DbOnboardingProject,
  type OnboardingProjectStatus,
} from "@/lib/onboarding/types";
import { PROJECT_STATUS_TONE, formatDate } from "@/lib/onboarding/utils";

type Props = { projects: DbOnboardingProject[] };

export function ProjectsDirectory({ projects }: Props) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<OnboardingProjectStatus | "all">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!needle) return true;
      return [p.property_nickname, p.owner_name, p.owner_email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(needle));
    });
  }, [projects, q, statusFilter]);

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by property nickname or owner…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <StatusPill
          label="All"
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
          count={projects.length}
        />
        {ONBOARDING_PROJECT_STATUSES.map((s) => {
          const count = projects.filter((p) => p.status === s).length;
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
      </div>

      {/* Project grid */}
      {projects.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground px-4 py-8">
          No projects match your filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

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

function ProjectCard({ project }: { project: DbOnboardingProject }) {
  return (
    <Link
      href={`/onboarding/${project.id}` as never}
      className="haven-card rounded-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-bold truncate">
            {project.property_nickname}
          </h3>
          {project.owner_name ? (
            <p className="text-sm text-muted-foreground truncate">
              {project.owner_name}
            </p>
          ) : null}
        </div>
        <Badge tone={PROJECT_STATUS_TONE[project.status]} dot>
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {project.start_date ? (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Start: {formatDate(project.start_date)}
          </div>
        ) : null}
        {project.target_open_date ? (
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" />
            Target open: {formatDate(project.target_open_date)}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

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
