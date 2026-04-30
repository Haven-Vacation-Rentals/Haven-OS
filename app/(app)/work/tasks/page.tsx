import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import {
  getGlobalTasksPaginated,
  getSpaces,
  getMembers,
} from "@/lib/work/actions";
import { GlobalTasksView } from "@/components/work/global-tasks-view";
import type { GlobalTaskFilters, TaskPriority } from "@/lib/work/types";

export const metadata: Metadata = {
  title: "All Tasks — Haven OS",
};

const DEFAULT_PAGE_SIZE = 100;

/**
 * Server component — reads filters from searchParams, fetches a page of
 * tasks (defaults to 100), then passes everything down to the client
 * GlobalTasksView. Pagination state is mirrored in the URL so links and
 * refreshes stay consistent.
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

  const page = Math.max(0, Number.parseInt(str(sp.page) ?? "0", 10) || 0);

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
    page,
    page_size: DEFAULT_PAGE_SIZE,
  };

  const [paginated, spaces, members] = await Promise.all([
    getGlobalTasksPaginated(filters).catch(() => ({
      tasks: [],
      total: 0,
      page: 0,
      page_size: DEFAULT_PAGE_SIZE,
      has_more: false,
    })),
    getSpaces().catch(() => []),
    getMembers().catch(() => []),
  ]);

  return (
    <GlobalTasksView
      initialTasks={paginated.tasks}
      total={paginated.total}
      page={paginated.page}
      pageSize={paginated.page_size}
      hasMore={paginated.has_more}
      spaces={spaces}
      members={members}
      initialFilters={filters}
    />
  );
}
