import { notFound } from "next/navigation";
import {
  getList,
  getStatuses,
  getCustomFieldDefs,
  getListMembers,
  getMembers,
  getTasksForListView,
} from "@/lib/work/actions";
import { ListViewTable } from "@/components/work/list-view-table";

/**
 * List-level page — server component.
 *
 * Fetches all data in parallel and passes down to the client-interactive
 * ListViewTable component. No layout overhead here — the (app) layout
 * already wraps this in the sidebar/shell.
 */
export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;

  // Fetch everything in parallel
  const [list, tasks, statuses, fieldDefs, listMembers, allMembers] =
    await Promise.all([
      getList(listId),
      getTasksForListView(listId),
      getStatuses(listId),
      getCustomFieldDefs(listId),
      getListMembers(listId),
      getMembers(),
    ]);

  if (!list) notFound();

  // Build the member array combining list members with all profile data
  // (list members have the color, but allMembers has full_name + avatar_url)
  const memberIdSet = new Set(listMembers.map((m) => m.profile_id));
  const members = allMembers.filter((m) => memberIdSet.has(m.id));

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <ListViewTable
        list={list}
        tasks={tasks}
        statuses={statuses}
        fieldDefs={fieldDefs}
        members={members}
      />
    </div>
  );
}
