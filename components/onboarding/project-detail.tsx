"use client";

/**
 * ProjectDetail — orchestrator for a single onboarding project.
 *
 * Sections:
 *  - Back link
 *  - Hero (inline-editable project fields + stage pipeline + progress)
 *  - Tabs: Overview (default) / Checklist / Timeline / By Department / Kanban
 *  - TaskDrawer (right-side slide panel, opens when any task is clicked)
 *
 * Keyboard:
 *  - Esc closes the drawer (Radix handles it automatically).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type {
  OnboardingProjectTree,
  OnboardingTaskNode,
} from "@/lib/onboarding/types";
import { ProjectHero } from "@/components/onboarding/detail/hero";
import { OverviewTab } from "@/components/onboarding/detail/overview-tab";
import { ChecklistTab } from "@/components/onboarding/detail/checklist-tab";
import { TimelineTab } from "@/components/onboarding/detail/timeline-tab";
import { ByDeptTab } from "@/components/onboarding/detail/by-dept-tab";
import { KanbanTab } from "@/components/onboarding/detail/kanban-tab";
import { TaskDrawer } from "@/components/onboarding/detail/task-drawer";

type Props = { tree: OnboardingProjectTree };

export function ProjectDetail({ tree }: Props) {
  const { project, tasks, totals } = tree;
  const flat = useMemo(() => flattenTasks(tasks), [tasks]);

  // Drawer state — stores the task id so we can re-resolve against the
  // freshly-fetched tree after server actions revalidate.
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const openTask = useMemo<OnboardingTaskNode | null>(() => {
    if (!openTaskId) return null;
    return flat.find((t) => t.id === openTaskId) ?? null;
  }, [flat, openTaskId]);

  // If the task was deleted while the drawer was open, close it.
  useEffect(() => {
    if (openTaskId && !openTask) setOpenTaskId(null);
  }, [openTask, openTaskId]);

  const handleOpenTask = (t: OnboardingTaskNode) => setOpenTaskId(t.id);

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

      {/* Hero */}
      <ProjectHero project={project} totals={totals} />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="by-dept">By Department</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab flatTasks={flat} onOpenTask={handleOpenTask} />
        </TabsContent>

        <TabsContent value="checklist">
          <ChecklistTab
            projectId={project.id}
            tasks={tasks}
            onOpenTask={handleOpenTask}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineTab tasks={flat} onOpenTask={handleOpenTask} />
        </TabsContent>

        <TabsContent value="by-dept">
          <ByDeptTab tasks={flat} onOpenTask={handleOpenTask} />
        </TabsContent>

        <TabsContent value="kanban">
          <KanbanTab tasks={flat} onOpenTask={handleOpenTask} />
        </TabsContent>
      </Tabs>

      {/* Right-side task drawer */}
      <TaskDrawer
        task={openTask}
        open={openTask !== null}
        onOpenChange={(v) => {
          if (!v) setOpenTaskId(null);
        }}
      />
    </div>
  );
}

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
