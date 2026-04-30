/**
 * Reusable skeleton primitives for `loading.tsx` boundaries.
 * Animated shimmer driven by Tailwind's `animate-pulse`.
 */

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60 dark:bg-muted/30",
        className,
      )}
    />
  );
}

export function PageSkeleton({
  title = true,
  rows = 6,
}: {
  title?: boolean;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      {title ? (
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
      ) : null}
      <div className="rounded-card border border-border bg-surface p-4 shadow-card">
        <Skeleton className="mb-3 h-9 w-full" />
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="border-b border-border bg-surface-alt/40 px-3 py-2">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5"
          >
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-card border border-border bg-surface p-4 shadow-card"
        >
          <Skeleton className="mb-3 h-5 w-3/4" />
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
