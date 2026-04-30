"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function WorkError({
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
      title="Couldn't load work"
      description="Tasks didn't come back from the server. Try again — your filters are preserved."
    />
  );
}
