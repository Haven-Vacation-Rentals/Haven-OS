import { TableSkeleton } from "@/components/shell/loading-skeleton";

export default function MyTasksLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-6 w-32 animate-pulse rounded bg-muted/60 dark:bg-muted/30" />
      <TableSkeleton rows={8} />
    </div>
  );
}
