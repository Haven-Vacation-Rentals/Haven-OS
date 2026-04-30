"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function LostItemsError({
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
      title="Couldn't load Lost Items"
      description="The case board didn't come back from the server. Try again."
    />
  );
}
