import type { Metadata } from "next";

export const dynamic = "force-dynamic";

import {
  getOrCreatePersonalList,
  getStatuses,
  getCustomFieldDefs,
  getListMembers,
  getMembers,
  getTasksForListView,
} from "@/lib/work/actions";
import { ListViewTable } from "@/components/work/list-view-table";
import { requireUser } from "@/lib/auth/user";

export const metadata: Metadata = {
  title: "My Tasks — Haven OS",
};

/**
 * My Tasks — the signed-in user's personal list.
 *
 * Lives at the top level of the (app) shell so it bypasses the Work layout
 * (no Spaces tree sidebar). Uses the exact same ListViewTable as every
 * other list, so `+ Add task`, drag-reorder, status pills, etc. all work.
 */
export default async function MyTasksPage() {
  const user = await requireUser();
  const list = await getOrCreatePersonalList();

  const [tasks, statuses, fieldDefs, listMembers, allMembers] =
    await Promise.all([
      getTasksForListView(list.id),
      getStatuses(list.id),
      getCustomFieldDefs(list.id),
      getListMembers(list.id),
      getMembers(),
    ]);

  // Personal list members: at minimum, the owner. Mirror the shape used by
  // /work/list/[listId]/page.tsx.
  const memberIdSet = new Set(listMembers.map((m) => m.profile_id));
  memberIdSet.add(user.id);
  const members = allMembers.filter((m) => memberIdSet.has(m.id));

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-heading text-display-3 font-bold">My Tasks</h1>
          <p className="text-[13px] text-muted-foreground">
            Your personal task list — private to you.
          </p>
        </div>
        <span className="text-[12px] font-medium text-muted-foreground">
          {tasks.length} total
        </span>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <ListViewTable
          list={list}
          tasks={tasks}
          statuses={statuses}
          fieldDefs={fieldDefs}
          members={members}
        />
      </div>
    </div>
  );
}
