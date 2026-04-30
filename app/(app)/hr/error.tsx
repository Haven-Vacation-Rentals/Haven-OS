"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function HrError({
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
      title="Couldn't load HR"
      description="HR data didn't come back from the server. Try again."
    />
  );
}
