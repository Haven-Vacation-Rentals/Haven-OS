import type { Metadata } from "next";

export const dynamic = "force-dynamic";

import { getGlobalTasks, getSpaces, getMembers } from "@/lib/work/actions";
import { GlobalTasksView } from "@/components/work/global-tasks-view";
import type { GlobalTaskFilters, TaskPriority } from "@/lib/work/types";
import { requireUser } from "@/lib/auth/user";

export const metadata: Metadata = {
  title: "My Tasks — Haven OS",
};

/**
 * My Tasks — a user-scoped variant of the global tasks view.
 *
 * Always forces `assignee_ids = [currentUserId]` so only the signed-in user's
 * assigned tasks are shown. Other filters (search/status/priority/list/due)
 * are still controllable via URL params, matching `/work/tasks`.
 */
export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);

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
    // Force: always scope to the current user, regardless of URL.
    assignee_ids: [user.id],
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
    <div className="flex h-full flex-col gap-4">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-heading text-display-3 font-bold">My Tasks</h1>
          <p className="text-[13px] text-muted-foreground">
            Everything assigned to you across every list.
          </p>
        </div>
        <span className="text-[12px] font-medium text-muted-foreground">
          {tasks.length} open
        </span>
      </header>

      <div className="flex-1 min-h-0">
        <GlobalTasksView
          initialTasks={tasks}
          spaces={spaces}
          members={members}
          initialFilters={filters}
          hideAssigneeFilter
        />
      </div>
    </div>
  );
}
