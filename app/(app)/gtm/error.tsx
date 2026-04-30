"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function GtmError({
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
      title="Couldn't load GTM"
      description="Go-to-market data didn't come back from the server. Try again."
    />
  );
}
