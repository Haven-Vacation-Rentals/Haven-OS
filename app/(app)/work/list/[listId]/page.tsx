import { notFound } from "next/navigation";
import {
  getList,
  getTasks,
  getStatuses,
  getCustomFieldDefs,
} from "@/lib/work/actions";
import { ListView } from "@/components/work/list-view";
import { Badge } from "@/components/ui/badge";

export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;

  const [list, tasks, statuses, fieldDefs] = await Promise.all([
    getList(listId),
    getTasks(listId),
    getStatuses(listId),
    getCustomFieldDefs(listId),
  ]);

  if (!list) notFound();

  const total = tasks.length;
  const done = tasks.filter(
    (t) =>
      t.status?.category === "done" || t.status?.category === "closed",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* List header */}
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-display-4 font-bold tracking-tight">
          {list.name}
        </h1>
        <Badge tone="neutral">
          {done}/{total} done
        </Badge>
      </div>

      {list.description ? (
        <p className="max-w-2xl text-sm text-muted-foreground">
          {list.description}
        </p>
      ) : null}

      {/* Task list */}
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <ListView
          list={list}
          tasks={tasks}
          statuses={statuses}
          fieldDefs={fieldDefs}
        />
      </div>
    </div>
  );
}
