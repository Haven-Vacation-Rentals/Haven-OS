import { GridSkeleton } from "@/components/shell/loading-skeleton";

export default function ContentLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-6 w-40 animate-pulse rounded bg-muted/60 dark:bg-muted/30" />
      <GridSkeleton count={6} />
    </div>
  );
}
