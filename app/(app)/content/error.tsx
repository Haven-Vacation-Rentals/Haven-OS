"use client";

import { ErrorFallback } from "@/components/shell/error-fallback";

export default function ContentError({
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
      title="Couldn't load Content Studio"
      description="The content pipeline didn't come back from the server. Try again."
    />
  );
}
