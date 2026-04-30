"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function SalesError({
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
      title="Couldn't load Sales"
      description="Sales pitches didn't come back from the server. Try again."
    />
  );
}
