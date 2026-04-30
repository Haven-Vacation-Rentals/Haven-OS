import { TableSkeleton, Skeleton } from "@/components/shell/loading-skeleton";

export default function PropertiesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <TableSkeleton rows={10} />
    </div>
  );
}
