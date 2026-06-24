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
      title="Couldn't load Paid Advertising"
      description="The paid-ads pipeline didn't come back from the server. Try again."
    />
  );
}
