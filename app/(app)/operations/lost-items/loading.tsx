import { Skeleton } from "@/components/shell/loading-skeleton";

export default function LostItemsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-40" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-card border border-border bg-surface-alt/30 p-3"
          >
            <Skeleton className="mb-3 h-4 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((__, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
