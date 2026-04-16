import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { getGlobalTasks, getSpaces, getMembers } from "@/lib/work/actions";
import { GlobalTasksView } from "@/components/work/global-tasks-view";
import type { GlobalTaskFilters, TaskPriority } from "@/lib/work/types";

export const metadata: Metadata = {
  title: "All Tasks — Haven OS",
};

/**
 * Server component — reads filters from searchParams, fetches seed data,
 * then passes everything down to the client GlobalTasksView.
 */
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  function str(v: string | string[] | undefined): string | undefined {
    return Array.isArray(v) ? v[0] : v;
  }
  function arr(v: string | string[] | undefined): string[] {
    if (!v) return [];
    return Array.isArray(v) ? v : v.split(",").filter(Boolean);
  }

  const filters: GlobalTaskFilters = {
    search: str(sp.search),
    statuses: arr(sp.statuses),
    priorities: arr(sp.priorities) as TaskPriority[],
    assignee_ids: arr(sp.assignee_ids),
    list_ids: arr(sp.list_ids),
    space_ids: arr(sp.space_ids),
    due: (str(sp.due) as GlobalTaskFilters["due"]) ?? "all",
    include_archived: sp.include_archived === "true",
    include_completed: sp.include_completed === "true",
  };

  const [tasks, spaces, members] = await Promise.all([
    getGlobalTasks(filters).catch(() => []),
    getSpaces().catch(() => []),
    getMembers().catch(() => []),
  ]);

  return (
    <GlobalTasksView
      initialTasks={tasks}
      spaces={spaces}
      members={members}
      initialFilters={filters}
    />
  );
}
