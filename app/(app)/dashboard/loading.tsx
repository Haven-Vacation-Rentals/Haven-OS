import { Skeleton } from "@/components/shell/loading-skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="aspect-video w-full max-w-3xl" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
