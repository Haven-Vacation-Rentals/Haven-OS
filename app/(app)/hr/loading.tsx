import { GridSkeleton, Skeleton } from "@/components/shell/loading-skeleton";

export default function HrLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-32" />
      <GridSkeleton count={8} />
    </div>
  );
}
