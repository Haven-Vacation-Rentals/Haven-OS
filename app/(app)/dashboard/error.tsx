"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Couldn't load the Board"
      description="The dashboard didn't come back from the server. Try again."
    />
  );
}
